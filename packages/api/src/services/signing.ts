import crypto from "crypto";

// Expect SIGNING_KEY_PEM (Ed25519 private key in PEM) and SIGNING_PUBKEY_PEM for verification if needed
const SIGNING_KEY_PEM = process.env.SIGNING_KEY_PEM || process.env.SIGNING_KEY || "";
const SIGNING_PUBKEY_PEM = process.env.SIGNING_PUBKEY_PEM || "";

export function ensureSigningConfigured() {
  if (!SIGNING_KEY_PEM) {
    throw new Error("SIGNING_KEY_PEM not configured (Ed25519 private key PEM)");
  }
}

export function computeReceiptHash(
  depositId: string,
  solanaTx: string | null,
  zecTxid: string | null,
  timestampMs: number,
) {
  const h = crypto.createHash("sha256");
  h.update(String(depositId));
  h.update(String(solanaTx ?? ""));
  h.update(String(zecTxid ?? ""));
  h.update(String(timestampMs));
  return h.digest("hex");
}

export function hkdfBlindAmount(amount: string, salt = "zwap-blind-salt") {
  const ikm = Buffer.from(amount);
  const prk = crypto.createHmac("sha256", salt).update(ikm).digest();
  const okm = crypto.createHmac("sha256", prk).update("zwap-hkdf-ctx").digest();
  return okm.toString("base64");
}

export function signEd25519(hashHex: string): string {
  const key = SIGNING_KEY_PEM;
  const data = Buffer.from(hashHex, "hex");
  const signature = crypto.sign(null, data, key);
  return signature.toString("base64");
}

export function verifyEd25519(hashHex: string, signatureB64: string): boolean {
  if (!SIGNING_PUBKEY_PEM) return false;
  const data = Buffer.from(hashHex, "hex");
  const sig = Buffer.from(signatureB64, "base64");
  return crypto.verify(null, data, SIGNING_PUBKEY_PEM, sig);
}

export async function encryptBlobAesGcm(
  plaintext: Buffer,
  password?: string,
): Promise<{ blob: Buffer; iv: Buffer; tag?: Buffer }> {
  if (!password) return { blob: plaintext, iv: Buffer.alloc(0) };
  const salt = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(password, salt, 100_000, 32, "sha256");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  const blob = Buffer.concat([Buffer.from("ZWAPGCM"), salt, iv, tag, enc]);
  return { blob, iv, tag };
}