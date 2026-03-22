import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '../lib/supabase-browser'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const CLOUDFLARE_URL = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/`;
const CLOUDFLARE_AUTH = {
    headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}` }
};

export const aiService = {
  /**
   * Generates social media text content based on business profile
   */
  async generateContent(params: {
    businessName: string;
    industry: string;
    niche?: string;
    description: string;
    goal: string;
    tone: string;
    platform: 'facebook' | 'instagram' | 'tiktok' | 'youtube';
    postsPerDay?: number;
    websiteUrl?: string;
  }) {
    const prompt = `
      You are a social media marketing expert. Generate a high-converting social media post for the following business: ${params.businessName}, in the ${params.industry} industry.
      ${params.niche ? `Niche: ${params.niche}` : ""}
      
      Business Description: ${params.description}
      Primary Goal: ${params.goal}
      Tone: ${params.tone}
      Platform: ${params.platform}
      Daily Posting Frequency: ${params.postsPerDay || 1} posts per day.
      ${params.websiteUrl ? `Website: ${params.websiteUrl}` : ""}

      Generate a JSON object with exactly these keys:
      1. "hook": A short, punchy opening line tailored for ${params.platform}.
      2. "caption": The main post body text. Use platform-specific formatting (e.g., spacing for IG, short for TikTok).
      3. "cta": A clear call to action.
      4. "hashtags": A string of 3-5 relevant hashtags.

      CRITICAL: The content must feel native to ${params.platform}. For example:
      - Facebook: Focus on community and engagement.
      - Instagram: Focus on visual storytelling and aesthetics.
      - TikTok: Focus on entertainment, trends, and brevity.
      - YouTube: Focus on catchy titles and educational/entertaining value (Shorts style).
    `;

    const tryGenerate = async (modelName: string): Promise<any> => {
      try {
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
          }
        });
        const result = await Promise.race([
          model.generateContent(prompt),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Gemini timeout (7s)")), 7000))
        ]) as any;
        return JSON.parse(result.response.text());
      } catch (e: any) {
        if (e.message?.includes('429')) {
           console.log("Rate limited (429). Retrying in 1 second...");
           await new Promise(r => setTimeout(r, 1000));
           const model = genAI.getGenerativeModel({ model: modelName });
           const result = await model.generateContent(prompt);
           let t = result.response.text().trim();
           if (t.startsWith("```json")) t = t.replace(/```json/g, "").replace(/```/g, "").trim();
           return JSON.parse(t);
        }
        throw e;
      }
    }

    try {
      return await tryGenerate("gemini-1.5-flash-latest");
    } catch (e: any) {
      console.warn("Gemini Failed/Timed out, attempting fast Cloudflare Llama-3 fallback...", e.message);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2.0s strict fallback
        const cfRes = await fetch(`${CLOUDFLARE_URL}@cf/meta/llama-3-8b-instruct`, {
            method: 'POST',
            ...CLOUDFLARE_AUTH,
            signal: controller.signal,
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: 'You are a social media expert. Return ONLY valid JSON.' },
                    { role: 'user', content: prompt }
                ]
            })
        });
        clearTimeout(timeoutId);
        const cfData = await cfRes.json();
        const text = cfData.result.response || cfData.result || "";
        
        const match = text.match(/\{[\s\S]*\}/);
        const jsonStr = match ? match[0] : text;
        
        try {
          return JSON.parse(jsonStr);
        } catch (parseErr: any) {
          throw new Error("Llama parse error");
        }
      } catch (cfErr: any) {
         console.error("Cloudflare LLM also failed/timed out:", cfErr.message);
         // Strip URLs out of the raw description so Facebook's image upload doesn't trigger Ad-Safety block 100
         const safeDescription = params.description.replace(/https?:\/\/[^\s]+/g, '').substring(0, 250);
         return {
            hook: "Discover " + params.businessName,
            caption: safeDescription + (safeDescription.length >= 250 ? '...' : ''),
            cta: "Check it out now!",
            hashtags: "#growth"
         };
      }
    }
  },

  async generateShortVideoScript(description: string, content: string): Promise<{ script: string, imagePrompts: string[] }> {
    try {
      console.log("Generating TikTok short video script via Gemini 1.5-Flash...");
      const entropySeed = Math.floor(Math.random() * 10000000);
      const prompt = `Write a completely UNIQUE, previously unseen viral 15-second TikTok video script for: ${description}. Theme: ${content}. 
      (Entropy Seed: ${entropySeed} - You MUST generate a fundamentally distinct script from any previous request.)
      Return JSON EXACTLY in this format, with 3 distinct scenes: 
      { 
        "script": "The full spoken voiceover script. Must be 3 sentences and UNDER 45 WORDS TOTAL to fit 15 seconds.",
        "imagePrompts": [
          "Cinematic vertical 9:16 photography of [Scene 1 subject], award-winning, highly detailed, 8k, bokeh, professional lighting, no text",
          "Cinematic vertical 9:16 photography of [Scene 2 subject], award-winning, highly detailed, 8k, bokeh, professional lighting, no text",
          "Cinematic vertical 9:16 photography of [Scene 3 subject], award-winning, highly detailed, 8k, bokeh, professional lighting, no text"
        ] 
      }`;
      
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Gemini script timeout (4.5s)")), 4500))
      ]) as any;
      const text = result.response.text();
      
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Failed to parse script video JSON");
      
      return JSON.parse(match[0]);

    } catch (error: any) {
      console.warn("Gemini script generation failed/timed out, falling back to Llama-3...", error.message);
      try {
        const prompt = `Write a viral 15-second TikTok video script for: ${description}. Theme: ${content}. 
        Return JSON EXACTLY in this format, with 3 distinct scenes: 
        { 
          "script": "The full spoken voiceover script, exactly 3 sentences long.",
          "imagePrompts": [
            "Detailed Stable Diffusion image prompt for scene 1",
            "Detailed Stable Diffusion image prompt for scene 2",
            "Detailed Stable Diffusion image prompt for scene 3"
          ] 
        }`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        
        const cfRes = await fetch(`${CLOUDFLARE_URL}@cf/meta/llama-3-8b-instruct`, {
            method: 'POST',
            ...CLOUDFLARE_AUTH,
            signal: controller.signal,
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: 'You are a social media script expert. Return ONLY valid JSON.' },
                    { role: 'user', content: prompt }
                ]
            })
        });
        clearTimeout(timeoutId);
        const cfData = await cfRes.json();
        const text = cfData.result.response || cfData.result || "";
        const match = text.match(/\{[\s\S]*\}/);
        const jsonStr = match ? match[0] : text;
        
        try {
          return JSON.parse(jsonStr);
        } catch (parseErr: any) {
          throw new Error("Llama parse error");
        }
      } catch (cfErr: any) {
        console.error("Cloudflare script also failed/timed out:", cfErr.message);
        return {
            script: `Welcome to our page! Check out our amazing content related to ${description}. We guarantee you will love it!`,
            imagePrompts: [
              `Cinematic professional photography for ${description}`,
              `Engaging beautiful background for ${description}`,
              `High quality viral aesthetic for ${description}`
            ]
        };
      }
    }
  },

  async generateImage(description: string, content: string, width: number = 1024, height: number = 1024) {
    // SCRUBBER: Neutralize high-risk keywords that trigger Meta's automated "Ad-Safety" (Error 324)
    // This ensures "Health & Wellness" pages produce "Safe Lifestyle" images instead of "Medical" ones.
    const highRiskTerms = [/health/gi, /wellness/gi, /medical/gi, /clinics?/gi, /doctors?/gi, /therap(y|ist)/gi, /weight\s*loss/gi, /fitness/gi];
    let scrubbedDesc = description;
    highRiskTerms.forEach(regex => {
        scrubbedDesc = scrubbedDesc.replace(regex, "Modern Lifestyle");
    });

    try {
      console.log(`Requesting Cloudflare Edge FLUX.1 AI image (${width}x${height}) for:`, scrubbedDesc);
      
      const qualityKeywords = "Breathtaking vertical 9:16 photography, hyper-realistic, award-winning 8k, cinematic lighting, perfect anatomy, ultra-detailed, depth of field, professional color grading, sharp focus.";
      const safetyKeywords = "Organic lifestyle, natural lighting, no before/after, no medical icons, no claims, people enjoying life.";
      const imagePrompt = `${qualityKeywords} for: ${scrubbedDesc}. Context: ${content}. ${safetyKeywords} STRICTLY NO TEXT OR LOGOS ON IMAGE.`;
      
      const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
      const token = process.env.CLOUDFLARE_API_TOKEN;
      if (!accountId || !token) throw new Error("Cloudflare credentials missing.");

      // Maximize Vercel Hobby limits: Allow Cloudflare exact 8.5s. 
      // Supabase upload takes 1.0s, ensuring we finish just under 10.0s!
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8500);

      // SDXL-Lightning natively runs in 1-2 seconds, bypassing all Vercel timeout constraints entirely!
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/bytedance/sdxl-lightning-4step`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        body: JSON.stringify({ 
          prompt: imagePrompt
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Cloudflare Flux error: ${response.statusText}`);
      }

      const contentType = response.headers.get("Content-Type") || "";
      let base64Image = "";
      
      if (contentType.includes("application/json")) {
          const json = await response.json();
          base64Image = json.result?.image || json.image || "";
          console.log(`Cloudflare JSON response detected. Image found: ${!!base64Image}`);
          if (!base64Image && json.errors) {
            console.error("Cloudflare AI Errors:", json.errors);
            throw new Error(`Cloudflare AI Block: ${json.errors[0]?.message || 'Unknown error'}`);
          }
          return `data:image/jpeg;base64,${base64Image}`;
      } else {
          const arrayBuffer = await response.arrayBuffer();
          const isPng = arrayBuffer.byteLength > 8 && 
            new Uint8Array(arrayBuffer.slice(0, 8)).every((byte, i) => [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A][i] === byte);
          const mimeType = isPng ? 'image/png' : 'image/jpeg';
          
          base64Image = Buffer.from(arrayBuffer).toString('base64');
          console.log(`Cloudflare Binary response (${mimeType}). Size: ${base64Image.length}`);
          
          if (!base64Image || base64Image.length < 100) {
            throw new Error("Cloudflare returned an empty or corrupt image buffer.");
          }
          
          return `data:${mimeType};base64,${base64Image}`;
      }
      
    } catch (error: any) {
      console.error("Cloudflare FLUX Image generation failed/timed out:", error.message);
      
      // Secondary Fallback: Return Pollinations AI URL
      // We do NOT fetch the buffer here to save time. The worker will download it directly.
      const seed = Math.floor(Math.random() * 1000000);
      const encodedPrompt = encodeURIComponent(`Breathtaking photography: ${scrubbedDesc}`.slice(0, 80));
      const fallbackUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}&width=${width}&height=${height}&nologo=true&model=turbo`;
      
      console.log("Falling back instantly to Pollinations URL:", fallbackUrl);
      return fallbackUrl;
    }
  }
};
