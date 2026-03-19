const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI("AIzaSyD43wPXuX274vG2d4LBaKd4vm1rg");
async function run() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });
    const result = await model.generateContent('A beautiful social media marketing photo of a coffee cup');
    console.log('Result:', JSON.stringify(result.response, null, 2));
  } catch (e) {
    console.error('ERROR:', e.message);
  }
}
run();
