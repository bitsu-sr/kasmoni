# Railway Deployment Guide

This guide will help you deploy your Kasmoni application to Railway.

## Prerequisites

- Railway account (sign up at [railway.app](https://railway.app))
- GitHub repository connected to Railway
- Node.js 18+ (Railway supports this automatically)

## Environment Variables

### Required Environment Variables

Set these in your Railway project dashboard:

```
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
```

### Optional Environment Variables

```
PORT=5000  # Railway sets this automatically
```

## Deployment Steps

### 1. Connect to Railway

1. Go to [Railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your GitHub account
5. Select your `kasmoni` repository

### 2. Configure Build Settings

In your Railway project settings:

- **Root Directory**: `backend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### 3. Set Environment Variables

In Railway dashboard → Variables tab:

```
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
```

### 4. Deploy

Railway will automatically:
1. Install dependencies
2. Build the TypeScript code
3. Start the server
4. Provide you with a public URL

## Frontend Deployment

### Option A: Deploy Frontend Separately

1. Create a new Railway service for the frontend
2. Set root directory to `frontend`
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Set environment variable:
   ```
   REACT_APP_API_URL=https://your-backend-url.railway.app/api
   ```

### Option B: Use Vercel/Netlify for Frontend

1. Connect your GitHub repo to Vercel/Netlify
2. Set build directory to `frontend`
3. Set environment variable:
   ```
   REACT_APP_API_URL=https://your-backend-url.railway.app/api
   ```

## Database Considerations

### Current Setup (SQLite)
- SQLite files are stored locally
- **Not suitable for production** as they're not persistent
- Data will be lost on container restarts

### Recommended: PostgreSQL
For production, consider migrating to PostgreSQL:

1. Add PostgreSQL service in Railway
2. Update database connection
3. Run migrations

## Health Check

Your app includes a health check endpoint:
- URL: `https://your-app.railway.app/api/health`
- Returns: `{ "success": true, "message": "Sranan Kasmoni API is running" }`

## Monitoring

Railway provides:
- Logs in real-time
- Metrics dashboard
- Automatic restarts on failure
- Custom domains

## Troubleshooting

### Common Issues

1. **Build fails**: Check Node.js version compatibility
2. **Port issues**: Railway sets PORT automatically
3. **Database errors**: Ensure database directory exists
4. **CORS errors**: Frontend URL not in allowed origins

### Debug Commands

```bash
# Check logs
railway logs

# Check environment variables
railway variables

# Restart service
railway service restart
```

## Security Notes

1. **JWT_SECRET**: Use a strong, unique secret
2. **CORS**: Configure for your frontend domain
3. **Database**: Consider PostgreSQL for production
4. **HTTPS**: Railway provides this automatically

## Cost Optimization

- Railway has a free tier
- Monitor usage in dashboard
- Consider auto-scaling settings

## Support

- Railway Documentation: [docs.railway.app](https://docs.railway.app)
- Community: [Railway Discord](https://discord.gg/railway) 