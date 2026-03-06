// Test Gemini API Key
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini() {
  console.log("Testing Gemini API...");
  console.log("API Key:", process.env.GEMINI_API_KEY ? "Set (length: " + process.env.GEMINI_API_KEY.length + ")" : "NOT SET");
  
  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is not set in .env file");
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });
    
    console.log("\nTesting with gemini-flash-lite-latest...");
    const result = await model.generateContent("Say 'Hello' in JSON format: {\"message\": \"Hello\"}");
    const response = await result.response;
    const text = response.text();
    
    console.log("✅ Gemini API is working!");
    console.log("Response:", text);
  } catch (error) {
    console.error("❌ Gemini API Error:");
    console.error("Message:", error.message);
    console.error("Details:", error);
  }
}

testGemini();
