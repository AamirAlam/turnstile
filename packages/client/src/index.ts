import { createWalletClient, http, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

// USDC Contract on Base
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

// Minimal ABI for ERC20 Transfer
const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
] as const;

interface TurnstileOptions {
  privateKey: `0x${string}`;
  rpcUrl?: string;
}

/**
 * A wrapper around fetch that handles Turnstile 402 payments automatically.
 */
export async function fetchPaid(url: string, options: TurnstileOptions) {
  const { privateKey, rpcUrl } = options;

  // 1. Attempt the request normally (Optimistic fetch)
  console.log(`🤖 Bot: Requesting ${url}...`);
  let response = await fetch(url);

  // 2. If success, return immediately
  if (response.status !== 402) {
    return response;
  }

  // 3. Handle 402 Payment Required
  console.log(`⛔ Bot: Hit Paywall (402). Analyzing costs...`);
  
  const challenge = await response.json();
  const { price, currency, recipient } = challenge.payment_info;

  if (currency !== 'USDC') {
    throw new Error(`Unsupported currency: ${currency}`);
  }

  console.log(`💰 Bot: Price is ${price} USDC. Paying to ${recipient}...`);

  // 4. Initialize Wallet
  const account = privateKeyToAccount(privateKey);
  const client = createWalletClient({
    account,
    chain: base,
    transport: http(rpcUrl)
  }).extend(publicActions);

  try {
    // 5. Execute Payment on Blockchain
    const amountBigInt = BigInt(Math.round(price * 1_000_000));

    const txHash = await client.writeContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [recipient as `0x${string}`, amountBigInt]
    });

    console.log(`✅ Bot: Payment sent! TX: ${txHash}`);
    console.log(`⏳ Bot: Waiting for confirmation...`);

    // Wait for transaction to be included in a block
    await client.waitForTransactionReceipt({ hash: txHash });

    // 6. Retry Request with Payment Proof
    console.log(`🔄 Bot: Retrying request with proof...`);
    
    response = await fetch(url, {
      headers: {
        'X-Turnstile-Payment-Tx': txHash
      }
    });

    if (response.ok) {
      const bypassToken = response.headers.get('X-Turnstile-Token');
      if (bypassToken) {
        console.log(`🎟️ Bot: Received Bypass Token! Saving for session.`);
      }
    }

    return response;

  } catch (error) {
    console.error("Payment Failed:", error);
    throw error;
  }
}
