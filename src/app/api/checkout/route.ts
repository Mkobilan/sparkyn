import { createClient } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';
import { PRICING_TIERS } from '@/lib/pricing';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tierId = searchParams.get('tier');
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/signup?tier=${tierId}`);
  }

  const tier = PRICING_TIERS.find(t => t.id === tierId) || PRICING_TIERS[1]; // Default to Pro if not found

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: tier.stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        tier: tier.id,
      },
    });

    return NextResponse.redirect(session.url!);
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    const message = encodeURIComponent(error.message || 'Unknown checkout error');
    return NextResponse.redirect(`${origin}/dashboard?error=checkout-failed&message=${message}`);
  }
}
