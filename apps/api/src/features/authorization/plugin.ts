import { AppError, ErrorCode } from "@vlxd/shared";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import type { AuthorizationService } from "./service.js";

export interface AuthorizationPluginOptions {
  authorizationService: AuthorizationService;
}

declare module "fastify" {
  interface FastifyInstance {
    requirePermission: (
      permissionCode: string,
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

const authorizationPluginCallback: FastifyPluginAsync<AuthorizationPluginOptions> = async (
  fastify,
  { authorizationService },
) => {
  fastify.decorate("requirePermission", (permissionCode: string) => {
    const code = permissionCode.trim();
    return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
      if (!request.user || !request.tenant) {
        throw new AppError("Authentication credentials missing", ErrorCode.UNAUTHORIZED, 401);
      }

      await authorizationService.require(
        { userId: request.user.id, tenantId: request.tenant.id },
        code,
      );
    };
  });
};

export const authorizationPlugin = fp(authorizationPluginCallback, {
  name: "authorization-plugin",
});
