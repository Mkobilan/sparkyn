import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const aiService = {
  /**
   * Generates social media text content based on business profile
   */
  async generateContent(params: {
    businessName: string;
    industry: string;
    description: string;
    goal: string;
    tone: string;
    platform: 'facebook' | 'instagram' | 'tiktok' | 'youtube';
    websiteUrl?: string;
  }) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      You are a social media marketing expert. Generate a high-converting social media post for the following business: ${params.businessName}, in the ${params.industry} industry.
      
      Business Description: ${params.description}
      Primary Goal: ${params.goal}
      Tone: ${params.tone}
      Platform: ${params.platform}
      ${params.websiteUrl ? `Website: ${params.websiteUrl}` : ""}

      Generate:
      (a) a post caption with relevant hashtags optimized for ${params.platform}
      (b) a short punchy hook line for the beginning
      (c) a call to action ${params.websiteUrl ? `that drives traffic to ${params.websiteUrl}` : "that encourages engagement"}

      Constraints:
      - Under 300 characters for TikTok
      - Under 2200 characters for Instagram
      - Under 500 characters for Facebook
      
      Return the result as JSON with keys: "hook", "caption", "cta", "hashtags".
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    try {
      // Basic JSON extraction (Gemini might wrap it in code blocks)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      console.error("AI Content generation failed to parse JSON:", text);
      return null;
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
