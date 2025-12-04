import crypto from "crypto";
import { db, deposits } from "@zwap/db";
import { eq } from "drizzle-orm";

type Phase = "simulated_submitted" | "processing" | "sent";

const inMemoryPhases = new Map<string, Phase>();

export function getPhase(depositId: string): Phase | undefined {
  return inMemoryPhases.get(depositId);
}

export function enqueueSimulation(
  depositId: string,
  delayMs: number,
  timestampMs: number,
) {
  inMemoryPhases.set(depositId, "simulated_submitted");

  setTimeout(async () => {
    inMemoryPhases.set(depositId, "processing");
    try {
      await db
        .update(deposits)
        .set({ updatedAt: new Date() })
        .where(eq(deposits.depositId, depositId));
    } catch (_) {}
  }, delayMs);

  setTimeout(async () => {
    const digest = crypto
      .createHash("sha256")
      .update(`fake|${depositId}|${timestampMs}`)
      .digest("hex")
      .slice(0, 64);

    inMemoryPhases.set(depositId, "sent");
    try {
      await db
        .update(deposits)
        .set({ zecTxid: digest, status: "sent", updatedAt: new Date() })
        .where(eq(deposits.depositId, depositId));
    } catch (_) {}
  }, delayMs * 2);
}