import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

/**
 * AES-256-GCM helpers for vendor API keys at rest.
 *
 * Key material comes from TELEMETRY_ENCRYPTION_KEY (preferred) or falls
 * back to JWT_SECRET so local dev works without extra configuration.
 * Ciphertext format: base64(iv):base64(authTag):base64(payload).
 */

function encryptionKey(): Buffer {
  const secret =
    process.env.TELEMETRY_ENCRYPTION_KEY ??
    process.env.JWT_SECRET ??
    "dev-only-telemetry-secret";
  return createHash("sha256").update(secret).digest();
}

export function encryptCredential(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptCredential(ciphertext: string): string {
  const [ivB64, tagB64, payloadB64] = ciphertext.split(":");
  if (!ivB64 || !tagB64 || !payloadB64) {
    throw new Error("Malformed encrypted credential");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivB64, "base64")
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(payloadB64, "base64")),
    decipher.final()
  ]).toString("utf8");
}
