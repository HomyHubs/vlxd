import { AppError, ErrorCode } from "@vlxd/shared";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import type { AuthService } from "./service.js";

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  status: string;
}

export interface AuthenticatedTenant {
  id: string;
  code: string;
  name: string;
  status: string;
}

export interface AuthenticatedSession {
  id: string;
  expiresAt: Date | string;
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    user?: AuthenticatedUser;
    tenant?: AuthenticatedTenant;
    session?: AuthenticatedSession;
    rawSessionToken?: string;
  }
}

export interface AuthPluginOptions {
  authService: AuthService;
}

function extractToken(request: FastifyRequest): string | undefined {
  // 1. Check HttpOnly cookie
  const cookieToken = request.cookies?.vlxd_session;
  if (cookieToken && typeof cookieToken === "string" && cookieToken.trim().length > 0) {
    return cookieToken.trim();
  }

  // 2. Check Authorization Bearer header
  const authHeader = request.headers.authorization;
  if (authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    const bearerToken = authHeader.slice(7).trim();
    if (bearerToken.length > 0) {
      return bearerToken;
    }
  }

  return undefined;
}

const authPluginCallback: FastifyPluginAsync<AuthPluginOptions> = async (
  fastify,
  { authService },
) => {
  fastify.decorateRequest("user", undefined);
  fastify.decorateRequest("tenant", undefined);
  fastify.decorateRequest("session", undefined);
  fastify.decorateRequest("rawSessionToken", undefined);

  fastify.decorate(
    "authenticate",
    async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
      const token = extractToken(request);
      if (!token) {
        throw new AppError("Authentication credentials missing", ErrorCode.UNAUTHORIZED, 401);
      }

      const { session, user, tenant } = await authService.validateSession(token);

      request.user = {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        status: user.status,
      };

      request.tenant = {
        id: tenant.id,
        code: tenant.code,
        name: tenant.name,
        status: tenant.status,
      };

      request.session = {
        id: session.id,
        expiresAt: session.expires_at,
      };

      request.rawSessionToken = token;
    },
  );
};

export const authPlugin = fp(authPluginCallback, {
  name: "auth-plugin",
});
