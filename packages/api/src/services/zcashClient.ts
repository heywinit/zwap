import crypto from "crypto";

export type GenerateMode = "real" | "demo";

const ZCASH_RPC_URL = process.env.ZCASH_RPC_URL;
const ZCASH_RPC_USER = process.env.ZCASH_RPC_USER;
const ZCASH_RPC_PASS = process.env.ZCASH_RPC_PASS;
export const AUTO_GEN_ZADDR = process.env.AUTO_GEN_ZADDR === "true";

export async function zcashRpc<T>(method: string, params: any[] = []): Promise<T> {
  if (!ZCASH_RPC_URL) throw new Error("ZCASH_RPC_URL not configured");
  const authHeader = (ZCASH_RPC_USER && ZCASH_RPC_PASS)
    ? "Basic " + Buffer.from(`${ZCASH_RPC_USER}:${ZCASH_RPC_PASS}`).toString("base64")
    : undefined;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const res = await fetch(ZCASH_RPC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: controller.signal,
  });
  clearTimeout(timeout);
  if (!res.ok) throw new Error(`zcashd RPC HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(`zcashd RPC error: ${JSON.stringify(json.error)}`);
  return json.result as T;
}

export async function getNewShieldedAddress(): Promise<string> {
  // prefer unified address if available, fallback to z_getnewaddress
  try {
    return await zcashRpc<string>("z_getnewaddress", []);
  } catch (e) {
    // If unified address RPC differs in your setup, adjust here
    throw e;
  }
}

export function generateDeterministicDemoAddress(seed?: string): string {
  const ts = Date.now();
  const digest = crypto
    .createHash("sha256")
    .update(`${seed ?? "seed"}|${ts}`)
    .digest("hex")
    .slice(0, 32);
  return `demo-zaddr-${digest}`;
}

// simple in-memory mapping store
type Mapping = { address: string; generated_at: number; mode: GenerateMode; expires_at: number };
const mappingStore = new Map<string, Mapping>();

export function storeMapping(m: Mapping) {
  mappingStore.set(m.address, m);
}

export function getMapping(address: string): Mapping | undefined {
  return mappingStore.get(address);
}