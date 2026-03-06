// List available Gemini models
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
  console.log("Listing available Gemini models...\n");
  
  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is not set");
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // List models using the API
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + process.env.GEMINI_API_KEY);
    const data = await response.json();
    
    if (data.models) {
      console.log("✅ Available models:");
      data.models.forEach(model => {
        if (model.supportedGenerationMethods?.includes('generateContent')) {
          console.log(`  - ${model.name.replace('models/', '')}`);
          console.log(`    Description: ${model.description || 'N/A'}`);
          console.log(`    Methods: ${model.supportedGenerationMethods.join(', ')}\n`);
        }
      });
    } else {
      console.log("No models found or error:", data);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

listModels();
