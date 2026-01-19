# BiteWise Backend API

Node.js backend server for BiteWise - AI Kitchen Intelligence application.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables:**
   Edit `.env` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   PORT=3001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

4. **Run the server:**
   ```bash
   npm run dev
   ```

   Or for production:
   ```bash
   npm start
   ```

## API Endpoints

### Health Check
- `GET /health` - Check if API is running

### Meal Plan Generation
- `POST /api/meal-plan`
  - Body: `{ input, profile, image?, isMultiCourse? }`
  - Returns: Meal plan JSON

### Image Generation
- `POST /api/image-generation`
  - Body: `{ title, summary }`
  - Returns: `{ image: "data:image/png;base64,..." }`

### Text-to-Speech
- `POST /api/tts`
  - Body: `{ text }`
  - Returns: `{ audio: "base64...", format: "base64" }`

## Environment Variables

- `GEMINI_API_KEY` (required) - Your Google Gemini API key
- `PORT` (optional) - Server port (default: 3001)
- `NODE_ENV` (optional) - Environment (development/production)
- `FRONTEND_URL` (optional) - Frontend URL for CORS (default: http://localhost:3000)
