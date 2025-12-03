import { STRIPE_SECRET_KEY } from '../constants';

interface PaymentIntentParams {
  amount: number;
  currency: string;
  description?: string;
}

export const createPaymentIntent = async (
  params: PaymentIntentParams
): Promise<{ clientSecret: string }> => {
  if (!STRIPE_SECRET_KEY) {
    throw new Error('Stripe secret key is not configured.');
  }

  const body = new URLSearchParams({
    amount: params.amount.toString(),
    currency: params.currency,
    'payment_method_types[]': 'card',
  });

  if (params.description) {
    body.append('description', params.description);
  }

  const response = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Stripe error: ${errorText}`);
  }

  const data = await response.json();
  return { clientSecret: data.client_secret };
};
