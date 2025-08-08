# Deployment Guide for Kasmoni

## Overview
This guide will help you deploy your Kasmoni application using free hosting platforms.

## Deployment Options

### Option 1: Vercel (Recommended - Free Tier)

Vercel offers excellent free hosting for full-stack applications.

#### Prerequisites
- GitHub repository: [bitsu-sr/kasmoni](https://github.com/bitsu-sr/kasmoni)
- Vercel account (free tier available)
- Node.js 18+ (handled by Vercel)

#### Deployment Steps

1. **Connect to Vercel**
   - Go to [Vercel.com](https://vercel.com)
   - Sign in with your GitHub account
   - Click "New Project"
   - Import your repository: `bitsu-sr/kasmoni`
   - Vercel will automatically detect the `vercel.json` configuration

2. **Configure Environment Variables**
   In your Vercel project dashboard, go to "Settings" → "Environment Variables" and add:

   ```
   JWT_SECRET=your-secure-jwt-secret-here
   NODE_ENV=production
   ```

   **Important**: Generate a strong JWT secret (you can use a password generator or run `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)

3. **Deploy**
   - Vercel will automatically start the deployment process
   - The build process will:
     - Install dependencies for both backend and frontend
     - Build the TypeScript backend
     - Build the React frontend
     - Deploy both services

4. **Monitor Deployment**
   - Check the "Deployments" tab in Vercel dashboard
   - Monitor logs for any build errors
   - The health check endpoint `/api/health` will verify the deployment

#### Vercel Benefits
- **Free Tier**: Generous limits (100GB bandwidth/month)
- **Automatic HTTPS**: SSL certificates included
- **Global CDN**: Fast loading worldwide
- **Custom Domains**: Free custom domain support
- **Serverless Functions**: Perfect for your Express API
- **Static Hosting**: Optimized for React frontend

### Option 2: Railway (Limited Plan)

If you want to use Railway's database-only plan:

1. **Deploy Database Only**
   - Use Railway for PostgreSQL database
   - Set up database connection
   - Run migrations

2. **Deploy Application Elsewhere**
   - Deploy backend to Vercel/Render/Heroku
   - Deploy frontend to Vercel/Netlify
   - Connect to Railway database

### Option 3: Render (Free Tier)

Render offers free hosting for full-stack applications:

1. **Connect to Render**
   - Go to [Render.com](https://render.com)
   - Sign up with GitHub
   - Create new Web Service
   - Connect your repository

2. **Configure Build**
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node

3. **Set Environment Variables**
   ```
   JWT_SECRET=your-secure-jwt-secret-here
   NODE_ENV=production
   ```

## Application Structure

```
kasmoni/
├── backend/          # Node.js/Express API
│   ├── src/         # TypeScript source
│   ├── dist/        # Compiled JavaScript (generated)
│   └── database/    # SQLite database files
├── frontend/        # React application
│   ├── src/         # React source
│   └── build/       # Production build (generated)
├── vercel.json      # Vercel configuration
├── railway.json     # Railway configuration
└── package.json     # Root package.json
```

## Build Process

1. **Install Dependencies**: Both backend and frontend dependencies
2. **Build Backend**: TypeScript compilation to `backend/dist/`
3. **Build Frontend**: React build to `frontend/build/`
4. **Deploy**: Platform-specific deployment process

## Database

- **SQLite**: File-based database stored in `backend/database/`
- **Persistence**: Vercel provides persistent storage
- **Backup**: Consider regular database backups
- **Alternative**: Consider PostgreSQL for production scale

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `JWT_SECRET` | JWT signing secret | Yes |
| `NODE_ENV` | Environment (production) | Yes |
| `PORT` | Server port (auto-assigned) | No |

## Health Check

The application includes a health check endpoint:
- **URL**: `/api/health`
- **Method**: GET
- **Response**: JSON with status and timestamp

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check platform logs for TypeScript compilation errors
   - Verify all dependencies are in `package.json`

2. **Database Issues**
   - Ensure SQLite database files are not in `.gitignore`
   - Check file permissions in deployment environment

3. **Port Issues**
   - Platforms automatically assign `PORT` environment variable
   - Application listens on `0.0.0.0` for all interfaces

4. **Frontend Not Loading**
   - Verify React build completed successfully
   - Check static file serving in Express configuration

### Logs
- View real-time logs in platform dashboard
- Check both build and runtime logs
- Monitor application startup messages

## Custom Domain (Optional)

1. In platform dashboard, go to "Settings" or "Domains"
2. Add custom domain
3. Configure DNS records as instructed
4. SSL certificate is automatically provisioned

## Monitoring

Platforms provide:
- Real-time logs
- Resource usage metrics
- Automatic restarts on failure
- Health check monitoring

## Cost Comparison

| Platform | Free Tier | Paid Plans | Notes |
|----------|-----------|------------|-------|
| **Vercel** | 100GB bandwidth/month | $20/month | Recommended |
| **Render** | 750 hours/month | $7/month | Good alternative |
| **Railway** | Database only | $5/month | Limited free tier |
| **Netlify** | 100GB bandwidth/month | $19/month | Frontend focused |

## Security

- Environment variables are encrypted
- HTTPS enabled by default
- JWT secrets should be strong and unique
- Consider rate limiting for production

## Support

For deployment issues:
1. Check platform documentation
2. Review application logs
3. Verify environment variables
4. Test locally before deploying

## Recommendation

**Use Vercel** for the best free tier experience:
- Generous limits
- Excellent developer experience
- Perfect for full-stack applications
- Great documentation and support 