import { describe, expect, it } from "vitest";
import { generateSessionToken, hashPassword, hashSessionToken, verifyPassword } from "../crypto.js";

describe("Auth Crypto Utilities", () => {
  describe("Password Hashing & Verification (scrypt)", () => {
    it("hashes a password into formatted s0$salt$key string", async () => {
      const password = "SuperSecretPassword@123";
      const hash = await hashPassword(password);

      expect(hash).toMatch(/^s0\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
    });

    it("verifies matching password correctly", async () => {
      const password = "MySecurePassword#2026";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it("rejects incorrect password", async () => {
      const password = "CorrectPassword123";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword("WrongPassword123", hash);
      expect(isValid).toBe(false);
    });

    it("handles malformed hash string gracefully", async () => {
      expect(await verifyPassword("password", "invalid-hash")).toBe(false);
      expect(await verifyPassword("password", "s1$salt$key")).toBe(false);
      expect(await verifyPassword("password", "s0$$key")).toBe(false);
      expect(await verifyPassword("password", "")).toBe(false);
    });
  });

  describe("Session Token Generation & Hashing", () => {
    it("generates a 64-character hex session token", () => {
      const token = generateSessionToken();
      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[0-9a-f]{64}$/);
    });

    it("generates unique tokens on each invocation", () => {
      const token1 = generateSessionToken();
      const token2 = generateSessionToken();
      expect(token1).not.toBe(token2);
    });

    it("hashes token deterministically using SHA-256", () => {
      const token = "3a7b5e9f1c8d2a4e6b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4a";
      const hash1 = hashSessionToken(token);
      const hash2 = hashSessionToken(token);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
      expect(hash1).toMatch(/^[0-9a-f]{64}$/);
    });
  });
});
