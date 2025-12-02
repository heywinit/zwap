import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typedRoutes: true,
	reactCompiler: true,
	transpilePackages: ["@zwap/api", "@zwap/db", "@zwap/solana", "@zwap/zcash"],
	turbopack: {
		resolveAlias: {
			"@solana/spl-token": "@solana/spl-token",
			"@coral-xyz/anchor": "@coral-xyz/anchor",
			"drizzle-orm": "drizzle-orm",
			pg: "pg",
			axios: "axios",
		},
	},
};

export default nextConfig;




