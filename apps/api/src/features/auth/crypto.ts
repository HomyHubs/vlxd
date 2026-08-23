import crypto from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(crypto.scrypt);

const SALT_BYTE_LENGTH = 16;
const KEY_BYTE_LENGTH = 64;

/**
 * Hashes a plain-text password using scrypt with a cryptographically secure random salt.
 * Returns formatted string: `s0$<saltHex>$<derivedKeyHex>`
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(SALT_BYTE_LENGTH);
  const derivedKey = (await scryptAsync(password, salt, KEY_BYTE_LENGTH)) as Buffer;
  return `s0$${salt.toString("hex")}$${derivedKey.toString("hex")}`;
}

/**
 * Verifies a plain-text password against a stored scrypt hash using timing-safe comparison.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split("$");
  if (parts.length !== 3 || parts[0] !== "s0") {
    return false;
  }

  const saltHex = parts[1];
  const derivedKeyHex = parts[2];

  if (!saltHex || !derivedKeyHex) {
    return false;
  }

  const salt = Buffer.from(saltHex, "hex");
  const storedKey = Buffer.from(derivedKeyHex, "hex");

  if (storedKey.length !== KEY_BYTE_LENGTH) {
    return false;
  }

  const candidateKey = (await scryptAsync(password, salt, KEY_BYTE_LENGTH)) as Buffer;
  return crypto.timingSafeEqual(candidateKey, storedKey);
}

/**
 * Generates an opaque random 32-byte session token formatted as a 64-character hex string.
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hashes an opaque session token using SHA-256 before storing it in the database.
 */
export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
