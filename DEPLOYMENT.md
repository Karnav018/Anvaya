# Vercel Deployment Guide for Anvaya

## Quick Setup

### 1. Install Vercel CLI (Optional)
```bash
npm i -g vercel
```

### 2. Deploy via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Import your Anvaya repository
4. Set **Root Directory** to `frontend`
5. Framework will auto-detect as **Vite**
6. Deploy!

### 3. Deploy via CLI (Alternative)
```bash
cd frontend
vercel
```

## Configuration

### Environment Variables
Add these in Vercel dashboard (Settings > Environment Variables):

**Production:**
- `VITE_API_URL` = `https://your-backend-api-url.com/api`

**Development:**
- `VITE_API_URL` = `http://localhost:8000/api`

### Backend Deployment Options

Since you have a FastAPI backend, consider these options:

#### Option 1: Railway (Recommended)
- Easy FastAPI deployment
- Free tier available
- Auto-deploys from GitHub

#### Option 2: Render
- Good for Python apps
- Free tier includes database
- Simple setup

#### Option 3: Vercel Serverless Functions
- Convert FastAPI routes to serverless functions
- Keep everything on Vercel
- May require restructuring

### Domain Setup
1. In Vercel dashboard, go to your project
2. Click **Settings** > **Domains** 
3. Add your custom domain
4. Update DNS records as instructed

## Performance Notes

With our optimizations:
- Bundle size: ~700KB (was 4.3MB)
- Lazy loading: Components load on demand
- Caching: Static assets cached for 1 year
- Security headers: XSS protection, content type sniffing prevention

## Troubleshooting

### Build Fails
- Check all imports are valid
- Ensure TypeScript compiles locally first
- Check for environment variable issues

### Routing Issues
- SPA routing handled by `vercel.json` rewrites
- All non-API routes redirect to `index.html`

### API Connection Issues
- Verify `VITE_API_URL` is set correctly
- Check CORS settings in FastAPI backend
- Ensure backend is accessible from frontend domain

## Next Steps
1. Deploy frontend to Vercel
2. Choose and deploy backend (Railway/Render recommended)
3. Update `VITE_API_URL` with backend URL
4. Test full functionality
5. Set up custom domain (optional)