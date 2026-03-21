import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error(`Webhook signature verification failed: ${error.message}`);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const session = event.data.object as any;

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const userId = session.client_reference_id || session.metadata?.userId;
        const stripeCustomerId = session.customer;
        const tier = session.metadata?.tier || 'free';

        if (userId) {
          const { error } = await supabaseAdmin
            .from('profiles')
            .update({
              subscription_tier: tier,
              stripe_customer_id: stripeCustomerId,
            })
            .eq('id', userId);

          if (error) throw error;
          console.log(`User ${userId} subscribed to ${tier}`);
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeCustomerId = subscription.customer as string;
        
        // Find the user with this customer ID
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', stripeCustomerId)
          .single();

        if (profileError || !profile) break;

        let tier = 'free';
        if (event.type === 'customer.subscription.updated' && subscription.status === 'active') {
          // You might want to map the price ID back to a tier here if needed
          // For now, we'll keep it simple or look at the original tier
        }

        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            subscription_tier: event.type === 'customer.subscription.deleted' ? 'free' : undefined,
          })
          .eq('id', profile.id);

        if (error) throw error;
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing failed:', error);
    return new NextResponse('Webhook handler failed', { status: 500 });
  }
}
