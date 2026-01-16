#!/usr/bin/env node
// Script to migrate production database
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Try to get DATABASE_URL from various sources
let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  // Try to load from .env.local
  const envLocalPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envLocalPath)) {
    const envContent = fs.readFileSync(envLocalPath, 'utf-8');
    const match = envContent.match(/DATABASE_URL="?([^"\n]+)"?/);
    if (match) {
      databaseUrl = match[1];
    }
  }
}

if (!databaseUrl) {
  console.error('DATABASE_URL not found. Please set it in .env.local or as an environment variable.');
  process.exit(1);
}

console.log('Running Prisma migrations...');
console.log('Database:', databaseUrl.split('@')[1]?.split('?')[0] || 'unknown');

try {
  const projectRoot = path.join(__dirname, '..');
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
    cwd: projectRoot
  });
  console.log('✅ Migrations deployed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}
