import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('❌ GEMINI_API_KEY not found');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function listModels() {
  try {
    console.log('🔍 Fetching available models...\n');
    const response = await ai.models.list();
    
    // The response might be an object with a models array or just an array
    const models = Array.isArray(response) ? response : (response.models || []);
    
    if (models.length === 0) {
      console.log('⚠️  No models returned. Response:', JSON.stringify(response, null, 2));
      return;
    }
    
    console.log('✅ Available models:\n');
    models.forEach((model, index) => {
      console.log(`${index + 1}. ${model.name || model.id || 'Unknown'}`);
      if (model.displayName) console.log(`   Display Name: ${model.displayName}`);
      if (model.description) console.log(`   Description: ${model.description}`);
      if (model.supportedGenerationMethods) {
        console.log(`   Supported Methods: ${model.supportedGenerationMethods.join(', ')}`);
      }
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error listing models:', error.message);
    console.error('Full error:', error);
  }
}

listModels();
