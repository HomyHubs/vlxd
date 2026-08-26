import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { TenantUserService } from "./service.js";

const inviteSchema = z.object({
  email: z.string().email(),
  titleIds: z.array(z.string().uuid()).min(1),
});
const statusSchema = z.object({ status: z.enum(["ACTIVE", "SUSPENDED", "REVOKED"]) });
const titlesSchema = z.object({ titleIds: z.array(z.string().uuid()).min(1) });
const idParams = z.object({ tenantUserId: z.string().uuid() });

export interface TenantUserRoutesOptions {
  tenantUserService: TenantUserService;
}

export const tenantUserRoutes: FastifyPluginAsync<TenantUserRoutesOptions> = async (
  fastify,
  { tenantUserService },
) => {
  const typedFastify = fastify.withTypeProvider<ZodTypeProvider>();

  typedFastify.post(
    "/api/v1/tenant-users",
    {
      preHandler: [fastify.requirePermission("user.account.create")],
      schema: { body: inviteSchema },
    },
    async (request, reply) => {
      const result = await tenantUserService.invite(request.tenant!.id, request.body);
      return reply.status(201).send(result);
    },
  );

  typedFastify.patch(
    "/api/v1/tenant-users/:tenantUserId/status",
    {
      preHandler: [fastify.requirePermission("user.account.update")],
      schema: { params: idParams, body: statusSchema },
    },
    async (request, reply) => {
      const result = await tenantUserService.updateStatus(
        request.tenant!.id,
        request.params.tenantUserId,
        request.body.status,
      );
      return reply.status(200).send(result);
    },
  );

  typedFastify.put(
    "/api/v1/tenant-users/:tenantUserId/titles",
    {
      preHandler: [fastify.requirePermission("user.role.assign")],
      schema: { params: idParams, body: titlesSchema },
    },
    async (request, reply) => {
      const result = await tenantUserService.replaceTitles(
        request.tenant!.id,
        request.params.tenantUserId,
        request.body.titleIds,
      );
      return reply.status(200).send(result);
    },
  );
};
