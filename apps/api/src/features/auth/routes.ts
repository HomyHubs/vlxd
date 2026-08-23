import { AppError, ErrorCode } from "@vlxd/shared";
import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import type { Config } from "../../platform/config.js";
import {
  AuthMeResponseSchema,
  LoginRequestSchema,
  LoginResponseSchema,
  LogoutResponseSchema,
} from "./schema.js";
import type { AuthService } from "./service.js";

export interface AuthRoutesOptions {
  config: Config;
  authService: AuthService;
}

export const authRoutes: FastifyPluginAsync<AuthRoutesOptions> = async (
  fastify,
  { config, authService },
) => {
  const typedFastify = fastify.withTypeProvider<ZodTypeProvider>();
  const isProduction = config.NODE_ENV === "production";

  // POST /api/v1/auth/login
  typedFastify.post(
    "/api/v1/auth/login",
    {
      schema: {
        body: LoginRequestSchema,
        response: {
          200: LoginResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const ipAddress = request.ip;
      const userAgent = request.headers["user-agent"] ?? null;

      const result = await authService.login(request.body, {
        ipAddress,
        userAgent,
        requestId: request.id,
      });

      // Set secure HttpOnly cookie
      reply.setCookie("vlxd_session", result.token, {
        path: "/",
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      });

      return reply.status(200).send(result);
    },
  );

  // POST /api/v1/auth/logout
  typedFastify.post(
    "/api/v1/auth/logout",
    {
      preHandler: [fastify.authenticate],
      schema: {
        response: {
          200: LogoutResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const ipAddress = request.ip;
      const userAgent = request.headers["user-agent"] ?? null;

      const session = request.session;
      const tenant = request.tenant;
      const user = request.user;

      let result = { success: true, message: "Logout successful" };

      if (session && tenant && user) {
        result = await authService.logout(session.id, tenant.id, user.id, user.email, {
          ipAddress,
          userAgent,
          requestId: request.id,
        });
      }

      // Clear session cookie
      reply.clearCookie("vlxd_session", {
        path: "/",
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
      });

      return reply.status(200).send(result);
    },
  );

  // GET /api/v1/auth/me
  typedFastify.get(
    "/api/v1/auth/me",
    {
      preHandler: [fastify.authenticate],
      schema: {
        response: {
          200: AuthMeResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const session = request.session;
      const tenant = request.tenant;
      const user = request.user;

      if (!session || !tenant || !user) {
        throw new AppError(
          "Authentication credentials missing or invalid",
          ErrorCode.UNAUTHORIZED,
          401,
        );
      }

      const result = await authService.getAuthMe(user.id, tenant.id, session.id);
      return reply.status(200).send(result);
    },
  );
};
