-----

# AgentWall

**The "Fast Lane" for AI Agents.**

> **Don't block bots. Bill them.**

AgentWall is a **Hybrid Middleware** that works alongside Cloudflare. It allows websites to keep their robust security (CAPTCHAs) for humans while opening a **VIP Toll Lane** for AI Agents and Scrapers willing to pay.

-----

## The Problem: The False Positive Trap

Websites use Cloudflare to block bots. This works great for DDOS protection, but it creates a massive problem for the **AI Economy**:

1.  **AI Agents are "Good Bots":** They want to buy your data/services, but they get blocked by CAPTCHAs they can't solve.
2.  **The Dead End:** When an Agent gets blocked (403/Challenge), they have no way to say "Wait, I'll pay you!" because the connection is cut before it reaches your server.

## The Solution: The "Pay-to-Pass" Protocol

AgentWall introduces a standard **"Pre-Flight Check"** and a **"Bypass Header"**.

1.  **Humans** -> Cloudflare Challenge -> Free Access.
2.  **Bots** -> Pay AgentWall -> Get **Bypass Token** -> Cloudflare Skips Challenge -> Paid Access.

-----

## Architecture: The Hybrid Flow

### 1. The Pre-Flight (Discovery)

Since the Agent is blocked from reaching `example.com`, it first checks the **AgentWall Directory**:

```http
GET https://api.agentwall.so/check?domain=example.com
```

**Response:**

```json
{
  "enabled": true,
  "price": "0.01 USDC",
  "recipient": "0xMerchantWallet...",
  "chain": "base-mainnet"
}
```

### 2. The Payment (x402)

The Agent pays the fee on the **Base Blockchain**.

  * **Gas:** < $0.01
  * **Time:** ~2 seconds
  * **Result:** AgentWall issues a **Signed JWT (The Bypass Token)**.

### 3. The Bypass (Access)

The Agent retries the original request with the **VIP Header**:

```http
GET https://example.com/api/data
X-AgentWall-Token: eyJhbGciOi... (Signed JWT)
```

  * **Cloudflare:** Sees the header -> **SKIPS** the CAPTCHA.
  * **Your Server:** Verifies the JWT signature -> Serves the data.

-----

## Integration (3 Steps)

### Step 1: Install Middleware (Node.js)

This verifies the token *after* Cloudflare lets it through.

```javascript
import { agentwall } from '@agentwall/express';

const app = express();

// 1. Configure the middleware
app.use(agentwall({
  secret: process.env.AGENTWALL_SECRET, // Verifies the JWT
  merchantId: 'mer_123456',             // Your account ID
  slashing: true                        // Ban bots that reuse tokens?
}));

// 2. Your protected routes
app.get('/data', (req, res) => {
  res.json({ content: "Premium Data for Paid Bots" });
});
```

### Step 2: Configure Cloudflare WAF

You don't need Enterprise. This works on the **Free Plan**.

1.  Go to **Security** -> **WAF** -> **Custom Rules**.
2.  Create a Rule: **"Allow Paid Bots"**.
3.  **Expression:** `any(http.request.headers.names[*] == "x-agentwall-token")`
4.  **Action:** **SKIP** (Select: *All Managed Challenges* & *Super Bot Fight Mode*).

> **Why this works:** You are telling Cloudflare: *"If they have the Ticket, let them through to the door. I will check if the ticket is real."*

### Step 3: Monetize

Link your wallet in the AgentWall Dashboard. Watch the USDC stream in as bots bypass your CAPTCHA.

-----

## For Bot Developers (Client SDK)

Stop rotating proxies. Stop solving CAPTCHAs. Just pay the toll.

```bash
npm install @agentwall/client
```

```javascript
import { fetchPaid } from '@agentwall/client';

// 1. Standard fetch fails? AgentWall handles the rest.
// It checks the directory, pays the fee (USDC), and retries with the token.
const response = await fetchPaid('https://example.com/data', {
  walletPrivateKey: process.env.BOT_PRIVATE_KEY
});

const data = await response.json();
console.log(data); // "Premium Data..."
```

-----

## Roadmap & Features

  * [x] **MVP:** Node.js Middleware + Base Payments
  * [x] **Cloudflare Integration:** "Skip" Rule Documentation
  * [ ] **Clean Data Tier:** Serve JSON to bots, HTML to humans (reduces scraping parsing costs).
  * [ ] **Subscriptions:** Allow bots to pay $10/month for a permanent "Season Pass" token.
  * [ ] **Slashing:** Automatically blacklist tokens that behave maliciously (SQL injection attempts) even after paying.

-----

## Feedback Request
