const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testImageGen() {
  try {
    console.log("Testing Imagen 3 generateImages...");
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: 'A futuristic city skyline at sunset, cyberpunk aesthetic',
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
      }
    });

    const base64Image = response.generatedImages?.[0]?.image?.imageBytes;
    if (base64Image) {
      console.log("✅ Success! Base64 length:", base64Image.length);
    } else {
      console.log("❌ Failed! No imageBytes found. Response:", JSON.stringify(response, null, 2));
    }
  } catch (error) {
    console.error("❌ Error generating image: ", error.message);
  }
}

testImageGen();
