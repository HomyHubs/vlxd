import { AppError, ErrorCode } from "@vlxd/shared";
import type { TenantUserRecord, TenantUserRepository } from "./repository.js";

export interface InviteTenantUserInput {
  email: string;
  titleIds: string[];
}

export class TenantUserService {
  constructor(private readonly repository: TenantUserRepository) {}

  async invite(tenantId: string, input: InviteTenantUserInput): Promise<TenantUserRecord> {
    const user = await this.repository.findUserByEmail(input.email);
    if (!user) throw new AppError("User account not found", ErrorCode.NOT_FOUND, 404);
    if (input.titleIds.length === 0)
      throw new AppError("At least one title is required", ErrorCode.VALIDATION_ERROR, 400);
    if (await this.repository.findTenantMembershipByUserId(tenantId, user.id)) {
      throw new AppError("User is already a member of this tenant", ErrorCode.CONFLICT, 409);
    }
    const titleIds = await this.repository.findTitleIds(tenantId, input.titleIds);
    if (titleIds.length !== new Set(input.titleIds).size) {
      throw new AppError("One or more titles were not found", ErrorCode.NOT_FOUND, 404);
    }
    return this.repository.createTenantUser({ tenantId, userId: user.id, titleIds });
  }

  async updateStatus(tenantId: string, tenantUserId: string, status: TenantUserRecord["status"]) {
    const result = await this.repository.updateStatus(tenantId, tenantUserId, status);
    if (!result) throw new AppError("Tenant user not found", ErrorCode.NOT_FOUND, 404);
    return result;
  }

  async replaceTitles(tenantId: string, tenantUserId: string, titleIds: string[]) {
    if (titleIds.length === 0)
      throw new AppError("At least one title is required", ErrorCode.VALIDATION_ERROR, 400);
    const validTitleIds = await this.repository.findTitleIds(tenantId, titleIds);
    if (validTitleIds.length !== new Set(titleIds).size)
      throw new AppError("One or more titles were not found", ErrorCode.NOT_FOUND, 404);
    const result = await this.repository.replaceTitles(tenantId, tenantUserId, validTitleIds);
    if (!result) throw new AppError("Tenant user not found", ErrorCode.NOT_FOUND, 404);
    return result;
  }
}
