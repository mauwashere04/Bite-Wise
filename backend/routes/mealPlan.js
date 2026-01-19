import express from 'express';
import { generateMealPlan } from '../services/geminiService.js';

const router = express.Router();

router.post('/', async (req, res) => {
  console.log('🟢 [mealPlan Route] POST /api/meal-plan received');
  console.log('🟢 [mealPlan Route] Request body keys:', Object.keys(req.body));
  console.log('🟢 [mealPlan Route] Request details:', {
    hasInput: !!req.body.input,
    inputLength: req.body.input?.length || 0,
    hasProfile: !!req.body.profile,
    hasImage: !!req.body.image,
    imageLength: req.body.image?.length || 0,
    isMultiCourse: req.body.isMultiCourse
  });
  
  try {
    const { input, profile, image, isMultiCourse } = req.body;

    // Validate required fields
    console.log('🟢 [mealPlan Route] Validating profile...');
    if (!profile) {
      console.error('❌ [mealPlan Route] Profile is missing');
      return res.status(400).json({ error: 'Profile is required' });
    }

    // Validate profile structure
    console.log('🟢 [mealPlan Route] Validating profile structure...');
    if (!profile.flavorDNA || !profile.dietaryRestrictions) {
      console.error('❌ [mealPlan Route] Invalid profile structure');
      console.error('❌ [mealPlan Route] Profile keys:', Object.keys(profile));
      return res.status(400).json({ error: 'Invalid profile structure' });
    }
    console.log('✅ [mealPlan Route] Profile validation passed');

    // Generate meal plan
    console.log('🟢 [mealPlan Route] Calling generateMealPlan...');
    const mealPlan = await generateMealPlan(
      input || '',
      profile,
      image || null,
      isMultiCourse || false
    );
    console.log('✅ [mealPlan Route] Meal plan generated successfully');
    console.log('✅ [mealPlan Route] Returning response with title:', mealPlan?.title);

    res.json(mealPlan);
  } catch (error) {
    console.error('❌ [mealPlan Route] Error caught in route handler');
    console.error('❌ [mealPlan Route] Error type:', error.constructor.name);
    console.error('❌ [mealPlan Route] Error message:', error.message);
    console.error('❌ [mealPlan Route] Error stack:', error.stack);
    console.error('❌ [mealPlan Route] Full error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    
    res.status(500).json({ 
      error: 'Failed to generate meal plan',
      message: error.message || 'Unknown error occurred',
      ...(process.env.NODE_ENV === 'development' && { details: error.stack })
    });
  }
});

export default router;
