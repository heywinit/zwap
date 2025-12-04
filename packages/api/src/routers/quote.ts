import { z } from "zod";
import { router, publicProcedure } from "../index";
import { getQuote } from "../services/feeEstimator";

export const quoteRouter = router({
  get: publicProcedure
    .input(z.object({ asset: z.enum(["SOL", "USDC"]), amount: z.string(), speed: z.enum(["slow", "normal", "fast"]).optional() }))
    .query(async ({ input }) => {
      const amt = Number(input.amount);
      return getQuote(input.asset, amt, input.speed ?? "normal");
    }),
});