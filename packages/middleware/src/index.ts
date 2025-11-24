import { Request, Response, NextFunction } from 'express';
import { TurnstileConfig } from './types';
import { BlockchainVerifier } from './blockchain';
import { TokenManager } from './token';

// Simple in-memory cache to prevent reusing the same TX hash immediately
const usedTxHashes = new Set<string>();

export const turnstile = (config: TurnstileConfig) => {
  const verifier = new BlockchainVerifier(config.rpcUrl);
  const tokenManager = new TokenManager(config.jwtSecret, config.tokenExpirationSeconds);

  return async (req: Request, res: Response, next: NextFunction) => {
    // --- 1. CHECK FOR BYPASS TOKEN (Fast Lane) ---
    const bypassToken = req.headers['x-turnstile-token'] as string;

    if (bypassToken) {
      const valid = tokenManager.verifyToken(bypassToken);
      if (valid) {
        (req as any).turnstile = valid;
        return next();
      }
    }

    // --- 2. CHECK FOR NEW PAYMENT (Payment Lane) ---
    const paymentTx = req.headers['x-turnstile-payment-tx'] as string;

    if (paymentTx) {
      // Prevent Replay Attacks (Basic)
      if (usedTxHashes.has(paymentTx)) {
        return res.status(400).json({ error: 'Transaction hash already used' });
      }

      const result = await verifier.verifyPayment(
        paymentTx as `0x${string}`,
        config.recipientWallet,
        config.price
      );

      if (result.valid && result.payer) {
        // Mark hash as used and generate the Pass
        usedTxHashes.add(paymentTx);
        const newToken = tokenManager.generateToken(paymentTx, result.payer);

        // Send the token back to the bot
        res.setHeader('X-Turnstile-Token', newToken);
        
        return next();
      } else {
        return res.status(402).json({ 
          error: 'Payment verification failed', 
          details: result.error 
        });
      }
    }

    // --- 3. CHALLENGE (The Gate) ---
    res.status(402).json({
      error: "Payment Required",
      message: "This endpoint is protected by Turnstile. Please pay to access.",
      payment_info: {
        price: config.price,
        currency: "USDC",
        network: "base", 
        recipient: config.recipientWallet,
        instruction: "Send USDC to recipient. Retry request with header 'X-Turnstile-Payment-Tx: <tx_hash>'."
      }
    });
  };
};
