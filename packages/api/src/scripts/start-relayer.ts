import { Relayer } from "../services/relayer";
import { getExchangeRates } from "../services/conversion";
import dotenv from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from project root (3 levels up from src/scripts)
dotenv.config({ path: resolve(__dirname, "../../../../.env") });

async function main() {
  // Validate required environment variables
  const requiredEnvVars = [
    "SOLANA_RPC_URL",
    "ZWAP_PROGRAM_ID",
    "ZCASH_RPC_URL",
    "ZCASH_RPC_USER",
    "ZCASH_RPC_PASSWORD",
    "RELAYER_Z_ADDRESS",
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`❌ Missing required environment variable: ${envVar}`);
      process.exit(1);
    }
  }

  // Get exchange rates
  const rates = getExchangeRates();

  // Create relayer instance
  const relayer = new Relayer({
    solanaRpcUrl: process.env.SOLANA_RPC_URL!,
    programId: process.env.ZWAP_PROGRAM_ID!,
    zcashRpcUrl: process.env.ZCASH_RPC_URL!,
    zcashRpcUser: process.env.ZCASH_RPC_USER!,
    zcashRpcPassword: process.env.ZCASH_RPC_PASSWORD!,
    relayerZAddress: process.env.RELAYER_Z_ADDRESS!,
    solToZecRate: rates.solToZec,
    usdcToZecRate: rates.usdcToZec,
  });

  // Start relayer
  await relayer.start();

  // Keep process alive
  await new Promise(() => {});
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
