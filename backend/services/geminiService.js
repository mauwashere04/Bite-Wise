import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables (for local development)
// In Vercel, environment variables are automatically available via process.env
try {
  dotenv.config({ path: join(__dirname, '..', '.env') });
} catch (e) {
  // Ignore if .env file doesn't exist (normal in Vercel)
}

// Get API key from environment (works in both local and Vercel)
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('⚠️  GEMINI_API_KEY is not set in environment variables');
  console.error('   In Vercel: Set GEMINI_API_KEY in project environment variables');
  console.error('   Locally: Check that backend/.env file exists and contains GEMINI_API_KEY');
} else {
  console.log('✅ Gemini API key loaded successfully');
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

export const generateMealPlan = async (input, profile, image, isMultiCourse = false) => {
  console.log('🔵 [generateMealPlan] Function called');
  console.log('🔵 [generateMealPlan] Input:', { 
    hasInput: !!input, 
    inputLength: input?.length || 0,
    hasImage: !!image,
    imageLength: image?.length || 0,
    isMultiCourse,
    hasProfile: !!profile,
    profileKeys: profile ? Object.keys(profile) : []
  });
  
  // Using gemini-2.5-flash (stable, free tier available)
  // According to official docs: https://ai.google.dev/gemini-api/docs/models
  const modelName = 'gemini-2.5-flash';
  
  // Validate API key
  console.log('🔵 [generateMealPlan] Checking API key...');
  if (!apiKey) {
    console.error('❌ [generateMealPlan] API key is missing!');
    throw new Error('GEMINI_API_KEY is not configured. Please set it in backend/.env file.');
  }
  console.log('✅ [generateMealPlan] API key present (length:', apiKey.length, ')');
  
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
  console.log('🔵 [generateMealPlan] Processing image...');
  let imageData = image;
  if (image && image.startsWith('data:image')) {
    // Extract base64 from data URL
    imageData = image.split(',')[1];
    console.log('🔵 [generateMealPlan] Extracted base64 image data (length:', imageData?.length || 0, ')');
  }

  // Prepare content parts
  console.log('🔵 [generateMealPlan] Preparing content parts...');
  let parts = [];
  if (imageData) {
    parts = [
      { text: input || "Surprise me with a dish that matches exactly what you see." },
      { inlineData: { mimeType: 'image/jpeg', data: imageData } }
    ];
    console.log('🔵 [generateMealPlan] Using image + text parts');
  } else {
    parts = [{ text: input || "Suggest a meal plan." }];
    console.log('🔵 [generateMealPlan] Using text-only parts');
  }

  try {
    console.log('🔵 [generateMealPlan] Preparing API call...');
    console.log('🔵 [generateMealPlan] Request params:', {
      model: modelName,
      partsCount: parts.length,
      hasImage: !!imageData,
      hasSystemInstruction: !!systemInstruction,
      apiKeyPresent: !!apiKey,
      apiKeyLength: apiKey?.length || 0
    });
    
    // Check if ai.models exists
    console.log('🔵 [generateMealPlan] Checking API structure...');
    console.log('🔵 [generateMealPlan] ai object keys:', Object.keys(ai || {}));
    console.log('🔵 [generateMealPlan] ai.models exists:', !!ai.models);
    if (ai.models) {
      console.log('🔵 [generateMealPlan] ai.models keys:', Object.keys(ai.models || {}));
    }
    
    // Try using getGenerativeModel first (standard SDK pattern)
    console.log('🔵 [generateMealPlan] Attempting getGenerativeModel approach...');
    let response;
    
    try {
      const model = ai.getGenerativeModel({ 
        model: modelName,
        systemInstruction: systemInstruction,
      });
      console.log('✅ [generateMealPlan] Model instance created');
      
      const result = await model.generateContent({
        contents: [{ parts }],
        generationConfig: {
          responseMimeType: "application/json",
        }
      });
      console.log('✅ [generateMealPlan] generateContent completed');
      response = await result.response;
    } catch (getModelError) {
      console.error('❌ [generateMealPlan] getGenerativeModel failed:', getModelError.message);
      console.log('🔵 [generateMealPlan] Trying ai.models.generateContent...');
      
      // Fallback to ai.models.generateContent
      response = await ai.models.generateContent({
        model: modelName,
        contents: imageData 
          ? { parts: parts }
          : { parts: parts },
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
        }
      });
    }
    console.log('✅ [generateMealPlan] generateContent call completed');
    console.log('🔵 [generateMealPlan] Response type:', typeof response);
    console.log('🔵 [generateMealPlan] Response keys:', Object.keys(response || {}));

    console.log('🔵 [generateMealPlan] Extracting text from response...');
    console.log('🔵 [generateMealPlan] Response structure:', {
      hasText: !!response.text,
      hasCandidates: !!response.candidates,
      responseType: typeof response,
      responseKeys: Object.keys(response || {})
    });
    
    // Check response structure - it might be response.text() or response.text or response.candidates[0].content.parts[0].text
    let resultText = null;
    
    if (typeof response.text === 'function') {
      resultText = response.text();
      console.log('✅ [generateMealPlan] Found response.text() method');
    } else if (response.text) {
      resultText = response.text;
      console.log('✅ [generateMealPlan] Found response.text property');
    } else if (response.candidates && response.candidates[0] && response.candidates[0].content) {
      const content = response.candidates[0].content;
      if (content.parts && content.parts[0] && content.parts[0].text) {
        resultText = content.parts[0].text;
        console.log('✅ [generateMealPlan] Found response.candidates[0].content.parts[0].text');
      }
    } else {
      console.error('❌ [generateMealPlan] Unexpected response structure');
      console.error('❌ [generateMealPlan] Full response:', JSON.stringify(response, null, 2));
      throw new Error(`Unexpected response structure from Gemini API. Response type: ${typeof response}, Keys: ${Object.keys(response || {}).join(', ')}`);
    }
    
    console.log('✅ [generateMealPlan] Text extracted (length:', resultText?.length || 0, ')');
    
    if (!resultText) {
      console.error('❌ [generateMealPlan] No text in response!');
      console.error('❌ [generateMealPlan] Full response:', JSON.stringify(response, null, 2));
      throw new Error("AI failed to return valid meal plan data.");
    }

    console.log('🔵 [generateMealPlan] Parsing JSON...');
    const parsed = JSON.parse(resultText.trim());
    console.log('✅ [generateMealPlan] JSON parsed successfully');
    console.log('✅ [generateMealPlan] Returning meal plan with title:', parsed.title);
    
    return parsed;
  } catch (error) {
    console.error('❌ [generateMealPlan] Error caught in try-catch block');
    console.error('❌ [generateMealPlan] Error type:', error.constructor.name);
    console.error('❌ [generateMealPlan] Error message:', error.message);
    console.error('❌ [generateMealPlan] Error stack:', error.stack);
    console.error('❌ [generateMealPlan] Full error object:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause,
      ...(error.response && { response: error.response }),
      ...(error.status && { status: error.status }),
      ...(error.statusText && { statusText: error.statusText })
    });
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
