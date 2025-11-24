import jwt from 'jsonwebtoken';
import { PaymentClaims } from './types';

export class TokenManager {
  private secret: string;
  private expiration: number;

  constructor(secret: string, expirationSeconds: number = 3600) {
    this.secret = secret;
    this.expiration = expirationSeconds;
  }

  /**
   * Generate a "Bypass Token" for the bot
   */
  generateToken(txHash: string, payer: string): string {
    const payload: PaymentClaims = {
      txHash,
      payer,
      timestamp: Date.now()
    };

    return jwt.sign(payload, this.secret, { expiresIn: this.expiration });
  }

  /**
   * Verify the token provided in headers
   */
  verifyToken(token: string): PaymentClaims | null {
    try {
      return jwt.verify(token, this.secret) as PaymentClaims;
    } catch (err) {
      return null;
    }
  }
}
