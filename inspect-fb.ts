import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: accounts, error } = await supabase
        .from('social_accounts')
        .select('id, platform_name, platform_user_id, metadata, is_active')
        .eq('platform', 'facebook');

    if (error) {
        console.error('Error fetching:', error);
        return;
    }

    console.log(`Found ${accounts?.length} Facebook pages in DB:`);
    accounts?.forEach((acc: any) => {
        console.log(`-----------------------------------`);
        console.log(`ID: ${acc.id}`);
        console.log(`Name: ${acc.platform_name}`);
        console.log(`Page ID: ${acc.platform_user_id}`);
        console.log(`Metadata:`, acc.metadata);
        console.log(`Active: ${acc.is_active}`);
    });
}
check();
