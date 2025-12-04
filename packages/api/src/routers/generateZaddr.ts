import { z } from "zod";
import { router, publicProcedure } from "../index";
import { DEMO_MODE } from "../config";
import {
  AUTO_GEN_ZADDR,
  generateDeterministicDemoAddress,
  getNewShieldedAddress,
  storeMapping,
} from "../services/zcashClient";

export const generateZaddrRouter = router({
  generate: publicProcedure
    .input(
      z.object({ seed: z.string().optional() })
    )
    .mutation(async ({ input }) => {
      const now = Date.now();
      const ttlMs = 10 * 60 * 1000; // 10 minutes advisory expiry for demo
      const expires_at = new Date(now + ttlMs).toISOString();

      if (AUTO_GEN_ZADDR && !DEMO_MODE) {
        try {
          const address = await getNewShieldedAddress();
          storeMapping({ address, generated_at: now, mode: "real", expires_at: now + ttlMs });
          return { address, mode: "real", expires_at };
        } catch (_) {
          // fall through to demo
        }
      }

      const address = generateDeterministicDemoAddress(input.seed);
      storeMapping({ address, generated_at: now, mode: "demo", expires_at: now + ttlMs });
      return { address, mode: "demo", expires_at };
    }),
});