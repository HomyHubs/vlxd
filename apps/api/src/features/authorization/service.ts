import { AppError, ErrorCode } from "@vlxd/shared";
import type { AuthorizationRepository } from "./repository.js";

export interface AuthorizationPrincipal {
  userId: string;
  tenantId: string;
}

export type AuthorizationReason = "ROLE_GROUP" | "CUSTOM_ALLOW" | "CUSTOM_DENY" | "NO_GRANT";

export interface AuthorizationResult {
  allowed: boolean;
  reason: AuthorizationReason;
}

export class AuthorizationService {
  constructor(private readonly repository: AuthorizationRepository) {}

  async authorize(
    principal: AuthorizationPrincipal,
    permissionCode: string,
  ): Promise<AuthorizationResult> {
    const code = permissionCode.trim();
    if (!code) {
      return { allowed: false, reason: "NO_GRANT" };
    }

    const [rolePermissions, overrides] = await Promise.all([
      this.repository.findRolePermissionCodes(principal.userId, principal.tenantId),
      this.repository.findTenantPermissionOverrides(principal.userId, principal.tenantId),
    ]);

    const matchingOverrides = overrides.filter((override) => override.code === code);
    if (matchingOverrides.some((override) => override.effect === "DENY")) {
      return { allowed: false, reason: "CUSTOM_DENY" };
    }
    if (matchingOverrides.some((override) => override.effect === "ALLOW")) {
      return { allowed: true, reason: "CUSTOM_ALLOW" };
    }
    if (rolePermissions.includes(code)) {
      return { allowed: true, reason: "ROLE_GROUP" };
    }

    return { allowed: false, reason: "NO_GRANT" };
  }

  async require(principal: AuthorizationPrincipal, permissionCode: string): Promise<void> {
    const result = await this.authorize(principal, permissionCode);
    if (!result.allowed) {
      throw new AppError("Insufficient permissions", ErrorCode.FORBIDDEN, 403, {
        permission: permissionCode,
      });
    }
  }
}
