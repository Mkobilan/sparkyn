import { stripe } from '@/lib/stripe';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 1. Get current user session using standard client
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Initialize Admin client for sensitive actions
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 2. Fetch user profile to get stripe_customer_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // 3. Cancel Stripe subscriptions if customer exists
    if (profile?.stripe_customer_id) {
      console.log(`[Delete Account] Canceling subscriptions for Stripe Customer: ${profile.stripe_customer_id}`);
      
      const subscriptions = await stripe.subscriptions.list({
        customer: profile.stripe_customer_id,
        status: 'active',
      });

      for (const sub of subscriptions.data) {
        await stripe.subscriptions.cancel(sub.id);
        console.log(`[Delete Account] Canceled subscription: ${sub.id}`);
      }
    }

    // 4. Delete user from Supabase Auth (this will cascade to profiles if configured)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (deleteError) {
      console.error('Error deleting user from Auth:', deleteError);
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }

    console.log(`[Delete Account] Successfully deleted user: ${userId}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Account Deletion Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
