import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createContext } from "@zwap/api/context";
import { appRouter } from "@zwap/api/routers/index";

function handler(req: Request) {
	return fetchRequestHandler({
		endpoint: "/api/trpc",
		req,
		router: appRouter,
		createContext: () => createContext(req),
		onError({ error, path }) {
			console.error(`tRPC Error on '${path ?? "<no-path>"}':`, error);
		},
		responseMeta({ type, errors }) {
			// Handle setting cookies for auth responses
			// This is a basic implementation - you may want to enhance it
			if (type === "mutation" && errors.length === 0) {
				// Check if this is an auth mutation and handle cookies if needed
				// For now, we rely on localStorage on the client side
			}
			return {};
		},
	});
}
export { handler as GET, handler as POST };
