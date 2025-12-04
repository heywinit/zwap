import { publicProcedure, router } from "../index";
import { authRouter } from "./auth";
import { depositRouter } from "./deposit";
import { generateZaddrRouter } from "./generateZaddr";
import { zkHealthRouter } from "./admin/zkHealth";
import { receiptsRouter } from "./receipts";
import { quoteRouter } from "./quote";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	auth: authRouter,
	deposit: depositRouter,
	zaddr: generateZaddrRouter,
    admin: zkHealthRouter,
	receipts: receiptsRouter,
	quote: quoteRouter,
});
export type AppRouter = typeof appRouter;
