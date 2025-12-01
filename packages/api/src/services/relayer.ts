import { Connection, PublicKey } from "@solana/web3.js";
import { BN, EventParser, BorshCoder } from "@coral-xyz/anchor";
import { db, deposits } from "@zwap/db";
import { eq } from "drizzle-orm";
import { ZcashClient } from "@zwap/zcash";
import { idl, type DepositEvent } from "@zwap/solana";

interface RelayerConfig {
  solanaRpcUrl: string;
  programId: string;
  zcashRpcUrl: string;
  zcashRpcUser: string;
  zcashRpcPassword: string;
  relayerZAddress: string;
  solToZecRate: number;
  usdcToZecRate: number;
}

export class Relayer {
  private connection: Connection;
  private zcashClient: ZcashClient;
  private programId: PublicKey;
  private config: RelayerConfig;
  private isRunning = false;
  private eventParser: EventParser;

  constructor(config: RelayerConfig) {
    this.config = config;
    this.connection = new Connection(config.solanaRpcUrl, "confirmed");
    this.programId = new PublicKey(config.programId);

    // Create event parser directly using BorshCoder
    // Convert events to types format (required by BorshCoder)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const events = (idl as any).events || [];
    // Map type names to Anchor's expected format
    const mapType = (type: string) => {
      if (type === "publicKey") return "pubkey";
      return type;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    const idlForCoder = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      version: (idl as any).version,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      name: (idl as any).name,
      events: events,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      instructions: (idl as any).instructions || [], // Required by BorshCoder
      accounts: [], // Empty accounts array - we only need events
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      types: events.map((ev: any) => ({
        name: ev.name,
        type: {
          kind: "struct",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          fields: (ev.fields || []).map((field: any) => ({
            name: field.name,
            type:
              typeof field.type === "string" ? mapType(field.type) : field.type,
          })),
        },
      })),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    const coder = new BorshCoder(idlForCoder as any);
    this.eventParser = new EventParser(this.programId, coder);

    this.zcashClient = new ZcashClient({
      rpcUrl: config.zcashRpcUrl,
      rpcUser: config.zcashRpcUser,
      rpcPassword: config.zcashRpcPassword,
    });
  }

  /**
   * Start listening to Solana program logs
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log("Relayer is already running");
      return;
    }

    this.isRunning = true;
    console.log("🚀 Starting ZWAP Relayer...");
    console.log(`📡 Monitoring program: ${this.programId.toString()}`);
    console.log(`🔗 Solana RPC: ${this.config.solanaRpcUrl}`);

    // Subscribe to program logs
    const subscriptionId = this.connection.onLogs(
      this.programId,
      async (logs) => {
        try {
          await this.handleLogs(logs);
        } catch (error) {
          console.error("❌ Error handling logs:", error);
        }
      },
      "confirmed"
    );

    console.log(`✅ Subscribed to logs (ID: ${subscriptionId})`);

    // Keep the process alive
    process.on("SIGINT", async () => {
      console.log("\n⏹️  Stopping relayer...");
      await this.stop();
      process.exit(0);
    });
  }

  /**
   * Stop the relayer
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    console.log("✅ Relayer stopped");
  }

  /**
   * Handle program logs and extract deposit events
   */
  private async handleLogs(logs: { signature: string }): Promise<void> {
    const signature = logs.signature;
    console.log(`\n📝 Processing transaction: ${signature}`);

    try {
      // Fetch the full transaction to parse events properly
      const tx = await this.connection.getTransaction(signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });

      if (!tx) {
        console.log("⚠️  Transaction not found");
        return;
      }

      // Parse events using Anchor's event parser
      const events = this.eventParser.parseLogs(tx.meta?.logMessages || []);

      for (const event of events) {
        if (event.name === "DepositEvent") {
          await this.processDeposit(
            event.data as DepositEvent & { amount: BN },
            signature
          );
        }
      }
    } catch (error) {
      console.error("❌ Error handling logs:", error);
    }
  }

