# Quick Database Setup for Vercel Deployment

## 🎯 Recommended: Neon Database

### 1. Create Database
1. Go to [neon.tech](https://neon.tech)
2. Sign in with GitHub
3. Create new project: **"Anvaya"**
4. Choose region closest to you
5. Copy the **Connection String**

### 2. Example Connection String
```
postgresql://username:password@host.neon.tech/anvaya?sslmode=require
```

## 🚀 Deploy to Vercel

### Step 1: Import Project
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub  
3. Click **"Add New Project"**
4. Select **`Karnav018/Anvaya`**
5. **Root Directory**: Leave as **root** (not frontend!)
6. **Framework**: Other/Static

### Step 2: Environment Variables
Add these **Environment Variables**:

**Required:**
```
DATABASE_URL = postgresql://username:password@host.neon.tech/anvaya?sslmode=require
JWT_SECRET = your-secure-random-secret-256-bits-long
APP_URL = https://your-project-name.vercel.app
FRONTEND_URL = https://your-project-name.vercel.app
ENVIRONMENT = production
```

**Optional:**
```
JWT_ALGORITHM = HS256
JWT_EXPIRE_MINUTES = 10080
LOG_LEVEL = INFO
```

### Step 3: Deploy
Click **"Deploy"** and wait 2-3 minutes

## 🧪 Test Your Deployment

After deployment, test these URLs:

- **Frontend**: `https://your-app.vercel.app`
- **API Health**: `https://your-app.vercel.app/api/health` 
- **API Docs**: `https://your-app.vercel.app/api/docs`

## 🔧 Generate JWT Secret

For security, generate a proper JWT secret:

```bash
# Option 1: OpenSSL
openssl rand -hex 32

# Option 2: Python
python -c "import secrets; print(secrets.token_hex(32))"

# Option 3: Online
# Visit: https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx
```

## 🎯 What You'll Get

**URLs:**
- **App**: `https://anvaya.vercel.app` (or your custom name)
- **API**: `https://anvaya.vercel.app/api/*`
- **Docs**: `https://anvaya.vercel.app/api/docs`

**Features:**
- ✅ Serverless FastAPI backend
- ✅ Optimized React frontend (700KB bundle)
- ✅ PostgreSQL database
- ✅ JWT authentication
- ✅ Global CDN
- ✅ Auto-scaling
- ✅ HTTPS everywhere

## 💡 Pro Tips

1. **Database**: Tables will auto-create on first API call
2. **Logs**: Check Vercel dashboard for function logs
3. **Performance**: First request might be slower (cold start)
4. **Updates**: Just push to GitHub - auto-deploys
5. **Custom Domain**: Add in Vercel settings later

Ready to deploy? Let's do it! 🚀