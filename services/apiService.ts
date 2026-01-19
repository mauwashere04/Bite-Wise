import { MealResult, UserProfile } from "../types";

// Backend API base URL - adjust for production
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

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
  try {
    const response = await fetch(`${API_BASE_URL}/api/meal-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input,
        profile,
        image: image || null,
        isMultiCourse,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
    }

    const mealPlan = await response.json();
    return mealPlan;
  } catch (error) {
    console.error('Error generating meal plan:', error);
    throw error;
  }
};

// Image generation removed - free tier API doesn't support it
// export const generateMealImage = async (title: string, summary: string): Promise<string> => { ... }

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
    const response = await fetch(`${API_BASE_URL}/api/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`TTS API error: ${response.status}`);
    }

    const data = await response.json();
    const base64Audio = data.audio;

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
      throw new Error("No audio data returned from TTS API");
    }
  } catch (e) {
    console.warn("TTS API failed, using fallback speech synthesis", e);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => {
      if (onEnded) onEnded();
    };
    window.speechSynthesis.speak(utterance);
  }
};
