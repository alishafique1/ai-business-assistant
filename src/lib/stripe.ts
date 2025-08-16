import { loadStripe } from '@stripe/stripe-js';

export const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!
);

export const STRIPE_PRICE_IDS = {
  BUSINESS_PRO: import.meta.env.VITE_STRIPE_BUSINESS_PRO_PRICE_ID,
  ENTERPRISE: import.meta.env.VITE_STRIPE_ENTERPRISE_PRICE_ID,
} as const;

export type StripePriceId = typeof STRIPE_PRICE_IDS[keyof typeof STRIPE_PRICE_IDS];

export interface StripeProduct {
  id: string;
  name: string;
  priceId: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
}

export const STRIPE_PRODUCTS: StripeProduct[] = [
  {
    id: 'business-pro',
    name: 'Business Pro',
    priceId: STRIPE_PRICE_IDS.BUSINESS_PRO || '',
    price: 29,
    interval: 'month',
    features: [
      'Unlimited AI expense tracking & categorization',
      'Voice assistant with unlimited recording',
      'Complete AI content generation suite',
      'Advanced business analytics & insights',
      'WhatsApp & Telegram integration',
      'Receipt photo processing with AI',
      'Priority email & chat support',
      'Custom expense categories & rules'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceId: STRIPE_PRICE_IDS.ENTERPRISE || '',
    price: 0, // Custom pricing
    interval: 'month',
    features: [
      'Everything in Business Pro',
      'Custom AI model training for your industry',
      'Advanced integrations (Xero, FreshBooks, etc.)',
      'Dedicated account manager',
      '24/7 phone support',
      'Unlimited user accounts',
      'Advanced security & compliance',
      'Custom reporting & analytics',
      'API access for custom integrations'
    ]
  }
];