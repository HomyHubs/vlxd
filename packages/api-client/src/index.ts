import type { components, operations, paths } from "./generated/schema.js";

// Re-export generated schema types for consumers
export type { components, operations, paths };
export type HealthResponse = components["schemas"]["HealthResponse"];
export type ErrorCode = components["schemas"]["ErrorCode"];
export type ErrorObject = components["schemas"]["ErrorObject"];
export type ErrorDetails = components["schemas"]["ErrorDetails"];
export type ErrorEnvelope = components["schemas"]["ErrorEnvelope"];
export type PaginationQuery = components["schemas"]["PaginationQuery"];
export type PaginationMeta = components["schemas"]["PaginationMeta"];
export type Money = components["schemas"]["Money"];
export type DateTime = components["schemas"]["DateTime"];
export type RequestId = components["schemas"]["RequestId"];
export type OptimisticVersion = components["schemas"]["OptimisticVersion"];

export interface ApiClientOptions {
  baseUrl: string;
  fetchFn?: typeof fetch;
  defaultHeaders?: Record<string, string>;
}

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly envelope?: ErrorEnvelope;
  public readonly code?: ErrorCode;
  public readonly requestId?: string;

  constructor(status: number, message: string, envelope?: ErrorEnvelope) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.envelope = envelope;
    this.code = envelope?.error?.code;
    this.requestId = envelope?.error?.requestId;
    Object.setPrototypeOf(this, ApiClientError.prototype);
  }
}

export interface ApiClient {
  readonly baseUrl: string;
  getHealth(): Promise<HealthResponse>;
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  const fetchFn = options.fetchFn ?? fetch;

  async function request<T>(endpoint: string, init?: RequestInit): Promise<T> {
    const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...options.defaultHeaders,
      ...(init?.headers as Record<string, string>),
    };

    const response = await fetchFn(url, {
      ...init,
      headers,
    });

    if (!response.ok) {
      let envelope: ErrorEnvelope | undefined;
      try {
        envelope = (await response.json()) as ErrorEnvelope;
      } catch {
        // Response was not JSON
      }

      const errorMessage =
        envelope?.error?.message || `API request failed with HTTP ${response.status}`;
      throw new ApiClientError(response.status, errorMessage, envelope);
    }

    return (await response.json()) as T;
  }

  return {
    get baseUrl() {
      return baseUrl;
    },
    async getHealth(): Promise<HealthResponse> {
      return request<HealthResponse>("/health", { method: "GET" });
    },
  };
}
