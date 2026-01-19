// Vercel serverless function entrypoint
console.log('🚀 [Vercel Serverless] API handler loaded');
import app from '../server.js';
console.log('✅ [Vercel Serverless] Express app imported');

// Export Express app directly for Vercel serverless functions
export default app;
