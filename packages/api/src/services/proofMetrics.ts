const USE_LIVE_RATES = process.env.USE_LIVE_RATES === "true";
const HELIUS_API_KEY = process.env.HELIUS_API_KEY;

type ProofEvent = {
  durationMs: number;
  circuitId?: string;
  success: boolean;
  timestamp: number;
};

type HeliusData = {
  p50: number;
  p95: number;
  timestamp: number;
};

const MAX_EVENTS = 100;
const events: ProofEvent[] = [];
let lastHeliusData: HeliusData = {
  p50: 0,
  p95: 0,
  timestamp: 0,
};

// Fetch Helius data periodically
async function fetchHeliusPriorityFees(): Promise<void> {
  if (!USE_LIVE_RATES || !HELIUS_API_KEY) return;

  try {
    const url = `https://api.helius.xyz/v0/priority-fee-estimate?api-key=${HELIUS_API_KEY}`;
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) throw new Error(`helius HTTP ${res.status}`);
    
    const json = (await res.json()) as any;
    lastHeliusData = {
      p50: json?.lamports?.p50 ?? 0,
      p95: json?.lamports?.p95 ?? 0,
      timestamp: Date.now(),
    };
    console.log("📊 Helius fees updated:", lastHeliusData);
  } catch (e) {
    console.error("⚠️  Failed to fetch Helius fees:", e);
  }
}

// Start periodic Helius fetch (every 30 seconds)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    void fetchHeliusPriorityFees();
  }, 30000);
  // Fetch immediately on startup
  void fetchHeliusPriorityFees();
}

export function recordProof(e: { durationMs: number; circuitId?: string; success: boolean }) {
  const evt: ProofEvent = { ...e, timestamp: Date.now() };
  events.push(evt);
  if (events.length > MAX_EVENTS) events.shift();
}

function p95(values: number[]): number | undefined {
  if (!values.length) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.floor(0.95 * (sorted.length - 1));
  return sorted[idx];
}

export function getMetrics() {
  const last = events[events.length - 1];
  const durations = events.map((e) => e.durationMs);
  const successCount = events.filter((e) => e.success).length;
  const total = events.length;
  const failureRate = total ? (1 - successCount / total) : 0;
  const proofP95 = p95(durations);
  const circuitId = last?.circuitId ?? "demo";
  const lastTimestamp = last?.timestamp ?? 0;

  return {
    last_proof_time_ms: last?.durationMs ?? 0,
    circuit_id: circuitId,
    commitment_count: getCommitmentCount(),
    last_proof_timestamp: lastTimestamp,
    proof_success_rate: total ? successCount / total : 1,
    proof_time_p95_ms: proofP95 ?? 0,
    failure_rate: failureRate,
    helius_priority_p50: lastHeliusData.p50,
    helius_priority_p95: lastHeliusData.p95,
    helius_used: USE_LIVE_RATES && !!HELIUS_API_KEY,
    relayer_pool_size: getRelayerPoolSize(),
    recent_events: events
      .slice(-5)
      .reverse()
      .map((e) => ({
        type: e.success ? "proof" : "failed",
        ms: e.durationMs,
        circuit: e.circuitId?.slice(0, 8) ?? "demo",
      })),
  };
}

// Placeholder: relayer pool commitments count hook; replace when relayer exposes it
let commitmentCount = 0;
export function setCommitmentCount(n: number) {
  commitmentCount = n;
}
export function getCommitmentCount() {
  return commitmentCount;
}

// Relayer pool size tracking
let relayerPoolSize = 0;
export function setRelayerPoolSize(n: number) {
  relayerPoolSize = n;
}
export function getRelayerPoolSize() {
  return relayerPoolSize;
}