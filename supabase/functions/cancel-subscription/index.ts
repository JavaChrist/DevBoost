// Edge Function : annule l'abonnement Mollie de l'utilisateur courant.
// L'accès Premium reste actif jusqu'à current_period_ends_at (Mollie ne
// rembourse pas le prorata).
import { handleOptions, jsonResponse } from '../_shared/cors.ts';
import { adminClient, getUserFromRequest } from '../_shared/supabaseAdmin.ts';
import { cancelSubscription as mollieCancel } from '../_shared/mollie.ts';

Deno.serve(async (req: Request) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method Not Allowed' }, 405);
  }

  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

    const supabase = adminClient();

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!sub) {
      return jsonResponse({ error: 'Aucun abonnement à annuler.' }, 404);
    }

    // Annule côté Mollie si on a les IDs (sinon : c'était un trial pur).
    if (sub.mollie_customer_id && sub.mollie_subscription_id) {
      try {
        await mollieCancel(sub.mollie_customer_id, sub.mollie_subscription_id);
      } catch (err) {
        // On log mais on ne bloque pas : l'utilisateur veut résilier.
        await supabase.from('payment_events').insert({
          user_id: user.id,
          event_type: 'cancel-subscription:mollie_error',
          mollie_subscription_id: sub.mollie_subscription_id,
          status: 'error',
          raw: { message: (err as Error).message },
        });
      }
    }

    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    await supabase.from('payment_events').insert({
      user_id: user.id,
      event_type: 'cancel-subscription:user_request',
      mollie_subscription_id: sub.mollie_subscription_id ?? null,
      status: 'cancelled',
      raw: {},
    });

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