  /**
   * Process a deposit event
   */
  private async processDeposit(
    event: DepositEvent & { amount: BN },
    signature: string
  ): Promise<void> {
    console.log("\n💰 New deposit detected!");
    console.log(`  User: ${event.userPubkey.toString()}`);
    console.log(`  Asset: ${event.asset}`);
    console.log(`  Amount: ${event.amount.toString()}`);
    console.log(`  Z-Address: ${event.zAddress}`);
    console.log(`  Deposit ID: ${event.depositId}`);

    try {
      // Find deposit in database
      const [deposit] = await db
        .select()
        .from(deposits)
        .where(eq(deposits.depositId, event.depositId))
        .limit(1);

      if (!deposit) {
        console.error(`❌ Deposit not found in database: ${event.depositId}`);
        return;
      }

      // IDEMPOTENCY CHECK: Skip if already processed
      if (deposit.solanaTx && deposit.solanaTx === signature) {
        console.log(`⏭️  Deposit already processed: ${event.depositId}`);
        return;
      }

      // IDEMPOTENCY CHECK: Skip if ZEC already sent
      if (deposit.status === "sent" && deposit.zecTxid) {
        console.log(`⏭️  ZEC already sent for deposit: ${event.depositId}`);
        return;
      }

      // Update with Solana transaction signature
      await db
        .update(deposits)
        .set({
          solanaTx: signature,
          updatedAt: new Date(),
        })
        .where(eq(deposits.depositId, event.depositId));

      console.log(`✅ Updated deposit with Solana TX: ${signature}`);

      // Convert amount to ZEC (handle BN type)
      const amountNumber =
        typeof event.amount === "object" && "toNumber" in event.amount
          ? (event.amount as BN).toNumber()
          : Number(event.amount);

      const zecAmount = this.convertToZec(event.asset, amountNumber);

      console.log(`💱 Converting to ZEC: ${zecAmount} ZEC`);

      // Send ZEC
      await this.sendZec(deposit.id, event.zAddress, zecAmount);
    } catch (error) {
      console.error("❌ Error processing deposit:", error);

      // Mark as failed
      try {
        await db
          .update(deposits)
          .set({
            status: "failed",
            updatedAt: new Date(),
          })
          .where(eq(deposits.depositId, event.depositId));
      } catch (dbError) {
        console.error("❌ Failed to update deposit status:", dbError);
      }
    }
  }

  /**
   * Convert SOL/USDC amount to ZEC
   */
  private convertToZec(asset: "SOL" | "USDC", amount: number): number {
    if (asset === "SOL") {
      // Convert lamports to SOL
      const solAmount = amount / 1e9;
      return solAmount * this.config.solToZecRate;
    }
    // Convert USDC (6 decimals) to ZEC
    const usdcAmount = amount / 1e6;
    return usdcAmount * this.config.usdcToZecRate;
  }

  /**
   * Send ZEC to user's shielded address
   */
  private async sendZec(
    depositId: string,
    toAddress: string,
    amount: number
  ): Promise<void> {
    console.log(`\n🔐 Sending ${amount} ZEC to ${toAddress}...`);

    try {
      // Initiate z_sendmany operation
      const operationId = await this.zcashClient.zSendMany(
        this.config.relayerZAddress,
        [
          {
            address: toAddress,
            amount,
          },
        ]
      );

      console.log(`⏳ Operation initiated: ${operationId}`);
      console.log("⏳ Waiting for ZEC transaction to complete...");

      // Wait for operation to complete
      const result = await this.zcashClient.waitForOperation(
        operationId,
        300, // 5 minutes timeout
        2000 // Poll every 2 seconds
      );

      if (result.success && result.txid) {
        console.log(`✅ ZEC sent successfully! TXID: ${result.txid}`);

        // Update database
        await db
          .update(deposits)
          .set({
            zecTxid: result.txid,
            status: "sent",
            updatedAt: new Date(),
          })
          .where(eq(deposits.id, depositId));

        console.log("✅ Database updated with ZEC TXID");
      } else {
        throw new Error(result.error || "ZEC transfer failed");
      }
    } catch (error) {
      console.error("❌ Failed to send ZEC:", error);

      // Mark as failed
      await db
        .update(deposits)
        .set({
          status: "failed",
          updatedAt: new Date(),
        })
        .where(eq(deposits.id, depositId));

      throw error;
    }
  }

  /**
   * Get relayer status
   */
  getStatus(): {
    isRunning: boolean;
    programId: string;
    relayerAddress: string;
  } {
    return {
      isRunning: this.isRunning,
      programId: this.programId.toString(),
      relayerAddress: this.config.relayerZAddress,
    };
  }
}
