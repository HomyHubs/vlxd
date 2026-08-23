import { AppError, ErrorCode, type ErrorEnvelope } from "@vlxd/shared";
import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
} from "fastify-type-provider-zod";
import { ZodError } from "zod";

export function formatErrorEnvelope(
  code: (typeof ErrorCode)[keyof typeof ErrorCode],
  message: string,
  requestId?: string,
  details?: Record<string, unknown>,
): ErrorEnvelope {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
      ...(requestId ? { requestId } : {}),
    },
  };
}

export interface ErrorHandlerRegistrar {
  setNotFoundHandler(handler: (request: FastifyRequest, reply: FastifyReply) => void): void;
  setErrorHandler(
    handler: (error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) => void,
  ): void;
}

export function registerErrorHandlers(app: ErrorHandlerRegistrar): void {
  // 404 Not Found Handler
  app.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    const envelope = formatErrorEnvelope(
      ErrorCode.NOT_FOUND,
      `Route ${request.method} ${request.url} not found`,
      request.id,
    );
    reply.status(404).send(envelope);
  });

  // Global Error Handler
  app.setErrorHandler(
    (error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) => {
      // Case 1: Fastify Zod Type Provider Validation Errors
      if (hasZodFastifySchemaValidationErrors(error)) {
        const details: Record<string, unknown> = {};
        const ctx = error.validationContext || "body";

        for (const validation of error.validation) {
          const issue = (
            validation.params as {
              issue?: { path?: (string | number)[]; message?: string };
            }
          )?.issue;

          const message = issue?.message || validation.message || "Invalid input";

          if (issue && Array.isArray(issue.path) && issue.path.length > 0) {
            const rawPath = issue.path.join(".");
            details[rawPath] = message;
            details[`${ctx}.${rawPath}`] = message;
          } else if (validation.instancePath) {
            const rawPath = validation.instancePath.replace(/^\//, "").replace(/\//g, ".");
            if (rawPath) {
              details[rawPath] = message;
              details[`${ctx}.${rawPath}`] = message;
            } else {
              details[ctx] = message;
            }
          } else {
            details[ctx] = message;
          }
        }

        const envelope = formatErrorEnvelope(
          ErrorCode.VALIDATION_ERROR,
          "Validation failed",
          request.id,
          details,
        );
        reply.status(400).send(envelope);
        return;
      }

      // Case 2: Direct ZodError
      if (error instanceof ZodError) {
        const details: Record<string, unknown> = {};
        for (const issue of error.issues) {
          const rawPath = issue.path.join(".") || "body";
          details[rawPath] = issue.message;
          details[`body.${rawPath}`] = issue.message;
        }

        const envelope = formatErrorEnvelope(
          ErrorCode.VALIDATION_ERROR,
          "Validation failed",
          request.id,
          details,
        );
        reply.status(400).send(envelope);
        return;
      }

      // Case 3: Standard Fastify Schema Validation Error
      if ("validation" in error && Array.isArray(error.validation)) {
        const details: Record<string, unknown> = {};
        const ctx =
          "validationContext" in error && typeof error.validationContext === "string"
            ? error.validationContext
            : "body";

        for (const val of error.validation) {
          const field =
            typeof val === "object" && val !== null && "instancePath" in val
              ? String((val as { instancePath: string }).instancePath).replace(/^\//, "")
              : "";
          const msg =
            typeof val === "object" && val !== null && "message" in val
              ? String((val as { message: string }).message)
              : "Invalid parameter";

          if (field) {
            details[field] = msg;
            details[`${ctx}.${field}`] = msg;
          } else {
            details[ctx] = msg;
          }
        }

        const envelope = formatErrorEnvelope(
          ErrorCode.VALIDATION_ERROR,
          error.message || "Validation failed",
          request.id,
          details,
        );
        reply.status(400).send(envelope);
        return;
      }

      // Case 4: Response Serialization Error from type provider
      if (isResponseSerializationError(error)) {
        request.log.error(
          {
            err: error,
            requestId: request.id,
          },
          "Response serialization error against OpenAPI contract",
        );
        const envelope = formatErrorEnvelope(
          ErrorCode.INTERNAL_SERVER_ERROR,
          "Internal server error",
          request.id,
        );
        reply.status(500).send(envelope);
        return;
      }

      // Case 5: Domain AppError
      if (error instanceof AppError) {
        const envelope = formatErrorEnvelope(
          error.code,
          error.message,
          request.id,
          error.details as Record<string, unknown> | undefined,
        );
        reply.status(error.statusCode).send(envelope);
        return;
      }

      // Case 6: Fastify HTTP Errors with explicit statusCode < 500
      if ("statusCode" in error && typeof error.statusCode === "number" && error.statusCode < 500) {
        let code: (typeof ErrorCode)[keyof typeof ErrorCode] = ErrorCode.BAD_REQUEST;
        if (error.statusCode === 401) code = ErrorCode.UNAUTHORIZED;
        if (error.statusCode === 403) code = ErrorCode.FORBIDDEN;
        if (error.statusCode === 404) code = ErrorCode.NOT_FOUND;
        if (error.statusCode === 409) code = ErrorCode.CONFLICT;

        const envelope = formatErrorEnvelope(code, error.message, request.id);
        reply.status(error.statusCode).send(envelope);
        return;
      }

      // Case 7: Unhandled Server Errors (500)
      // Log complete error internally with stack trace and request correlation ID
      request.log.error(
        {
          err: error,
          requestId: request.id,
          url: request.url,
          method: request.method,
        },
        "Unhandled server error encountered",
      );

      // Return safe sanitized envelope to client (NO SQL queries, NO stack trace, NO secrets leaked)
      const envelope = formatErrorEnvelope(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "An unexpected internal server error occurred",
        request.id,
      );
      reply.status(500).send(envelope);
    },
  );
}
