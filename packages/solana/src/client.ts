import { AnchorProvider } from "@coral-xyz/anchor";
import { Connection, type PublicKey, type Transaction } from "@solana/web3.js";
import { z } from "zod";

const connectionSchema = z.object({
	rpcUrl: z.string().url().default("http://localhost:8899"),
	commitment: z
		.enum(["processed", "confirmed", "finalized"])
		.default("confirmed"),
});

export type ConnectionConfig = z.infer<typeof connectionSchema>;

export class SolanaClient {
	private connection: Connection;
	private provider?: AnchorProvider;

	constructor(config: ConnectionConfig) {
		const validated = connectionSchema.parse(config);
		this.connection = new Connection(validated.rpcUrl, validated.commitment);
	}

	getConnection(): Connection {
		return this.connection;
	}

	getProvider(wallet?: {
		publicKey: PublicKey;
		signTransaction: (transaction: Transaction) => Promise<Transaction>;
		signAllTransactions: (
			transactions: Transaction[],
		) => Promise<Transaction[]>;
	}): AnchorProvider {
		if (!this.provider && wallet) {
			this.provider = new AnchorProvider(this.connection, wallet, {
				commitment: this.connection.commitment,
			});
		}
		if (!this.provider) {
			throw new Error(
				"Provider not initialized. Pass a wallet to getProvider()",
			);
		}
		return this.provider;
	}

	async getBalance(address: PublicKey): Promise<number> {
		const balance = await this.connection.getBalance(address);
		return balance / 1e9; // Convert lamports to SOL
	}
}
