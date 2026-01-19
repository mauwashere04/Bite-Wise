import express from 'express';
import { generateTextToSpeech } from '../services/geminiService.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { text } = req.body;

    // Validate required fields
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ 
        error: 'Text is required and must be a string' 
      });
    }

    // Generate TTS audio
    const base64Audio = await generateTextToSpeech(text);

    if (!base64Audio) {
      return res.status(500).json({ 
        error: 'Failed to generate audio' 
      });
    }

    // Return base64 audio data
    res.json({ 
      audio: base64Audio,
      format: 'base64'
    });
  } catch (error) {
    console.error('Error in TTS generation:', error);
    res.status(500).json({ 
      error: 'Failed to generate text-to-speech',
      message: error.message 
    });
  }
});

export default router;
