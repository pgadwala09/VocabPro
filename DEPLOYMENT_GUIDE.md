# VocabPro Deployment Guide

This guide will help you deploy your VocabPro application to various platforms.

## Prerequisites

1. **Environment Variables**: Ensure all required environment variables are configured
2. **Build Ready**: Your application should build successfully locally
3. **Git Repository**: Your code should be in a Git repository (recommended)

## Environment Variables Setup

Create a `.env` file in your project root with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key

# N8n Configuration (if using)
VITE_N8N_BASE_URL=your_n8n_base_url
VITE_N8N_API_KEY=your_n8n_api_key

# Optional: SerpAPI (web search)
VITE_SERPAPI_KEY=your_serpapi_key

# Optional: ElevenLabs (TTS)
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Optional: Google Cloud (TTS)
VITE_GOOGLE_CLOUD_PROJECT_ID=your_google_cloud_project_id
```

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel is the easiest platform for React/Vite applications.

#### Steps:
1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Build your application**:
   ```bash
   npm run build
   ```

3. **Deploy to Vercel**:
   ```bash
   vercel
   ```

4. **Configure environment variables** in Vercel dashboard:
   - Go to your project settings
   - Add all environment variables from your `.env` file
   - Redeploy if needed

#### Vercel Configuration (vercel.json)
Create a `vercel.json` file in your project root:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Option 2: Netlify

#### Steps:
1. **Build your application**:
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**:
   - Drag and drop the `dist` folder to Netlify
   - Or use Netlify CLI:
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod --dir=dist
   ```

3. **Configure environment variables** in Netlify dashboard

#### Netlify Configuration (_redirects)
Create a `public/_redirects` file:

```
/*    /index.html   200
```

### Option 3: GitHub Pages

#### Steps:
1. **Add GitHub Pages configuration** to `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/your-repo-name/', // Replace with your repository name
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
```

2. **Create GitHub Actions workflow** (`.github/workflows/deploy.yml`):

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
      env:
        VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        VITE_OPENAI_API_KEY: ${{ secrets.VITE_OPENAI_API_KEY }}
    
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

3. **Configure GitHub Secrets**:
   - Go to your repository settings
   - Add all environment variables as secrets

### Option 4: Firebase Hosting

#### Steps:
1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Initialize Firebase**:
   ```bash
   firebase login
   firebase init hosting
   ```

3. **Configure Firebase** (`firebase.json`):
   ```json
   {
     "hosting": {
       "public": "dist",
       "ignore": [
         "firebase.json",
         "**/.*",
         "**/node_modules/**"
       ],
       "rewrites": [
         {
           "source": "**",
           "destination": "/index.html"
         }
       ]
     }
   }
   ```

4. **Build and deploy**:
   ```bash
   npm run build
   firebase deploy
   ```

### Option 5: AWS S3 + CloudFront

#### Steps:
1. **Install AWS CLI** and configure credentials
2. **Create S3 bucket** for hosting
3. **Build and upload**:
   ```bash
   npm run build
   aws s3 sync dist/ s3://your-bucket-name --delete
   ```
4. **Configure CloudFront** for CDN and HTTPS

## Pre-deployment Checklist

### 1. Build Testing
```bash
# Test build locally
npm run build
npm run preview
```

### 2. Environment Variables
- [ ] All required environment variables are set
- [ ] API keys are valid and have proper permissions
- [ ] Supabase project is configured correctly

### 3. Performance Optimization
- [ ] Images are optimized
- [ ] Bundle size is reasonable
- [ ] Lazy loading is implemented where appropriate

### 4. Security
- [ ] No sensitive data in client-side code
- [ ] Environment variables are properly configured
- [ ] API keys are secured

## Post-deployment Steps

### 1. Testing
- [ ] Test all major features
- [ ] Verify authentication works
- [ ] Check real-time features (if applicable)
- [ ] Test on different devices/browsers

### 2. Monitoring
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Configure analytics
- [ ] Monitor performance metrics

### 3. Documentation
- [ ] Update README with deployment information
- [ ] Document any deployment-specific configurations
- [ ] Create troubleshooting guide

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check for TypeScript errors
   - Verify all dependencies are installed
   - Check environment variables

2. **Runtime Errors**:
   - Verify environment variables are set correctly
   - Check browser console for errors
   - Test API endpoints

3. **CORS Issues**:
   - Configure CORS in your backend services
   - Check Supabase RLS policies

4. **404 Errors**:
   - Ensure proper routing configuration
   - Check for SPA fallback configuration

### Debug Commands

```bash
# Check build output
npm run build

# Preview build locally
npm run preview

# Check bundle size
npm run build -- --analyze

# Lint code
npm run lint
```

## Continuous Deployment

For automated deployments, consider setting up:

1. **GitHub Actions** for CI/CD
2. **Vercel/Netlify** automatic deployments
3. **Docker** containers for consistent environments

## Support

For deployment issues:
1. Check the platform-specific documentation
2. Review error logs
3. Test locally first
4. Contact platform support if needed

## Next Steps

After successful deployment:
1. Share your application URL
2. Gather user feedback
3. Monitor performance and errors
4. Plan future iterations
