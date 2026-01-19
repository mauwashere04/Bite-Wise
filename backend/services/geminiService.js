import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('⚠️  GEMINI_API_KEY is not set in environment variables');
  console.error('   Check that backend/.env file exists and contains GEMINI_API_KEY');
} else {
  console.log('✅ Gemini API key loaded in service');
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

export const generateMealPlan = async (input, profile, image, isMultiCourse = false) => {
  // Using gemini-2.5-flash (stable, free tier available)
  // According to official docs: https://ai.google.dev/gemini-api/docs/models
  const modelName = 'gemini-2.5-flash';
  
  // Validate API key
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Please set it in backend/.env file.');
  }
  
  const systemInstruction = `
    You are an elite Michelin-star chef and expert visual analyst.
    
    CRITICAL INSTRUCTION: If an image is provided, perform a Meticulous Visual Inventory before generating recipes. 
    1. Identify exact ingredients. Do NOT generalize (e.g., if you see fusilli or penne, do not call it spaghetti).
    2. Note the variety and state (e.g., "colorful fusilli pasta", "fresh pomegranate", "chicken breasts").
    3. Match the recipe STRICTLY to these identified items.
    
    Restrictions: ${profile.dietaryRestrictions.join(', ') || 'None'}.
    User Flavor DNA: ${JSON.stringify(profile.flavorDNA)}.

    Generate a ${isMultiCourse ? '3-course fine dining meal' : 'single cohesive dish'}.
    
    JSON Response Format:
    {
      "id": "string",
      "title": "string",
      "identifiedIngredients": ["string list of exactly what you saw in the image"],
      "courses": [{
        "name": "string",
        "type": "Appetizer|Entrée|Palate Cleanser|Dessert",
        "summary": "string",
        "ingredients": [{"item": "string", "amount": "string", "substitute": "string"}],
        "instructions": ["string"],
        "winePairing": "string",
        "difficultyNotes": "string"
      }],
      "timeline": [{"task": "string", "duration": number, "courseIndex": number, "type": "prep|cook|rest"}],
      "macros": {"protein": number, "carbs": number, "fats": number, "fiber": number},
      "totalTime": "string",
      "flavorPalette": ["hex codes"]
    }
  `;

  // Handle image - if it's a data URL, extract base64, otherwise use as-is
  let imageData = image;
  if (image && image.startsWith('data:image')) {
    // Extract base64 from data URL
    imageData = image.split(',')[1];
  }

  const contents = imageData 
    ? { parts: [{ text: input || "Surprise me with a dish that matches exactly what you see." }, { inlineData: { mimeType: 'image/jpeg', data: imageData } }] }
    : input || "Suggest a meal plan.";

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("AI failed to return valid meal plan data.");
    }

    return JSON.parse(resultText.trim());
  } catch (error) {
    console.error('Error generating meal plan:', error);
    throw error;
  }
};

export const generateMealImage = async (title, summary) => {
  try {
    // Using gemini-2.5-flash-image for image generation (stable version)
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `Professional food photography of ${title}. ${summary}. High-end restaurant plating. 8k, bokeh.`
          }
        ]
      },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return '';
  } catch (error) {
    console.error('Error generating meal image:', error);
    throw error;
  }
};

export const generateTextToSpeech = async (text) => {
  try {
    // Using gemini-2.5-flash-preview-tts for TTS
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data returned from Gemini TTS");
    }

    return base64Audio;
  } catch (error) {
    console.error('Error generating TTS:', error);
    // Fallback to browser TTS if Gemini TTS fails
    throw new Error('TTS not available - frontend will use browser speech synthesis');
  }
};
