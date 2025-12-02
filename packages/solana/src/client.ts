import {
	Connection,
	PublicKey,
	SystemProgram,
	Transaction,
	TransactionInstruction,
} from "@solana/web3.js";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import type { Zwap } from "./types";
import idl from "./idl.json";

export class ZwapClient {
	private program: Program<Zwap>;
	private connection: Connection;

	constructor(connection: Connection, wallet: any) {
		this.connection = connection;
		const provider = new AnchorProvider(connection, wallet, {
			commitment: "confirmed",
		});
		this.program = new Program(idl as any, provider);
	}

	/**
	 * Get the vault PDA address
	 */
	getVaultAddress(): [PublicKey, number] {
		return PublicKey.findProgramAddressSync(
			[Buffer.from("vault")],
			this.program.programId,
		);
	}

	/**
	 * Initialize the vault (one-time setup)
	 */
	async initialize(authority: PublicKey): Promise<string> {
		const [vaultPda] = this.getVaultAddress();

		const tx = await this.program.methods
			.initialize()
			.accounts({
				vault: vaultPda,
				authority,
				systemProgram: SystemProgram.programId,
			})
			.rpc();

		return tx;
	}

	/**
	 * Deposit SOL to receive ZEC
	 */
	async depositSol(
		user: PublicKey,
		amount: number,
		depositId: string,
		zAddress: string,
	): Promise<string> {
		const [vaultPda] = this.getVaultAddress();
		const amountLamports = new BN(amount * 1e9); // Convert SOL to lamports

		const tx = await this.program.methods
			.depositSol(amountLamports, depositId, zAddress)
			.accounts({
				vault: vaultPda,
				user,
				systemProgram: SystemProgram.programId,
			})
			.rpc();

		return tx;
	}

	/**
	 * Deposit USDC to receive ZEC
	 */
	async depositUsdc(
		user: PublicKey,
		amount: number,
		depositId: string,
		zAddress: string,
		usdcMint: PublicKey,
	): Promise<string> {
		const [vaultPda] = this.getVaultAddress();
		const amountTokens = new BN(amount * 1e6); // USDC has 6 decimals

		// Get user's USDC token account
		const userTokenAccount = await getAssociatedTokenAddress(usdcMint, user);

		// Get vault's USDC token account
		const vaultTokenAccount = await getAssociatedTokenAddress(
			usdcMint,
			vaultPda,
			true,
		);

		const tx = await this.program.methods
			.depositUsdc(amountTokens, depositId, zAddress)
			.accounts({
				vault: vaultPda,
				user,
				userTokenAccount,
				vaultTokenAccount,
				tokenProgram: new PublicKey(
					"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
				),
			})
			.rpc();

		return tx;
	}

	/**
	 * Build a deposit SOL transaction (for manual signing)
	 */
	async buildDepositSolTransaction(
		user: PublicKey,
		amount: number,
		depositId: string,
		zAddress: string,
	): Promise<Transaction> {
		const [vaultPda] = this.getVaultAddress();
		const amountLamports = new BN(amount * 1e9);

		const instruction = await this.program.methods
			.depositSol(amountLamports, depositId, zAddress)
			.accounts({
				vault: vaultPda,
				user,
				systemProgram: SystemProgram.programId,
			})
			.instruction();

		const transaction = new Transaction().add(instruction);
		transaction.feePayer = user;
		transaction.recentBlockhash = (
			await this.connection.getLatestBlockhash()
		).blockhash;

		return transaction;
	}

	/**
	 * Build a deposit USDC transaction (for manual signing)
	 */
	async buildDepositUsdcTransaction(
		user: PublicKey,
		amount: number,
		depositId: string,
		zAddress: string,
		usdcMint: PublicKey,
	): Promise<Transaction> {
		const [vaultPda] = this.getVaultAddress();
		const amountTokens = new BN(amount * 1e6);

		const userTokenAccount = await getAssociatedTokenAddress(usdcMint, user);
		const vaultTokenAccount = await getAssociatedTokenAddress(
			usdcMint,
			vaultPda,
			true,
		);

		const instruction = await this.program.methods
			.depositUsdc(amountTokens, depositId, zAddress)
			.accounts({
				vault: vaultPda,
				user,
				userTokenAccount,
				vaultTokenAccount,
				tokenProgram: new PublicKey(
					"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
				),
			})
			.instruction();

		const transaction = new Transaction().add(instruction);
		transaction.feePayer = user;
		transaction.recentBlockhash = (
			await this.connection.getLatestBlockhash()
		).blockhash;

		return transaction;
	}

	/**
	 * Get program ID
	 */
	getProgramId(): PublicKey {
		return this.program.programId;
	}

	/**
	 * Get connection
	 */
	getConnection(): Connection {
		return this.connection;
	}
}
