export interface Session {
	publicKey: string;
	address: string;
}

export async function createContext(req: Request) {
	// Get session from cookie
	let session: Session | null = null;

	// Parse cookies from Cookie header
	const cookieHeader = req.headers.get("cookie");
	if (cookieHeader) {
		const cookies = Object.fromEntries(
			cookieHeader.split("; ").map((cookie) => {
				const [name, ...rest] = cookie.split("=");
				return [name, rest.join("=")];
			}),
		);
		const sessionCookie = cookies.solana_session;

		if (sessionCookie) {
			try {
				session = JSON.parse(decodeURIComponent(sessionCookie)) as Session;
			} catch {
				// Invalid session cookie, ignore
				session = null;
			}
		}
	}

	// Also check for session in Authorization header as fallback
	// Format: "Bearer <session_json>"
	if (!session) {
		const authHeader = req.headers.get("authorization");
		if (authHeader?.startsWith("Bearer ")) {
			try {
				const sessionData = authHeader.slice(7);
				session = JSON.parse(sessionData) as Session;
			} catch {
				// Invalid session in header, ignore
			}
		}
	}

	return {
		session,
		req,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
