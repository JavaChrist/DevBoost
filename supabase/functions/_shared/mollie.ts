// Mini wrapper Mollie REST API. On évite la dépendance @mollie/api-client
// pour rester léger (Deno + cold start rapide).
//
// Doc : https://docs.mollie.com/reference/v2/

const MOLLIE_BASE = 'https://api.mollie.com/v2';

export interface MollieCustomer {
  id: string;
  name?: string;
  email?: string;
}

export interface MolliePayment {
  id: string;
  status: 'open' | 'pending' | 'paid' | 'canceled' | 'failed' | 'expired' | 'authorized';
  amount: { value: string; currency: string };
  customerId?: string;
  mandateId?: string;
  subscriptionId?: string;
  sequenceType?: 'oneoff' | 'first' | 'recurring';
  _links?: {
    checkout?: { href: string };
  };
}

export interface MollieSubscription {
  id: string;
  status: 'pending' | 'active' | 'canceled' | 'suspended' | 'completed';
  mandateId?: string;
  customerId?: string;
  amount: { value: string; currency: string };
  interval: string;
  nextPaymentDate?: string;
}

function getApiKey(): string {
  const key = Deno.env.get('MOLLIE_API_KEY');
  if (!key) {
    throw new Error('MOLLIE_API_KEY env var manquante');
  }
  return key;
}

async function mollieFetch<T>(
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`${MOLLIE_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const message =
      (data as { detail?: string; title?: string })?.detail ??
      (data as { title?: string })?.title ??
      `Mollie ${res.status}`;
    throw new Error(`Mollie API: ${message}`);
  }
  return data as T;
}

export function createCustomer(input: { name?: string; email: string; metadata?: Record<string, unknown> }) {
  return mollieFetch<MollieCustomer>('POST', '/customers', input);
}

export function createFirstPayment(customerId: string, input: {
  amountValue: string;
  description: string;
  redirectUrl: string;
  webhookUrl: string;
  metadata?: Record<string, unknown>;
}) {
  return mollieFetch<MolliePayment>('POST', `/customers/${customerId}/payments`, {
    amount: { value: input.amountValue, currency: 'EUR' },
    description: input.description,
    sequenceType: 'first',
    redirectUrl: input.redirectUrl,
    webhookUrl: input.webhookUrl,
    metadata: input.metadata,
  });
}

export function getPayment(paymentId: string) {
  return mollieFetch<MolliePayment>('GET', `/payments/${paymentId}`);
}

export function createSubscription(customerId: string, input: {
  amountValue: string;
  interval: string;
  description: string;
  webhookUrl: string;
  startDate?: string;
  mandateId?: string;
  metadata?: Record<string, unknown>;
}) {
  return mollieFetch<MollieSubscription>('POST', `/customers/${customerId}/subscriptions`, {
    amount: { value: input.amountValue, currency: 'EUR' },
    interval: input.interval,
    description: input.description,
    webhookUrl: input.webhookUrl,
    startDate: input.startDate,
    mandateId: input.mandateId,
    metadata: input.metadata,
  });
}

export function cancelSubscription(customerId: string, subscriptionId: string) {
  return mollieFetch<MollieSubscription>(
    'DELETE',
    `/customers/${customerId}/subscriptions/${subscriptionId}`,
  );
}
