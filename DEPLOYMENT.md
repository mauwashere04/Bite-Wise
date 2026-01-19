# Deploying BiteWise to Vercel (Free Tier)

Complete guide to deploy both frontend and backend to Vercel for free.

## Prerequisites

- ✅ GitHub account
- ✅ Vercel account ([Sign up free](https://vercel.com))
- ✅ Code pushed to GitHub repository

## Step-by-Step Deployment

### Step 1: Push Code to GitHub

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### Step 2: Deploy Backend First

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Click **"Add New..."** → **"Project"**

2. **Import Repository**
   - Connect your GitHub account (if not already)
   - Select your `Bite-Wise` repository
   - Click **"Import"**

3. **Configure Backend Project**
   
   **Project Settings:**
   - **Project Name:** `bitewise-backend` (or your choice)
   - **Root Directory:** `backend`
   - **Framework Preset:** Other
   - **Build Command:** Leave empty (or `npm install`)
   - **Output Directory:** Leave empty
   - **Install Command:** `npm install`

4. **Set Environment Variables**
   
   Click **"Environment Variables"** and add:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   FRONTEND_URL=https://your-frontend-url.vercel.app
   NODE_ENV=production
   PORT=3000
   ```

5. **Deploy**
   - Click **"Deploy"**
   - Wait for deployment (2-3 minutes)
   - **Copy the backend URL** (e.g., `https://bitewise-backend.vercel.app`)

### Step 3: Deploy Frontend

1. **Create New Project in Vercel**
   - Click **"Add New..."** → **"Project"** again
   - Import the **same repository**

2. **Configure Frontend Project**
   
   **Project Settings:**
   - **Project Name:** `bitewise-frontend` (or your choice)
   - **Root Directory:** Leave as root (`.`)
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

3. **Set Environment Variables**
   
   Add:
   ```
   VITE_API_URL=https://your-backend-url.vercel.app
   ```
   (Replace with your actual backend URL from Step 2)

4. **Deploy**
   - Click **"Deploy"**
   - Wait for deployment
   - **Copy the frontend URL** (e.g., `https://bitewise-frontend.vercel.app`)

### Step 4: Update Backend CORS

1. **Go back to Backend Project**
   - Open backend project settings
   - Go to **"Environment Variables"**

2. **Update FRONTEND_URL**
   - Change `FRONTEND_URL` to your frontend Vercel URL
   - Click **"Save"**

3. **Redeploy Backend**
   - Go to **"Deployments"** tab
   - Click **"Redeploy"** → **"Redeploy"**

### Step 5: Test Your Deployment

1. Visit your frontend URL
2. Try generating a meal plan
3. Check browser console for any errors
4. Check backend logs in Vercel dashboard if issues occur

## Alternative: Deploy Both in One Project

If you prefer a single deployment:

### Option A: Using vercel.json (Recommended)

1. **The `vercel.json` file is already created** in your project

2. **Create API route wrapper:**
   - The `api/server.js` file wraps your backend

3. **Deploy:**
   - Import repository to Vercel
   - Root directory: `.` (root)
   - Framework: Vite
   - Build command: `npm run build`
   - Output: `dist`

4. **Environment Variables:**
   ```
   GEMINI_API_KEY=your_key
   FRONTEND_URL=https://your-project.vercel.app
   VITE_API_URL=https://your-project.vercel.app/api
   ```

### Option B: Separate Projects (Easier)

Deploy backend and frontend as **separate projects** (recommended for beginners):
- Easier to manage
- Independent scaling
- Clear separation of concerns

## Environment Variables Reference

### Backend Variables:
```
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=https://your-frontend.vercel.app
NODE_ENV=production
PORT=3000
```

### Frontend Variables:
```
VITE_API_URL=https://your-backend.vercel.app
```

**Important:** Frontend env vars must start with `VITE_` prefix!

## Troubleshooting

### ❌ Backend returns 404
- Check `vercel.json` routes configuration
- Verify backend is deployed correctly
- Check deployment logs

### ❌ CORS errors
- Update `FRONTEND_URL` in backend env vars
- Ensure backend CORS allows your frontend URL
- Redeploy backend after changing env vars

### ❌ Environment variables not working
- Frontend vars must have `VITE_` prefix
- Redeploy after adding/changing env vars
- Check variable names match exactly

### ❌ Build fails
- Check Vercel build logs
- Ensure all dependencies in `package.json`
- Verify Node.js version (Vercel uses Node 18+)

### ❌ API calls fail
- Check backend URL is correct in frontend env vars
- Verify backend is deployed and running
- Check backend logs in Vercel dashboard

## Vercel Free Tier Limits

✅ **Unlimited** deployments  
✅ **100GB** bandwidth/month  
✅ **100GB-hours** serverless function execution  
✅ **Automatic HTTPS**  
✅ **Custom domains** (free)  

## Post-Deployment Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible  
- [ ] Environment variables set correctly
- [ ] CORS configured properly
- [ ] Test meal plan generation
- [ ] Update README with live URLs
- [ ] (Optional) Set up custom domain

## Quick Deploy with Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy backend
cd backend
vercel --prod

# Deploy frontend  
cd ..
vercel --prod
```

## Need Help?

- Check Vercel docs: [vercel.com/docs](https://vercel.com/docs)
- View deployment logs in Vercel dashboard
- Check backend logs for API errors
