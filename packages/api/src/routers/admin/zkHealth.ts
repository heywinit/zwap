import { router, publicProcedure } from "../../index";
import { getMetrics } from "../../services/proofMetrics";

export const zkHealthRouter = router({
  get: publicProcedure.query(() => {
    return getMetrics();
  }),
});