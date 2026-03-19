import { GoogleGenerativeAI } from "@google/generative-ai";

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

  /**
   * Generates a marketing image prompt and then the image (simulated for now as dual-step or direct)
   * Note: Project IDX uses Gemini 2.5 Flash for image generation mentioned in prompt.
   */
  async generateImage(description: string, content: string) {
    // Current SDK might differ for Image generation (Imagen vs Gemini 2.5 Flash)
    // For now, providing the structure to call the appropriate model
    console.log("Generating image with description:", description);
    // Placeholder for image generation logic
    return "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop"; // Placeholder
  }
};
