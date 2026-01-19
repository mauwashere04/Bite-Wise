import express from 'express';
import { generateMealImage } from '../services/geminiService.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { title, summary } = req.body;

    // Validate required fields
    if (!title || !summary) {
      return res.status(400).json({ 
        error: 'Title and summary are required' 
      });
    }

    // Generate meal image
    const imageDataUrl = await generateMealImage(title, summary);

    if (!imageDataUrl) {
      return res.status(500).json({ 
        error: 'Failed to generate image' 
      });
    }

    res.json({ image: imageDataUrl });
  } catch (error) {
    console.error('Error in image generation:', error);
    res.status(500).json({ 
      error: 'Failed to generate meal image',
      message: error.message 
    });
  }
});

export default router;
