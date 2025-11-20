import { PublicKey } from "@solana/web3.js";
import { TRPCError } from "@trpc/server";
import bs58 from "bs58";
import nacl from "tweetnacl";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../index";

const signInSchema = z.object({
	publicKey: z.string(),
	signature: z.string(),
	message: z.string(),
	timestamp: z.number().optional(),
});

export const authRouter = router({
	signIn: publicProcedure.input(signInSchema).mutation(async ({ input }) => {
		try {
			// Verify the signature
			const publicKey = new PublicKey(input.publicKey);
			const message = new TextEncoder().encode(input.message);
			const signature = bs58.decode(input.signature);

			// Verify the signature using nacl
			const isValid = nacl.sign.detached.verify(
				message,
				signature,
				publicKey.toBytes(),
			);

			if (!isValid) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Invalid signature",
				});
			}

			// Optional: Verify message hasn't expired (if timestamp is provided)
			if (input.timestamp) {
				const now = Date.now();
				const fiveMinutes = 5 * 60 * 1000;
				if (now - input.timestamp > fiveMinutes) {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message: "Message has expired",
					});
				}
			}

			// Store session
			const session = {
				publicKey: input.publicKey,
				address: input.publicKey,
			};

			// Set cookie (Note: In Next.js App Router, you'll need to handle this in the route handler)
			// For now, we return the session and the client can store it
			return {
				success: true,
				session,
			};
		} catch (error) {
			if (error instanceof TRPCError) {
				throw error;
			}
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message:
					error instanceof Error ? error.message : "Authentication failed",
			});
		}
	}),

	signOut: protectedProcedure.mutation(async () => {
		// Clear session cookie would be handled in the route handler
		return {
			success: true,
		};
	}),

	getSession: publicProcedure.query(async ({ ctx }) => {
		return ctx.session;
	}),

	getMe: protectedProcedure.query(async ({ ctx }) => {
		return ctx.session;
	}),
});
