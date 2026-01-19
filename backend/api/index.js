// Vercel serverless function entrypoint
console.log('🚀 [Vercel Serverless] API handler file loaded at:', new Date().toISOString());
console.log('🚀 [Vercel Serverless] Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  VERCEL: process.env.VERCEL,
  GEMINI_API_KEY_PRESENT: !!process.env.GEMINI_API_KEY
});

import app from '../server.js';
console.log('✅ [Vercel Serverless] Express app imported successfully');

// Export Express app directly for Vercel serverless functions
export default app;
