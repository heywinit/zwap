export const DEMO_MODE = process.env.DEMO_MODE === "true";
export const DEMO_ZEC_DELAY_MS = Number(process.env.DEMO_ZEC_DELAY_MS ?? 8000);
export const DEMO_RATE_SOL_TO_ZEC = Number(
  process.env.DEMO_RATE_SOL_TO_ZEC ?? 0.01,
);
export const DEMO_RATE_USDC_TO_ZEC = Number(
  process.env.DEMO_RATE_USDC_TO_ZEC ?? 0.02,
);

export function getDemoRate(asset: "SOL" | "USDC") {
  return asset === "SOL" ? DEMO_RATE_SOL_TO_ZEC : DEMO_RATE_USDC_TO_ZEC;
}