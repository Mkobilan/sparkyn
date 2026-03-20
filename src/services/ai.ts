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
        const result = await model.generateContent(prompt);
        return JSON.parse(result.response.text());
      } catch (e: any) {
        if (e.message?.includes('429')) {
           console.log("Rate limited (429). Retrying in 2 seconds...");
           await new Promise(r => setTimeout(r, 2000));
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
      // Use -latest suffix which is more consistent for v1beta endpoints
      return await tryGenerate("gemini-1.5-flash-latest");
    } catch (e: any) {
      console.warn("Gemini Failed, attempting Cloudflare Llama-3 fallback...", e.message);
      try {
        const cfRes = await fetch(`${CLOUDFLARE_URL}@cf/meta/llama-3-8b-instruct`, {
            method: 'POST',
            ...CLOUDFLARE_AUTH,
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: 'You are a social media expert. Return ONLY valid JSON.' },
                    { role: 'user', content: prompt }
                ]
            })
        });
        const cfData = await cfRes.json();
        const text = cfData.result.response || cfData.result || "";
        
        // Ultra-aggressive JSON extraction for conversational LLMs
        const match = text.match(/\{[\s\S]*\}/);
        const jsonStr = match ? match[0] : text;
        
        try {
          return JSON.parse(jsonStr);
        } catch (parseErr: any) {
          console.error("Llama-3 JSON parse failure, fallback to safe defaults:", parseErr?.message || parseErr);
          return {
            hook: "🚀 Boost your presence with " + params.businessName,
            caption: params.description + "\n\nFollow us for more updates!",
            cta: "Click the link in our bio to learn more!",
            hashtags: "#" + params.businessName.replace(/\s+/g, '') + " #SocialGrowth #Business"
          };
        }
      } catch (cfErr: any) {
         console.error("Cloudflare also failed:", cfErr.message);
         // Final safety net: even if everything fails, return SOMETHING useful
         return {
            hook: "Discover " + params.businessName,
            caption: params.description,
            cta: "Check it out now!",
            hashtags: "#growth"
         };
      }
    }
  },

  async generateShortVideoScript(description: string, content: string): Promise<{ script: string, imagePrompts: string[] }> {
    try {
      console.log("Generating TikTok short video script via Gemini 1.5-Flash...");
      const prompt = `Write a viral 15-second TikTok video script for: ${description}. Theme: ${content}. 
      Return JSON EXACTLY in this format, with 3 distinct scenes: 
      { 
        "script": "The full spoken voiceover script, exactly 3 sentences long.",
        "imagePrompts": [
          "Detailed Stable Diffusion image prompt for sentence 1 without text",
          "Detailed Stable Diffusion image prompt for sentence 2 without text",
          "Detailed Stable Diffusion image prompt for sentence 3 without text"
        ] 
      }`;
      
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Failed to parse script video JSON");
      
      return JSON.parse(match[0]);

    } catch (error: any) {
      console.warn("Gemini script generation failed, falling back to Cloudflare Llama-3...", error.message);
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
        
        const cfRes = await fetch(`${CLOUDFLARE_URL}@cf/meta/llama-3-8b-instruct`, {
            method: 'POST',
            ...CLOUDFLARE_AUTH,
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: 'You are a social media script expert. Return ONLY valid JSON.' },
                    { role: 'user', content: prompt }
                ]
            })
        });
        const cfData = await cfRes.json();
        const text = cfData.result.response || cfData.result || "";
        const match = text.match(/\{[\s\S]*\}/);
        const jsonStr = match ? match[0] : text;
        
        try {
          return JSON.parse(jsonStr);
        } catch (parseErr: any) {
          console.error("Llama-3 script JSON parse failure:", parseErr.message);
          return {
              script: `Welcome to our page! Check out our amazing content related to ${description}.`,
              imagePrompts: [
                `Cinematic professional photography for ${description}`,
                `Engaging background for ${description}`,
                `High quality aesthetic for ${description}`
              ]
          };
        }
      } catch (cfErr: any) {
        console.error("Cloudflare script also failed:", cfErr.message);
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
    try {
      console.log(`Requesting Cloudflare Edge FLUX.1 AI image (${width}x${height}) for:`, description);
      
      // Inject safety keywords for Wellness/Business prompts to bypass Meta's automated "Ad-Safety" rejectors (Error 324)
      const safetyKeywords = "Organic lifestyle photography, warm and inviting, natural lighting, high-quality professional shot, no before/after, no medical icons, no claims.";
      const imagePrompt = `Breathtaking, hyper-realistic, award-winning 8k photography for: ${description}. Context: ${content}. ${safetyKeywords} NO TEXT ON IMAGE. Cinematic lighting, perfect anatomy, ultra-detailed, depth of field.`;
      
      const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
      const token = process.env.CLOUDFLARE_API_TOKEN;
      if (!accountId || !token) throw new Error("Cloudflare credentials missing.");

      // Utilize the Private Cloudflare Edge Network for guaranteed FLUX uptime and rendering
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          prompt: imagePrompt,
          width: width,
          height: height
        })
      });

      if (!response.ok) {
        throw new Error(`Cloudflare Flux error: ${response.statusText}`);
      }

      // Cloudflare Models periodically switch between Raw Binary streams and Encapsulated JSON payloads.
      // We sniff the physical response header to guarantee we don't accidentally encode a JSON string as a JPEG.
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
      } else {
          const arrayBuffer = await response.arrayBuffer();
          base64Image = Buffer.from(arrayBuffer).toString('base64');
          console.log(`Cloudflare Binary response detected. Size: ${base64Image.length}`);
      }
      
      if (!base64Image || base64Image.length < 100) {
        throw new Error("Cloudflare returned an empty or corrupt image buffer.");
      }
      
      return `data:image/jpeg;base64,${base64Image}`;
      
    } catch (error: any) {
      console.error("Cloudflare FLUX Image generation failed:", error.message);
      
      // Secondary Fallback if Cloudflare blocks a word: Default to Pollinations API
      const seed = Math.floor(Math.random() * 1000000);
      const encodedPrompt = encodeURIComponent(`Breathtaking photography: ${description}. ${content}`.slice(0, 800));
      const fluxUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}&width=${width}&height=${height}&nologo=true&model=flux`;
      
      console.log("Falling back to Public Pollinations FLUX:", fluxUrl);
      
      try {
        const pRes = await fetch(fluxUrl);
        if (pRes.ok) {
           const pBuffer = await pRes.arrayBuffer();
           return `data:image/jpeg;base64,${Buffer.from(pBuffer).toString('base64')}`;
        }
      } catch (pErr) {
        console.error("Pollinations fetch failed too:", pErr);
      }
      
      return fluxUrl;
    }
  }
};
