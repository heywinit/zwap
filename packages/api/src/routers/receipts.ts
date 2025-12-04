import { z } from "zod";
import { router, publicProcedure } from "../index";
import { db, deposits } from "@zwap/db";
import { eq } from "drizzle-orm";
import {
  computeReceiptHash,
  encryptBlobAesGcm,
  ensureSigningConfigured,
  hkdfBlindAmount,
  signEd25519,
} from "../services/signing";

export const receiptsRouter = router({
  generate: publicProcedure
    .input(
      z.object({
        depositId: z.string(),
        password: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      ensureSigningConfigured();

      const [deposit] = await db
        .select()
        .from(deposits)
        .where(eq(deposits.depositId, input.depositId))
        .limit(1);

      if (!deposit) throw new Error("Deposit not found");

      const ts = Date.now();
      const receipt_hash = computeReceiptHash(
        deposit.depositId,
        deposit.solanaTx ?? null,
        deposit.zecTxid ?? null,
        ts,
      );
      const amount_blinded = hkdfBlindAmount(String(deposit.amount));

      const payload = {
        deposit_id: deposit.depositId,
        user_pubkey: deposit.userPubkey,
        asset: deposit.asset,
        amount_blinded,
        computed_zec_amount: undefined as any,
        solana_tx: deposit.solanaTx ?? null,
        zec_txid: deposit.zecTxid ?? null,
        receipt_hash,
        timestamp: ts,
      };

      // If you want to include computed_zec_amount in demo mode, clients can fetch rate; left undefined here unless provided elsewhere

      const signature = signEd25519(receipt_hash);
      const plaintext = Buffer.from(JSON.stringify(payload));
      const { blob } = await encryptBlobAesGcm(plaintext, input.password);

      const blobB64 = blob.toString("base64");

      return {
        receipt: payload,
        signature,
        blob_b64: blobB64,
        download_name: `zwap-receipt-${deposit.depositId}.json.enc`,
      };
    }),
});