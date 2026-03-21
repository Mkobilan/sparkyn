import { createClient } from '../../../lib/supabase'
import { aiService } from '../../../services/ai'
import { NextResponse } from 'next/server'
import { getTierLimits } from '../../../lib/pricing'

// Content generation is fast (5-10s)
export const maxDuration = 30; 
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { accountId, scheduledAt, isVideo } = await request.json().catch(() => ({}));
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    let query = supabase.from('social_accounts').select('*').eq('user_id', user.id).eq('is_active', true)
    if (accountId) query = query.eq('id', accountId);

    const { data: accounts, error: accountsError } = await query
    if (accountsError || !accounts || accounts.length === 0) {
      return NextResponse.json({ error: 'No active accounts' }, { status: 400 });
    }

    const generatedPosts = []
    const generationErrors: string[] = []
    
    // HARDCODE: Grant unlimited access to the specific developer/test account
    const isUnlimited = user.email === 'matthew.kobilan@gmail.com';
    const tierLimits = isUnlimited 
      ? { postsPerDay: 999, accountsPerPlatform: 999 } 
      : getTierLimits(profile.subscription_tier);

    // Get today's start and end times for limit checking
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    for (const account of accounts) {
      // 0. CHECK DAILY LIMIT
      const { count: todayCount } = await supabase
        .from('scheduled_posts')
        .select('*', { count: 'exact', head: true })
        .eq('platform_account_id', account.id)
        .gte('scheduled_at', todayStart.toISOString())
        .lte('scheduled_at', todayEnd.toISOString());
      
      if ((todayCount || 0) >= tierLimits.postsPerDay) {
        generationErrors.push(`[${account.platform_name}] Daily limit reached (${tierLimits.postsPerDay} posts/day).`);
        continue;
      }

      try {
        const imageContext = `${account.metadata?.industry || profile.industry} business - ${account.metadata?.description || profile.business_description}`;
        const isVideoRequest = account.platform === 'tiktok' || account.platform === 'instagramreels' || account.platform === 'youtube' || isVideo;

        // ── STEP 1: AI CONTENT & SCRIPT GENERATION ──
        console.log(`[Generate] Step 1: AI content generation for ${account.platform}`);
        const [content, videoScript] = await Promise.all([
          aiService.generateContent({
            businessName: account.metadata?.business_name || profile.business_name,
            industry: account.metadata?.industry || profile.industry,
            niche: account.metadata?.niche || profile.niche_description,
            description: account.metadata?.description || profile.business_description,
            goal: account.metadata?.goal || profile.primary_goal,
            tone: account.content_strategy || profile.content_tone,
            platform: account.platform as any,
            websiteUrl: profile.website_url
          }),
          isVideoRequest
            ? aiService.generateShortVideoScript(imageContext, account.metadata?.description || profile.business_description)
            : Promise.resolve(null)
        ]);

        if (!content) throw new Error("AI returned no text content");

        // ── STEP 2: SAVE CONTENT ONLY (Waterfal Step 1) ──
        const scheduledTime = scheduledAt ? new Date(scheduledAt) : new Date();
        
        const { data: post, error: insertError } = await supabase.from('scheduled_posts').insert({
          user_id: user.id,
          platforms: [account.platform],
          platform_account_id: account.id,
          hook: content.hook,
          caption: content.caption,
          cta: content.cta,
          hashtags: [
            `__METADATA__:${JSON.stringify({ 
              videoScript, 
              imageContext, 
              isVideo: isVideoRequest 
            })}`,
            ...(content.hashtags?.split(' ') || [])
          ],
          scheduled_at: scheduledTime.toISOString(),
          status: 'content_ready'
        }).select().single();

        if (insertError) throw insertError;
        if (post) generatedPosts.push(post);

      } catch (loopErr: any) {
        console.error(`[Generate] Fatal failure for ${account.platform_name}:`, loopErr);
        generationErrors.push(`[${account.platform_name}] ${loopErr.message || 'Unknown Failure'}`);
      }
    }

    if (generatedPosts.length === 0) {
      return NextResponse.json({ error: generationErrors.join(' | ') }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      posts: generatedPosts,
      summary: { count: generatedPosts.length },
      errors: generationErrors.length > 0 ? generationErrors : undefined
    });

  } catch (error: any) {
    console.error('[Generate] API 500:', error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
