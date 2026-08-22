import { describe, expect, it } from "vitest";
import { loadConfig } from "../platform/config.js";

describe("loadConfig", () => {
  it("loads default configuration when no env is provided", () => {
    const config = loadConfig({});
    expect(config.NODE_ENV).toBe("development");
    expect(config.PORT).toBe(3001);
    expect(config.HOST).toBe("0.0.0.0");
    expect(config.LOG_LEVEL).toBe("info");
  });

  it("loads staging environment correctly", () => {
    const config = loadConfig({
      NODE_ENV: "staging",
      PORT: "8080",
      HOST: "127.0.0.1",
      LOG_LEVEL: "debug",
    });
    expect(config.NODE_ENV).toBe("staging");
    expect(config.PORT).toBe(8080);
    expect(config.HOST).toBe("127.0.0.1");
    expect(config.LOG_LEVEL).toBe("debug");
  });

  it("loads production and test environments correctly", () => {
    expect(loadConfig({ NODE_ENV: "production" }).NODE_ENV).toBe("production");
    expect(loadConfig({ NODE_ENV: "test" }).NODE_ENV).toBe("test");
  });

  it("throws on invalid environment", () => {
    expect(() => loadConfig({ NODE_ENV: "invalid_env" })).toThrow(
      /Invalid environment configuration/,
    );
  });
});
