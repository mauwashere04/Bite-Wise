// Vercel serverless function entrypoint
console.log('🚀🚀🚀 [Vercel Serverless] ====== FUNCTION FILE LOADED ======');
console.log('🚀 [Vercel Serverless] Timestamp:', new Date().toISOString());
console.log('🚀 [Vercel Serverless] Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  VERCEL: process.env.VERCEL,
  GEMINI_API_KEY_PRESENT: !!process.env.GEMINI_API_KEY,
  GEMINI_API_KEY_LENGTH: process.env.GEMINI_API_KEY?.length || 0
});

import app from '../server.js';
console.log('✅ [Vercel Serverless] Express app imported successfully');

// Export handler function for Vercel serverless functions
export default function handler(req, res) {
  console.log('🟢🟢🟢 [Handler] ====== REQUEST RECEIVED ======');
  console.log('🟢 [Handler] Method:', req.method);
  console.log('🟢 [Handler] URL:', req.url);
  console.log('🟢 [Handler] Path:', req.path);
  return app(req, res);
}
