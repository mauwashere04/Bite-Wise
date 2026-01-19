# BiteWise - AI Kitchen Intelligence

BiteWise is an AI-powered kitchen companion that generates personalized meal plans, analyzes pantry ingredients from photos, and creates chef-grade recipes tailored to your dietary preferences and flavor profile.

## Features

- 🍳 **AI Meal Plan Generation** - Generate personalized recipes using Gemini AI
- 📸 **Pantry Photo Analysis** - Upload photos of ingredients for intelligent recipe suggestions
- 🎯 **Flavor DNA Profiling** - Customize your flavor preferences (sweet, salty, sour, bitter, umami, spicy)
- 🥗 **Dietary Restrictions** - Support for allergies and dietary preferences
- 🍽️ **Multi-Course Meals** - Generate complete 3-course fine dining experiences
- 📊 **Nutritional Analytics** - View macros and nutritional information
- 🎤 **Audio Narration** - Listen to recipe instructions with text-to-speech

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **AI:** Google Gemini API (gemini-2.5-flash)

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Google Gemini API key ([Get one here](https://ai.google.dev/))

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Bite-Wise
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

### 4. Configure Environment Variables

**Backend Configuration:**

Create `backend/.env` file:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3002
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Frontend Configuration (Optional):**

If your backend runs on a different URL, create `.env.local` in the root:

```env
VITE_API_URL=http://localhost:3002
```

## Running the Application

### Option 1: Run Both Together (Recommended)

From the root directory:

```bash
npm run dev:all
```

This starts both backend (port 3002) and frontend (port 3000) in one terminal.

### Option 2: Run Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### Option 3: Backend Only

```bash
npm run dev:backend
```

## Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3002
- **Health Check:** http://localhost:3002/health

## Project Structure

```
Bite-Wise/
├── backend/                 # Node.js backend server
│   ├── routes/             # API route handlers
│   ├── services/           # Gemini AI service
│   ├── server.js           # Express server
│   └── .env               # Backend environment variables
├── components/             # React components
├── services/               # Frontend API service
├── App.tsx                 # Main React component
├── index.tsx               # React entry point
└── package.json            # Frontend dependencies
```

## API Endpoints

- `POST /api/meal-plan` - Generate meal plan from input/image
- `POST /api/image-generation` - Generate meal images (requires paid tier)
- `POST /api/tts` - Text-to-speech conversion
- `GET /health` - Health check endpoint

## Development

### Available Scripts

**Frontend:**
- `npm run dev` - Start frontend dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

**Backend:**
- `npm run dev:backend` - Start backend dev server
- `cd backend && npm run dev` - Start backend with watch mode

**Both:**
- `npm run dev:all` - Start both frontend and backend

## Troubleshooting

### Backend won't start
- Check if port 3002 is already in use
- Verify `backend/.env` exists with `GEMINI_API_KEY`
- Ensure backend dependencies are installed: `cd backend && npm install`

### Frontend can't connect to backend
- Ensure backend is running (`http://localhost:3002/health` should work)
- Check CORS settings in `backend/server.js`
- Verify `FRONTEND_URL` in backend `.env` matches frontend URL

### API errors
- Verify API key is valid and has quota remaining
- Check backend terminal logs for detailed error messages
- Ensure you're using free-tier compatible models (gemini-2.5-flash)

## Deployment

### Backend Deployment

Deploy to platforms like:
- **Railway** - Easy Node.js deployment
- **Render** - Free tier available
- **Vercel** - Serverless functions
- **Heroku** - Traditional hosting

Set environment variables on your hosting platform:
- `GEMINI_API_KEY`
- `PORT` (optional, defaults to 3001)
- `FRONTEND_URL` (your frontend URL)

### Frontend Deployment

Deploy to:
- **Vercel** - Recommended for React apps
- **Netlify** - Easy static hosting
- **GitHub Pages** - Free hosting

Set environment variable:
- `VITE_API_URL` - Your deployed backend URL

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
