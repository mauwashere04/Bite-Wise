import express from 'express';
import { generateMealPlan } from '../services/geminiService.js';

const router = express.Router();

router.post('/', async (req, res) => {
  // Log immediately - this should ALWAYS show if function is called
  console.log('🟢🟢🟢 [mealPlan Route] ====== FUNCTION CALLED ======');
  console.log('🟢 [mealPlan Route] Timestamp:', new Date().toISOString());
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
  console.log('🟢 [mealPlan Route] Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    hasApiKey: !!process.env.GEMINI_API_KEY
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
      cause: error.cause,
      ...(error.response && { response: error.response }),
      ...(error.status && { status: error.status }),
      ...(error.statusText && { statusText: error.statusText })
    });
    
    // Return detailed error in production too so we can debug
    // Check if it's a Gemini API key error
    const errorMessage = error.message || '';
    const isLeakedKeyError = errorMessage.includes('leaked') || errorMessage.includes('403');
    
    res.status(500).json({ 
      error: 'Failed to generate meal plan',
      message: errorMessage || 'Unknown error occurred',
      errorType: error.constructor.name,
      ...(isLeakedKeyError && {
        apiKeyIssue: true,
        solution: 'Your Gemini API key has been flagged as leaked. Please generate a new API key at https://ai.google.dev/ and update it in Vercel environment variables.'
      }),
      ...(error.response && { apiResponse: error.response }),
      ...(error.status && { statusCode: error.status }),
      details: process.env.NODE_ENV === 'development' ? error.stack : 'Check server logs'
    });
  }
});

export default router;
