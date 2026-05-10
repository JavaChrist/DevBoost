// Edge Function : démarre le flow de souscription Mollie.
//
// Body attendu : { returnUrl?: string, cancelUrl?: string }
// Réponse : { checkoutUrl: string, paymentId: string }
//
// Étapes :
//  1. Récup user depuis le JWT
//  2. Si pas encore de customer Mollie → créer + sauver mollie_customer_id
//  3. Créer un payment "first" (4,99 €) avec sequenceType=first
//     → l'utilisateur paie + on récupère un mandate à validation
//  4. Renvoyer checkoutUrl
//
// La création de la subscription Mollie elle-même est faite dans le
// webhook quand le payment passe en status='paid' (mandate disponible).

import { handleOptions, jsonResponse } from '../_shared/cors.ts';
import { adminClient, getUserFromRequest, getEnv } from '../_shared/supabaseAdmin.ts';
import { createCustomer, createFirstPayment } from '../_shared/mollie.ts';

const PRICE_EUR = '4.99';

Deno.serve(async (req: Request) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method Not Allowed' }, 405);
  }

  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

    let body: { returnUrl?: string; cancelUrl?: string } = {};
    try {
      body = await req.json();
    } catch {
      /* body optionnel */
    }

    const supabase = adminClient();

    // 1. Lire l'éventuelle ligne subscription existante.
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    let customerId = existing?.mollie_customer_id ?? null;

    // 2. Créer customer Mollie si absent.
    if (!customerId) {
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const customer = await createCustomer({
        email: user.email ?? '',
        name: (meta.first_name as string) ?? (meta.firstName as string) ?? user.email ?? '',
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      // Persiste le customer_id immédiatement (utile pour cancel ou retry).
      await supabase
        .from('subscriptions')
        .upsert(
          { user_id: user.id, mollie_customer_id: customerId },
          { onConflict: 'user_id' },
        );
    }

    // 3. Construire URLs callback.
    const origin = req.headers.get('origin') ?? '';
    const fnHost = `${getEnv('SUPABASE_URL').replace(/\/$/, '')}/functions/v1`;
    const returnUrl = body.returnUrl || `${origin}/payment-success`;
    const webhookUrl = `${fnHost}/mollie-webhook`;

    // 4. First payment Mollie.
    const payment = await createFirstPayment(customerId, {
      amountValue: PRICE_EUR,
      description: 'DevBoost Premium — souscription mensuelle',
      redirectUrl: returnUrl,
      webhookUrl,
      metadata: {
        supabase_user_id: user.id,
        purpose: 'first_payment_for_subscription',
      },
    });

    // Log audit.
    await supabase.from('payment_events').insert({
      user_id: user.id,
      event_type: 'create-subscription:first_payment_created',
      mollie_payment_id: payment.id,
      amount_cents: Math.round(parseFloat(payment.amount.value) * 100),
      currency: payment.amount.currency,
      status: payment.status,
      raw: payment,
    });

    const checkoutUrl = payment._links?.checkout?.href;
    if (!checkoutUrl) {
      return jsonResponse({ error: 'Pas de checkout URL renvoyée par Mollie' }, 500);
    }

    return jsonResponse({ checkoutUrl, paymentId: payment.id });
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
