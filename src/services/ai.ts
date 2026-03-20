import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '../lib/supabase-browser'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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
      console.error("Primary AI model failed:", e.message);
      try {
        return await tryGenerate("gemini-1.5-flash");
      } catch (e2: any) {
        console.error("Secondary fallback failed, trying legacy gemini-pro:", e2.message);
        return await tryGenerate("gemini-1.5-pro");
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
      console.error("Video script generation failed:", error.message);
      return {
        script: `Welcome to our page! Check out our amazing content related to ${description}. We guarantee you will love it!`,
        imagePrompts: [
          `Cinematic professional photography for ${description}`,
          `Engaging beautiful background for ${description}`,
          `High quality viral aesthetic for ${description}`
        ]
      };
    }
  },

  async generateImage(description: string, content: string) {
    try {
      console.log("Requesting Cloudflare Edge FLUX.1 AI image for:", description);
      const imagePrompt = `Breathtaking, hyper-realistic, award-winning 8k photography for: ${description}. Context: ${content}. NO TEXT ON IMAGE. Cinematic lighting, perfect anatomy, ultra-detailed, depth of field.`;
      
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
        body: JSON.stringify({ prompt: imagePrompt })
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
      } else {
          const arrayBuffer = await response.arrayBuffer();
          base64Image = Buffer.from(arrayBuffer).toString('base64');
      }
      
      return `data:image/jpeg;base64,${base64Image}`;
      
    } catch (error: any) {
      console.error("Cloudflare FLUX Image generation failed:", error.message);
      
      // Secondary Fallback if Cloudflare blocks a word: Default to Pollinations API
      const seed = Math.floor(Math.random() * 1000000);
      const encodedPrompt = encodeURIComponent(`Breathtaking photography: ${description}. ${content}`.slice(0, 800));
      const fluxUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}&width=768&height=1344&nologo=true&model=flux`;
      
      console.log("Falling back to Public Pollinations FLUX:", fluxUrl);
      return fluxUrl;
    }
  }
};
