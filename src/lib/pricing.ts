export const PRICING_TIERS = [
  {
    id: 'basic',
    name: 'Spark Basic',
    price: '$9.99',
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRICE_ID_BASIC || 'price_1TDKnMAgTHBqKLKlb1ywCHzZ',
    description: 'Perfect for getting started with AI automation.',
    features: [
      '1 Social Channel per platform',
      '1 Post per day',
      'Standard AI Image Generation',
      'Email Support',
    ],
    limits: {
      accountsPerPlatform: 1,
      postsPerDay: 1,
    },
  },
  {
    id: 'pro',
    name: 'Spark Pro',
    price: '$19.99',
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRICE_ID_PRO || 'price_1TDKr3AgTHBqKLKlQ0nIrBIe',
    description: 'The ultimate tool for growing creators and brands.',
    features: [
      '3 Social Channels per platform',
      '3 Posts per day / per channel',
      'Priority AI Queue',
      'Advanced Content Strategy',
      'Priority Support',
    ],
    limits: {
      accountsPerPlatform: 3,
      postsPerDay: 3,
    },
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'Spark Enterprise',
    price: '$29.99',
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRICE_ID_ENTERPRISE || 'price_1TDKrxAgTHBqKLKlEKEZqp6b',
    description: 'Scalable automation for agencies and large teams.',
    features: [
      'All social channels available',
      '6 Posts per day / per channel',
      'Priority AI Queue',
      'Everything in Pro',
      'Dedicated Support',
    ],
    limits: {
      accountsPerPlatform: 100, // Effectively unlimited
      postsPerDay: 6,
    },
  },
];

export function getTierLimits(tierId: string | null | undefined) {
  const tier = PRICING_TIERS.find(t => t.id === tierId) || PRICING_TIERS[0]; // Default to first tier (Basic or Free)
  return tier.limits;
}
