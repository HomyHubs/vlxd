import crypto from "node:crypto";

export function generateRequestId(): string {
  return `req-${crypto.randomUUID()}`;
}

export function parseRequestId(incomingId?: string | string[]): string {
  if (typeof incomingId === "string" && incomingId.trim().length > 0) {
    return incomingId.trim();
  }
  return generateRequestId();
}
