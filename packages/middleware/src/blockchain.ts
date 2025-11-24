import { createPublicClient, http, parseAbiItem, formatUnits } from 'viem';
import { base } from 'viem/chains';

// USDC Contract Address on Base Mainnet
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

// Transfer Event Topic (Standard ERC20)
const TRANSFER_EVENT_ABI = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 value)'
);

export class BlockchainVerifier {
  private client;

  constructor(rpcUrl?: string) {
    this.client = createPublicClient({
      chain: base,
      transport: http(rpcUrl)
    });
  }

  /**
   * Verifies a transaction on Base:
   * 1. Checks if it succeeded
   * 2. Checks if it transferred USDC to our wallet
   * 3. Checks if the amount is sufficient
   */
  async verifyPayment(
    txHash: `0x${string}`,
    recipient: string,
    requiredAmount: number
  ): Promise<{ valid: boolean; payer?: string; error?: string }> {
    try {
      // 1. Fetch Transaction Receipt
      const receipt = await this.client.getTransactionReceipt({ hash: txHash });

      if (receipt.status !== 'success') {
        return { valid: false, error: 'Transaction failed on-chain' };
      }

      // 2. Parse Logs to find USDC Transfer
      const logs = await this.client.getLogs({ 
        address: USDC_ADDRESS,
        event: TRANSFER_EVENT_ABI,
        fromBlock: receipt.blockNumber,
        toBlock: receipt.blockNumber
      });

      const transferLog = logs.find(
        (log) => log.transactionHash.toLowerCase() === txHash.toLowerCase()
      );

      if (!transferLog) {
        return { valid: false, error: 'No USDC transfer found in transaction' };
      }

      const { to, value, from } = transferLog.args;

      // 3. Verify Recipient
      if (to?.toLowerCase() !== recipient.toLowerCase()) {
        return { valid: false, error: 'Payment sent to wrong address' };
      }

      // 4. Verify Amount (USDC has 6 decimals)
      const paidAmount = parseFloat(formatUnits(value || 0n, 6));
      
      if (paidAmount < requiredAmount) {
        return { 
          valid: false, 
          error: `Insufficient payment. Paid: ${paidAmount}, Required: ${requiredAmount}` 
        };
      }

      return { valid: true, payer: from };

    } catch (err) {
      console.error("Blockchain Verification Error:", err);
      return { valid: false, error: 'Failed to verify transaction network' };
    }
  }
}
