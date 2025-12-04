import { DEMO_MODE } from "../config";

const USE_LIVE_RATES = process.env.USE_LIVE_RATES === "true";
const DEMO_PRIVACY_PREMIUM = Number(process.env.DEMO_PRIVACY_PREMIUM ?? 0.0005);
const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const SOLANA_CLUSTER = process.env.SOLANA_CLUSTER ?? "mainnet"; // mainnet|devnet

async function getHeliusPriorityFee(asset: "SOL" | "USDC", amount: number, speed: "slow" | "normal" | "fast"): Promise<number> {
  if (!USE_LIVE_RATES || !HELIUS_API_KEY) return 0.000005 * (speed === "slow" ? 0.5 : speed === "fast" ? 2 : 1);

  // Helius Priority Fee API: we approximate by requesting recent priority fee percentiles and scale
  // Docs: https://docs.helius.dev/ (endpoint subject to change). We handle gracefully with fallbacks.
  const url = `https://api.helius.xyz/v0/priority-fee-estimate?api-key=${HELIUS_API_KEY}`;
  try {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) throw new Error(`helius HTTP ${res.status}`);
    const json = await res.json() as any;
    // Example shape: { lamports: { p50: number, p95: number } }
    const lamports = speed === "slow" ? (json?.lamports?.p50 ?? 3000) : speed === "fast" ? (json?.lamports?.p95 ?? 15000) : ((json?.lamports?.p75 ?? json?.lamports?.p50) ?? 8000);
    const sol = lamports / 1_000_000_000; // 1 SOL = 1e9 lamports
    return sol;
  } catch (e) {
    // fallback demo values scaled by speed
    const base = 0.000005;
    return base * (speed === "slow" ? 0.5 : speed === "fast" ? 2 : 1);
  }
}

export async function getQuote(asset: "SOL" | "USDC", amount: number, speed: "slow" | "normal" | "fast" = "normal") {
  const solana_base_fee_estimate = 0.000005; // ~5000 lamports demo base
  const solana_priority_fee_estimate = await getHeliusPriorityFee(asset, amount, speed);
  const zcash_shield_fee_estimate = 0.0002; // demo orchard estimate in ZEC terms (display)
  // Relayer premium: scale with speed to prefer faster inclusion
  const speedMult = speed === "slow" ? 0.5 : speed === "fast" ? 2 : 1;
  const privacy_premium = DEMO_PRIVACY_PREMIUM * speedMult;

  const total_estimated_cost_display = {
    solana: solana_base_fee_estimate + solana_priority_fee_estimate + privacy_premium,
    zcash: zcash_shield_fee_estimate,
  };

  return {
    asset,
    amount,
    solana_base_fee_estimate,
    solana_priority_fee_estimate,
    zcash_shield_fee_estimate,
    privacy_premium,
    total_estimated_cost_display,
    demo_mode: DEMO_MODE,
    speed,
  };
}