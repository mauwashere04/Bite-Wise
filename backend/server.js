import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mealPlanRoutes from './routes/mealPlan.js';
import imageGenerationRoutes from './routes/imageGeneration.js';
import ttsRoutes from './routes/tts.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: join(__dirname, '.env') });

// Verify API key is loaded
console.log('🔵 [Server] Checking environment variables...');
console.log('🔵 [Server] NODE_ENV:', process.env.NODE_ENV);
console.log('🔵 [Server] PORT:', process.env.PORT);
console.log('🔵 [Server] FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('🔵 [Server] GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY);
console.log('🔵 [Server] GEMINI_API_KEY length:', process.env.GEMINI_API_KEY?.length || 0);

if (!process.env.GEMINI_API_KEY) {
  console.error('❌ ERROR: GEMINI_API_KEY not found in environment variables');
  console.error('   Make sure backend/.env file exists with GEMINI_API_KEY=your_key');
  console.error('   In Vercel: Set GEMINI_API_KEY in project environment variables');
} else {
  console.log('✅ GEMINI_API_KEY loaded successfully');
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://bitewise-one.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean); // Remove undefined values

// Remove trailing slashes for comparison
const normalizeOrigin = (origin) => origin ? origin.replace(/\/$/, '') : null;

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('🟢 [CORS] Allowing request with no origin');
      return callback(null, true);
    }
    
    const normalizedOrigin = normalizeOrigin(origin);
    const normalizedAllowed = allowedOrigins.map(normalizeOrigin);
    
    console.log('🟢 [CORS] Checking origin:', normalizedOrigin);
    console.log('🟢 [CORS] Allowed origins:', normalizedAllowed);
    
    if (normalizedAllowed.includes(normalizedOrigin)) {
      console.log('✅ [CORS] Origin allowed:', normalizedOrigin);
      callback(null, true);
    } else {
      console.warn(`⚠️  [CORS] Blocked origin: ${normalizedOrigin}`);
      console.warn(`⚠️  [CORS] Allowed origins:`, normalizedAllowed);
      // In production, be more permissive for debugging
      if (process.env.NODE_ENV === 'production') {
        console.log('🟡 [CORS] Production mode - allowing origin anyway');
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'BiteWise API is running',
    endpoints: {
      health: '/health',
      mealPlan: '/api/meal-plan',
      imageGeneration: '/api/image-generation',
      tts: '/api/tts'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('🟢 [Health Check] Request received');
  res.json({ 
    status: 'ok', 
    message: 'BiteWise API is running',
    env: {
      NODE_ENV: process.env.NODE_ENV,
      hasApiKey: !!process.env.GEMINI_API_KEY,
      frontendUrl: process.env.FRONTEND_URL
    }
  });
});

// Test endpoint to verify serverless function is working
app.get('/test', (req, res) => {
  console.log('🟢 [Test] Request received');
  console.log('🟢 [Test] Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    GEMINI_API_KEY_PRESENT: !!process.env.GEMINI_API_KEY,
    FRONTEND_URL: process.env.FRONTEND_URL
  });
  res.json({ 
    success: true,
    message: 'Serverless function is working!',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      hasApiKey: !!process.env.GEMINI_API_KEY,
      frontendUrl: process.env.FRONTEND_URL
    }
  });
});

// API Routes
console.log('🟡 [Server] Setting up API routes...');
app.use('/api/meal-plan', mealPlanRoutes);
console.log('✅ [Server] /api/meal-plan route registered');
app.use('/api/image-generation', imageGenerationRoutes);
app.use('/api/tts', ttsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Only start server if not in Vercel serverless environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 BiteWise Backend API running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
  });
}

// Export for Vercel serverless functions
export default app;
