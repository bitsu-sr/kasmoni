const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting Vercel build process...');

try {
  // Install backend dependencies
  console.log('📦 Installing backend dependencies...');
  execSync('cd backend && npm install', { stdio: 'inherit' });
  
  // Build backend
  console.log('🔨 Building backend...');
  execSync('cd backend && npm run build', { stdio: 'inherit' });
  
  // Install frontend dependencies
  console.log('📦 Installing frontend dependencies...');
  execSync('cd frontend && npm install', { stdio: 'inherit' });
  
  // Build frontend
  console.log('🔨 Building frontend...');
  execSync('cd frontend && npm run build', { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
