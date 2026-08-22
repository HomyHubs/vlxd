import type { HealthResponse } from "@vlxd/shared";

export interface ApiClientOptions {
  baseUrl: string;
  fetchFn?: typeof fetch;
}

export interface ApiClient {
  getHealth(): Promise<HealthResponse>;
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  const fetchFn = options.fetchFn ?? fetch;

  return {
    async getHealth(): Promise<HealthResponse> {
      const response = await fetchFn(`${baseUrl}/health`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch health status: HTTP ${response.status}`);
      }

      return (await response.json()) as HealthResponse;
    },
  };
}
