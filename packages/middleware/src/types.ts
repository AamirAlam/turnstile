export interface TurnstileConfig {
  /**
   * The wallet address that should receive the payment
   */
  recipientWallet: `0x${string}`;

  /**
   * Price per request in USDC (e.g., 0.01)
   */
  price: number;

  /**
   * Secret key for signing bypass tokens (JWTs)
   * Should be a long random string.
   */
  jwtSecret: string;

  /**
   * Turnstile Token Expiration in seconds (default: 1 hour)
   * How long the bot can scrape after paying once.
   */
  tokenExpirationSeconds?: number;

  /**
   * Base RPC URL (Optional)
   * Defaults to a public endpoint if not provided.
   */
  rpcUrl?: string;
}

export interface PaymentClaims {
  txHash: string;
  payer: string;
  timestamp: number;
}
