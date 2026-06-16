import crypto from "node:crypto";

/**
 * Authenticated symmetric encryption for OAuth access tokens at rest.
 *
 * Format (base64): [ 12-byte IV | 16-byte auth tag | ciphertext ]
 *
 * The key comes from TOKEN_ENCRYPTION_KEY (32 bytes, base64-encoded). Tokens
 * are decrypted only inside server-side services and are NEVER returned to the
 * client.
 */

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;

function getKey(): Buffer {
  const raw = process.env.TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("TOKEN_ENCRYPTION_KEY is not set");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key (use: openssl rand -base64 32)",
    );
  }
  return key;
}

export function encryptToken(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptToken(payload: string): string {
  const key = getKey();
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const enc = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

/**
 * Heuristic guard so we can tolerate a one-time migration from plaintext
 * tokens to encrypted ones. Encrypted payloads are base64 and at least
 * IV + TAG + 1 byte long; raw GitHub tokens are not valid for our scheme.
 */
export function isProbablyEncrypted(value: string): boolean {
  try {
    const buf = Buffer.from(value, "base64");
    return buf.length > IV_LEN + TAG_LEN && buf.toString("base64") === value;
  } catch {
    return false;
  }
}
