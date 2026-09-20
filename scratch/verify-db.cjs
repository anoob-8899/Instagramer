const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.log('Error: .env not found');
  process.exit(1);
}

const env = fs.readFileSync(envPath, 'utf8');
const match = env.match(/DATABASE_URL=["']?([^"'\r\n]+)/);
if (match) {
  try {
    const u = new URL(match[1]);
    const isNeon = u.hostname.endsWith('neon.tech');
    console.log('Database Host:', isNeon ? 'Verified Neon' : 'Non-Neon');
    console.log('Database Path:', u.pathname.replace('/', ''));
    console.log('Verification: SUCCESS');
  } catch (err) {
    console.log('Error parsing DATABASE_URL URL:', err.message);
  }
} else {
  console.log('No DATABASE_URL found in .env');
}
