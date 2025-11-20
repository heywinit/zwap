import type { PublicKey } from "@solana/web3.js";

export interface ProgramAccount {
	publicKey: PublicKey;
	account: unknown;
}

export interface SwapParams {
	fromToken: PublicKey;
	toToken: PublicKey;
	amount: bigint;
	minAmountOut: bigint;
}
