import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const newGenAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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

    const tryGenerate = async (modelName: string) => {
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
        }
      });
      const result = await model.generateContent(prompt);
      return JSON.parse(result.response.text());
    }

    try {
      return await tryGenerate("gemini-2.5-flash");
    } catch (e: any) {
      console.error("Primary AI model gemini-2.5-flash failed:", e.message);
      // Let's try WITHOUT the JSON mime type enforcement, just in case 2.5 doesn't like it on v1beta yet
      const fallbackModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await fallbackModel.generateContent(prompt + "\n\nCRITICAL: RETURN ONLY VALID JSON. DO NOT USE MARKDOWN BACKTICKS.");
      let text = result.response.text().trim();
      if (text.startsWith("```json")) text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      else if (text.startsWith("```")) text = text.replace(/```/g, "").trim();
      return JSON.parse(text);
    }
  },

  async generateShortVideoScript(description: string, content: string): Promise<{ script: string, imagePrompts: string[] }> {
    try {
      console.log("Generating TikTok short video script via Gemini...");
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
      
      const response = await newGenAI.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt
      });
      
      const stringText = response.text || '';
      const match = stringText.match(/\{[\s\S]*\}/);
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
      console.log("Requesting Cloudflare Workers AI image for:", description);
      const imagePrompt = `Professional social media marketing photography for: ${description}. Context: ${content}. NO TEXT ON IMAGE. Clean, high quality, cinematic lighting, engaging composition.`;
      
      const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
      const token = process.env.CLOUDFLARE_API_TOKEN;
      if (!accountId || !token) throw new Error("Cloudflare credentials missing.");

      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: imagePrompt })
      });

      if (!response.ok) {
        throw new Error(`Cloudflare error: ${response.statusText} - ${await response.text()}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      // Ensure binary exact buffer encoding 
      const base64Image = Buffer.from(arrayBuffer).toString('base64');
      
      console.log("Successfully generated image via Cloudflare!");
      return `data:image/jpeg;base64,${base64Image}`;
      
    } catch (error: any) {
      console.error("Image generation (Cloudflare) failed:", error.message);
      
      // Since Google's free tier sets the Nano Banana image quota to 0, we fallback to a free public AI image generator!
      const seed = Math.floor(Math.random() * 100000);
      const safePrompt = `Professional social media photography, no text, clean composition: ${description}. ${content}`.slice(0, 800);
      const encodedPrompt = encodeURIComponent(safePrompt);
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}&width=1024&height=1024&nologo=true`;
      
      console.log("Using Pollinations.ai fallback:", pollinationsUrl);
      return pollinationsUrl;
    }
  }
};
