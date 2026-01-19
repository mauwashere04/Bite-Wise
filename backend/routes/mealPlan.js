import express from 'express';
import { generateMealPlan } from '../services/geminiService.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { input, profile, image, isMultiCourse } = req.body;

    // Validate required fields
    if (!profile) {
      return res.status(400).json({ error: 'Profile is required' });
    }

    // Validate profile structure
    if (!profile.flavorDNA || !profile.dietaryRestrictions) {
      return res.status(400).json({ error: 'Invalid profile structure' });
    }

    // Generate meal plan
    const mealPlan = await generateMealPlan(
      input || '',
      profile,
      image || null,
      isMultiCourse || false
    );

    res.json(mealPlan);
  } catch (error) {
    console.error('Error in meal plan generation:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      error: 'Failed to generate meal plan',
      message: error.message || 'Unknown error occurred',
      ...(process.env.NODE_ENV === 'development' && { details: error.stack })
    });
  }
});

export default router;
