# Full-Stack Vercel Deployment Guide for Anvaya

## 🚀 Complete Full-Stack Deployment

Deploy both frontend and backend to Vercel as a unified application.

### Quick Setup

1. **Go to [vercel.com](https://vercel.com)** and sign in with GitHub
2. **Import your `Karnav018/Anvaya` repository** 
3. **Root Directory**: Leave as **root** (not frontend!)
4. **Framework**: Will auto-detect as **Other**
5. **Add Environment Variables** (see below)
6. **Deploy!**

## Environment Variables

Add these in Vercel dashboard (Settings > Environment Variables):

### Required Variables:
- `DATABASE_URL` = `postgresql://user:password@host:5432/dbname` 
- `JWT_SECRET` = `your-secure-256-bit-secret`
- `APP_URL` = `https://your-project.vercel.app`
- `FRONTEND_URL` = `https://your-project.vercel.app`
- `ENVIRONMENT` = `production`

### Optional Variables:
- `JWT_ALGORITHM` = `HS256`
- `JWT_EXPIRE_MINUTES` = `10080`
- `LOG_LEVEL` = `INFO`

## How It Works

### Architecture:
- **Frontend**: `https://your-app.vercel.app` (React/Vite)
- **Backend API**: `https://your-app.vercel.app/api` (FastAPI serverless)
- **Database**: External PostgreSQL (Neon/Supabase recommended)

### File Structure:
```
anvaya/
├── frontend/          # React app (builds to root)
├── backend/           # FastAPI app source
├── api/
│   └── index.py      # Vercel serverless entry point
├── vercel.json       # Deployment configuration
└── requirements.txt  # Python dependencies
```

## Database Options

Since Vercel is serverless, you need an external database:

### Option 1: Neon (Recommended)
- **Free tier**: 512MB storage
- **URL**: [neon.tech](https://neon.tech)
- **PostgreSQL compatible**
- **Serverless-friendly**

### Option 2: Supabase  
- **Free tier**: 500MB storage
- **URL**: [supabase.com](https://supabase.com)
- **PostgreSQL with extras**

### Option 3: PlanetScale
- **MySQL-compatible**
- **Good free tier**

## Deployment Steps

1. **Deploy to Vercel**:
   - Import repository
   - Set environment variables
   - Deploy

2. **Set up Database**:
   - Create database on Neon/Supabase
   - Update `DATABASE_URL` in Vercel
   - Database tables will auto-create on first run

3. **Test**:
   - Frontend: `https://your-app.vercel.app`
   - API Health: `https://your-app.vercel.app/api/health`
   - Login: Create account and test auth

## Performance Benefits

- **Single domain**: No CORS issues
- **Edge deployment**: Global CDN
- **Serverless scaling**: Auto-scales with demand
- **Optimized bundle**: 700KB frontend (was 4.3MB)

## Troubleshooting

### Build Issues
- Check Python requirements are correct
- Verify frontend builds locally first
- Check environment variables are set

### API Issues  
- Test API endpoint: `/api/health`
- Check database connection
- Verify JWT_SECRET is set

### Database Issues
- Ensure DATABASE_URL is correct
- Check database is accessible from internet
- Verify credentials

## Cost Estimate

**Free Tier Limits:**
- **Vercel**: 100GB bandwidth, 100 hours serverless
- **Neon**: 512MB storage, 1 database
- **Total**: $0/month for small projects

**Paid Tiers** (if needed):
- **Vercel Pro**: $20/month (team features)
- **Neon Pro**: $19/month (more storage/compute)

## Security Notes

- All traffic is HTTPS
- JWT tokens for authentication
- Environment variables secured
- CORS properly configured
- Rate limiting included