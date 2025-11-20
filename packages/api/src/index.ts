import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context";

export const t = initTRPC.context<Context>().create();

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
	if (!ctx.session) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "You must be signed in to access this resource",
		});
	}

	return next({
		ctx: {
			...ctx,
			session: ctx.session, // TypeScript now knows session is not null
		},
	});
});
