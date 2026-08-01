#!/usr/bin/env node
/**
 * SSGzone — Secret Generator
 * Run: node scripts/generate-secrets.js
 *
 * Generates cryptographically random values for all secrets
 * required in .env. Copy the output into your .env file.
 */

const crypto = require('crypto');

const secrets = {
  JWT_SECRET:      crypto.randomBytes(64).toString('hex'),
  ENCRYPTION_KEY:  crypto.randomBytes(32).toString('hex'),
  DB_PASSWORD:     crypto.randomBytes(24).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 32),
  MINIO_ROOT_PASSWORD: crypto.randomBytes(16).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 20),
};

console.log('\n=== SSGzone Generated Secrets ===');
console.log('Copy these into your .env file.\n');
Object.entries(secrets).forEach(([key, value]) => {
  console.log(`${key}=${value}`);
});
console.log('\n⚠  Store these securely. Do not commit them to git.');
console.log('⚠  AWS credentials must be rotated in AWS IAM Console — this script cannot do that.\n');
