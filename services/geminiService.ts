
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { MealResult, UserProfile, Course, RecipeStep } from "../types";

const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY is not set in environment variables');
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

// Internal state to manage active audio for stopping/cleanup
let activeAudioSource: AudioBufferSourceNode | null = null;
let activeAudioContext: AudioContext | null = null;

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const generateMealPlan = async (
  input: string, 
  profile: UserProfile, 
  image?: string,
  isMultiCourse: boolean = false
): Promise<MealResult> => {
  const modelName = 'gemini-3-pro-preview';
  
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

  const contents = image 
    ? { parts: [{ text: input || "Surprise me with a dish that matches exactly what you see." }, { inlineData: { mimeType: 'image/jpeg', data: image } }] }
    : input || "Suggest a meal plan.";

  const response = await ai.models.generateContent({
    model: modelName,
    contents,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
    }
  });

  const resultText = response.text;
  if (!resultText) throw new Error("AI failed to return valid meal plan data.");

  return JSON.parse(resultText.trim());
};

export const generateMealImage = async (title: string, summary: string): Promise<string> => {
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
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  return '';
};

export const stopAudio = () => {
  if (activeAudioSource) {
    try {
      activeAudioSource.stop();
    } catch (e) {
      console.warn("Error stopping audio source", e);
    }
    activeAudioSource = null;
  }
  if (activeAudioContext) {
    activeAudioContext.close().catch(console.warn);
    activeAudioContext = null;
  }
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

export const readSteps = async (text: string, onEnded?: () => void) => {
  // Stop any existing playback first
  stopAudio();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      activeAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const audioBuffer = await decodeAudioData(decode(base64Audio), activeAudioContext, 24000, 1);
      
      activeAudioSource = activeAudioContext.createBufferSource();
      activeAudioSource.buffer = audioBuffer;
      activeAudioSource.connect(activeAudioContext.destination);
      
      activeAudioSource.onended = () => {
        activeAudioSource = null;
        if (onEnded) onEnded();
      };

      activeAudioSource.start();
    } else {
      throw new Error("No audio data returned from Gemini TTS");
    }
  } catch (e) {
    console.warn("Gemini TTS failed, using fallback speech synthesis", e);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => {
      if (onEnded) onEnded();
    };
    window.speechSynthesis.speak(utterance);
  }
};
