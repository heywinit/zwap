import { Connection, type PublicKey } from "@solana/web3.js";
import { ZorionBridge } from "@zorion/bridge-sdk";
import { z } from "zod";

const zcashConfigSchema = z.object({
	solanaRpcUrl: z.string().url().default("https://api.mainnet-beta.solana.com"),
	connection: z.custom<Connection>().optional(),
});

export type ZcashConfig = z.infer<typeof zcashConfigSchema>;

export class ZcashClient {
	private bridge: ZorionBridge;
	private connection: Connection;

	constructor(config: ZcashConfig) {
		const validated = zcashConfigSchema.parse(config);
		this.connection =
			validated.connection || new Connection(validated.solanaRpcUrl);
		this.bridge = new ZorionBridge({ connection: this.connection });
	}

	/**
	 * Get a unique Zcash deposit address for a user's Solana address.
	 * After Zcash confirmations, zZEC will be automatically minted to the Solana address.
	 */
	async getDepositAddress(
		userSolanaAddress: PublicKey,
	): Promise<{ zcashDepositAddress: string }> {
		return await this.bridge.getDepositAddress(userSolanaAddress);
	}

	/**
	 * Withdraw zZEC from Solana and receive native ZEC to a Zcash Unified Address.
	 * @param from - Solana address to withdraw from
	 * @param amount - Amount in ZEC (as string, e.g., "1.25")
	 * @param zcashAddress - Zcash Unified Address (shielded by default)
	 * @param viewingKey - Optional viewing key for selective disclosure
	 */
	async withdraw(params: {
		from: PublicKey;
		amount: string;
		zcashAddress: string;
		viewingKey?: string;
	}): Promise<void> {
		await this.bridge.withdraw({
			from: params.from,
			amount: params.amount,
			zcashAddress: params.zcashAddress,
			viewingKey: params.viewingKey,
		});
	}

	/**
	 * Get the underlying ZorionBridge instance for advanced usage
	 */
	getBridge(): ZorionBridge {
		return this.bridge;
	}

	/**
	 * Get the Solana connection
	 */
	getConnection(): Connection {
		return this.connection;
	}
}
