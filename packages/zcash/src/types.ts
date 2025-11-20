import type { PublicKey } from "@solana/web3.js";

/**
 * Zcash Unified Address - supports both transparent and shielded addresses
 */
export interface ZcashUnifiedAddress {
	address: string;
	viewingKey?: string; // Optional viewing key for selective disclosure
}

/**
 * Deposit parameters for ZEC → zZEC
 */
export interface DepositParams {
	userSolanaAddress: PublicKey;
}

/**
 * Withdraw parameters for zZEC → ZEC
 */
export interface WithdrawParams {
	from: PublicKey;
	amount: string; // Amount in ZEC (as string to avoid precision issues)
	zcashAddress: string; // Unified Address
	viewingKey?: string; // Optional viewing key for compliance/selective disclosure
}

/**
 * Deposit result containing the Zcash deposit address
 */
export interface DepositResult {
	zcashDepositAddress: string;
}
