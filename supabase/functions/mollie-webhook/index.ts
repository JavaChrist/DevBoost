// Edge Function : webhook Mollie.
//
// Mollie envoie POST avec body `id=tr_xxx` (form-urlencoded). On doit GET
// le payment pour avoir l'état détaillé. Selon le contexte :
//
// - sequenceType=first + status=paid : on a un nouveau mandate. On crée
//   la Subscription Mollie et on passe notre row à status='active'.
// - sequenceType=recurring + status=paid : c'est un renouvellement
//   mensuel. On étend current_period_ends_at de +1 mois.
// - status=failed/canceled/expired : on log et éventuellement on
//   désactive l'accès (status='expired' si trial pas actif).
//
// Sécurité : Mollie ne signe pas ses webhooks (par design), mais l'ID
// du payment ne peut pas être deviné (24+ chars). En complément, on
// re-fetch le payment via GET pour s'assurer qu'il existe vraiment.

import { handleOptions, jsonResponse } from '../_shared/cors.ts';
import { adminClient, getEnv } from '../_shared/supabaseAdmin.ts';
import {
  getPayment,
  createSubscription,
  type MolliePayment,
} from '../_shared/mollie.ts';

const PRICE_EUR = '4.99';
const INTERVAL = '1 month';

Deno.serve(async (req: Request) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method Not Allowed' }, 405);
  }

  // Mollie envoie en form-urlencoded ou JSON selon les versions.
  let paymentId: string | null = null;
  try {
    const contentType = req.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const body = await req.json();
      paymentId = body.id ?? null;
    } else {
      const form = await req.formData();
      paymentId = (form.get('id') as string | null) ?? null;
    }
  } catch {
    /* fallthrough */
  }

  if (!paymentId) {
    return jsonResponse({ error: 'Missing payment id' }, 400);
  }

  try {
    const payment = await getPayment(paymentId);
    const supabase = adminClient();

    // Récupère user_id depuis metadata (set lors de createFirstPayment).
    const meta = (payment as unknown as { metadata?: Record<string, unknown> }).metadata ?? {};
    const userId = (meta.supabase_user_id as string) ?? null;

    // Audit log systématique.
    await supabase.from('payment_events').insert({
      user_id: userId,
      event_type: `webhook:${payment.status}`,
      mollie_payment_id: payment.id,
      mollie_subscription_id: payment.subscriptionId ?? null,
      amount_cents: Math.round(parseFloat(payment.amount.value) * 100),
      currency: payment.amount.currency,
      status: payment.status,
      raw: payment,
    });

    if (!userId) {
      // Pas de user_id → on ne peut rien lier. On ack quand même pour
      // que Mollie n'insiste pas.
      return jsonResponse({ ok: true, note: 'no user_id in metadata' });
    }

    if (payment.status === 'paid') {
      if (payment.sequenceType === 'first') {
        await handleFirstPaid(supabase, userId, payment);
      } else if (payment.sequenceType === 'recurring') {
        await handleRecurringPaid(supabase, userId);
      } else {
        // oneoff ou autre : on étend la période d'1 mois quand même.
        await handleRecurringPaid(supabase, userId);
      }
    } else if (
      payment.status === 'failed' ||
      payment.status === 'canceled' ||
      payment.status === 'expired'
    ) {
      // Si c'était un renouvellement → on suspend l'accès.
      if (payment.sequenceType === 'recurring') {
        await supabase
          .from('subscriptions')
          .update({ status: 'expired' })
          .eq('user_id', userId);
      }
      // Pour un first payment échoué, on ne change rien : l'user
      // reste 'free' ou 'trialing' selon son état actuel.
    }

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});

async function handleFirstPaid(
  supabase: ReturnType<typeof adminClient>,
  userId: string,
  payment: MolliePayment,
) {
  // Le mandate est dispo dès qu'un first payment est paid.
  const customerId = payment.customerId;
  if (!customerId) return;

  // Crée la Subscription Mollie pour les renouvellements automatiques.
  const fnHost = `${getEnv('SUPABASE_URL').replace(/\/$/, '')}/functions/v1`;
  const sub = await createSubscription(customerId, {
    amountValue: PRICE_EUR,
    interval: INTERVAL,
    description: 'DevBoost Premium — abonnement mensuel',
    webhookUrl: `${fnHost}/mollie-webhook`,
    metadata: { supabase_user_id: userId },
  });

  const periodStart = new Date();
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await supabase
    .from('subscriptions')
    .upsert(
      {
        user_id: userId,
        status: 'active',
        plan: 'monthly_4_99',
        current_period_started_at: periodStart.toISOString(),
        current_period_ends_at: periodEnd.toISOString(),
        mollie_customer_id: customerId,
        mollie_subscription_id: sub.id,
        mollie_mandate_id: payment.mandateId ?? null,
        cancelled_at: null,
      },
      { onConflict: 'user_id' },
    );
}

async function handleRecurringPaid(
  supabase: ReturnType<typeof adminClient>,
  userId: string,
) {
  // Étend la période payée d'un mois supplémentaire.
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('current_period_ends_at')
    .eq('user_id', userId)
    .maybeSingle();

  const base = existing?.current_period_ends_at
    ? new Date(existing.current_period_ends_at)
    : new Date();
  // Si la période actuelle est déjà terminée, on repart de maintenant.
  const ref = base.getTime() > Date.now() ? base : new Date();
  const next = new Date(ref);
  next.setMonth(next.getMonth() + 1);

  await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_started_at: ref.toISOString(),
      current_period_ends_at: next.toISOString(),
      cancelled_at: null,
    })
    .eq('user_id', userId);
}
