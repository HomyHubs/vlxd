import { describe, it, expect } from "vitest";
import {
  SERVICE_PLANS,
  SERVICE_PLAN_LIMITS,
  ROLE_GROUPS,
  ErrorCode,
  PaginationQuerySchema,
  MoneySchema,
  HealthResponseSchema,
} from "../index.js";

describe("@vlxd/shared", () => {
  it("defines service plans and correct limits", () => {
    expect(SERVICE_PLANS.FREE).toBe("FREE");
    expect(SERVICE_PLAN_LIMITS.FREE.maxProducts).toBe(80);
    expect(SERVICE_PLAN_LIMITS.STANDARD.maxProducts).toBe(800);
    expect(SERVICE_PLAN_LIMITS.PREMIUM.maxProducts).toBeNull();
  });

  it("defines core role groups", () => {
    expect(ROLE_GROUPS.SUPER_ADMIN).toBe("SUPER_ADMIN");
    expect(ROLE_GROUPS.USER).toBe("USER");
  });

  it("defines standard error codes", () => {
    expect(ErrorCode.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
    expect(ErrorCode.UNAUTHORIZED).toBe("UNAUTHORIZED");
    expect(ErrorCode.PLAN_LIMIT_REACHED).toBe("PLAN_LIMIT_REACHED");
  });

  it("validates pagination schema correctly", () => {
    const parsed = PaginationQuerySchema.parse({ page: "2", limit: "50" });
    expect(parsed).toEqual({
      page: 2,
      limit: 50,
      sortOrder: "desc",
    });
  });

  it("validates money schema strictly (integers)", () => {
    expect(MoneySchema.parse(50000)).toBe(50000);
    expect(() => MoneySchema.parse(-100)).toThrow();
  });

  it("validates health response schema", () => {
    const health = {
      status: "ok" as const,
      version: "0.1.0",
      timestamp: new Date().toISOString(),
    };
    expect(HealthResponseSchema.parse(health)).toEqual(health);
  });
});
