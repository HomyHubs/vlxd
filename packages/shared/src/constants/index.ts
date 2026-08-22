export const SERVICE_PLANS = {
  FREE: "FREE",
  STANDARD: "STANDARD",
  PREMIUM: "PREMIUM",
  ENTERPRISE: "ENTERPRISE",
} as const;

export type ServicePlan = (typeof SERVICE_PLANS)[keyof typeof SERVICE_PLANS];

export const SERVICE_PLAN_LIMITS = {
  [SERVICE_PLANS.FREE]: {
    maxProducts: 80,
    maxWarehouses: 1,
    hasAiAgent: false,
    hasOcr: false,
    hasDedicatedDb: false,
  },
  [SERVICE_PLANS.STANDARD]: {
    maxProducts: 800,
    maxWarehouses: 1,
    hasAiAgent: false,
    hasOcr: false,
    hasDedicatedDb: false,
  },
  [SERVICE_PLANS.PREMIUM]: {
    maxProducts: null, // Unlimited
    maxWarehouses: null, // Unlimited
    hasAiAgent: true,
    hasOcr: true,
    hasDedicatedDb: false,
  },
  [SERVICE_PLANS.ENTERPRISE]: {
    maxProducts: null, // Unlimited
    maxWarehouses: null, // Unlimited
    hasAiAgent: true,
    hasOcr: true,
    hasDedicatedDb: true,
  },
} as const;

export const ROLE_GROUPS = {
  SUPER_ADMIN: "SUPER_ADMIN",
  SYSTEM_ADMIN: "SYSTEM_ADMIN",
  SUPPORT_ADMIN: "SUPPORT_ADMIN",
  USER: "USER",
} as const;

export type RoleGroup = (typeof ROLE_GROUPS)[keyof typeof ROLE_GROUPS];

export const DEFAULT_CURRENCY = "VND";
export const DEFAULT_TIMEZONE = "Asia/Ho_Chi_Minh";
export const DEFAULT_LOCALE = "vi";
export const SUPPORTED_LOCALES = ["vi", "en"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
