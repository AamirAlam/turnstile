import express from 'express';
import { turnstile } from '@turnstile/express';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' }); // Load from root .env

const app = express();
const PORT = 3000;

// --- CONFIGURATION ---
const turnstileMiddleware = turnstile({
  // This is a random address for demo purposes
  recipientWallet: '0x5569A8d923f114455DeF7ae9731E26B9B8EA1D36', 
  
  // Price per session/request (e.g., 0.10 USDC)
  price: 0.000010,
  
  // Secret for signing the bypass tokens
  jwtSecret: process.env.JWT_SECRET || 'super-secret-dev-key',
  
  // Token validity (1 hour)
  tokenExpirationSeconds: 3600 
});

// --- PUBLIC ROUTES (Human/Free Tier) ---
app.get('/', (req, res) => {
  res.send('<h1>Welcome Human!</h1><p>I am protected by Cloudflare (conceptually).</p>');
});

// --- PROTECTED ROUTES (Bot/Paid Tier) ---
// Apply the middleware to your API routes
app.use('/api', turnstileMiddleware);

app.get('/api/data', (req, res) => {
  // If code reaches here, the bot has paid!
  res.json({
    status: 'success',
    data: 'This is the premium data that was hidden behind the paywall.',
    bypass_token_status: 'Active',
    expires_in: '59 minutes',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🛡️ Turnstile Gate running on http://localhost:${PORT}`);
  console.log(`🤖 Try accessing http://localhost:${PORT}/api/data to see the 402 Challenge.`);
});
