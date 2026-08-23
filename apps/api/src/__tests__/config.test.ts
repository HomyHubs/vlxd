import { describe, expect, it } from "vitest";
import { ConfigValidationError, loadConfig } from "../platform/config.js";

describe("loadConfig", () => {
  it("loads default configuration when no env is provided", () => {
    const config = loadConfig({});
    expect(config.NODE_ENV).toBe("development");
    expect(config.PORT).toBe(3001);
    expect(config.HOST).toBe("0.0.0.0");
    expect(config.LOG_LEVEL).toBe("info");
    expect(config.DATABASE_POOL_MIN).toBe(0);
    expect(config.DATABASE_POOL_MAX).toBe(10);
    expect(config.DATABASE_SSL).toBe(false);
  });

  it("loads staging and custom database environment correctly", () => {
    const config = loadConfig({
      NODE_ENV: "staging",
      PORT: "8080",
      HOST: "127.0.0.1",
      LOG_LEVEL: "debug",
      DATABASE_URL: "postgresql://postgres:pass@localhost:5432/vlxd_staging",
      DATABASE_POOL_MIN: "4",
      DATABASE_POOL_MAX: "20",
      DATABASE_SSL: "true",
      DATABASE_CONNECTION_TIMEOUT_MS: "5000",
      DATABASE_IDLE_TIMEOUT_MS: "15000",
    });

    expect(config.NODE_ENV).toBe("staging");
    expect(config.PORT).toBe(8080);
    expect(config.HOST).toBe("127.0.0.1");
    expect(config.LOG_LEVEL).toBe("debug");
    expect(config.DATABASE_URL).toBe("postgresql://postgres:pass@localhost:5432/vlxd_staging");
    expect(config.DATABASE_POOL_MIN).toBe(4);
    expect(config.DATABASE_POOL_MAX).toBe(20);
    expect(config.DATABASE_SSL).toBe(true);
    expect(config.DATABASE_CONNECTION_TIMEOUT_MS).toBe(5000);
    expect(config.DATABASE_IDLE_TIMEOUT_MS).toBe(15000);
  });

  it("parses numeric boolean flags for SSL correctly", () => {
    expect(loadConfig({ DATABASE_SSL: "1" }).DATABASE_SSL).toBe(true);
    expect(loadConfig({ DATABASE_SSL: "0" }).DATABASE_SSL).toBe(false);
  });

  it("loads production and test environments correctly", () => {
    expect(loadConfig({ NODE_ENV: "production" }).NODE_ENV).toBe("production");
    expect(loadConfig({ NODE_ENV: "test" }).NODE_ENV).toBe("test");
  });

  it("throws ConfigValidationError on invalid environment with structured issues", () => {
    try {
      loadConfig({
        NODE_ENV: "invalid_env",
        PORT: "-1",
        DATABASE_POOL_MAX: "not_a_number",
      });
      expect.fail("Expected loadConfig to throw ConfigValidationError");
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigValidationError);
      const valErr = err as ConfigValidationError;
      expect(valErr.issues.length).toBeGreaterThanOrEqual(3);
      expect(valErr.message).toContain("NODE_ENV");
      expect(valErr.message).toContain("PORT");
      expect(valErr.message).toContain("DATABASE_POOL_MAX");
    }
  });
});
