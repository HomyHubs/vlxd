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
    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      await fastify.authenticate(request, reply);
      const user = request.user;
      const tenant = request.tenant;
      if (!user || !tenant) {
        throw new AppError("Authentication credentials missing", ErrorCode.UNAUTHORIZED, 401);
      }

      await authorizationService.require({ userId: user.id, tenantId: tenant.id }, code);
    };
  });
};

export const authorizationPlugin = fp(authorizationPluginCallback, {
  name: "authorization-plugin",
  dependencies: ["auth-plugin"],
});
