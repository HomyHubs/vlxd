import { createApiClient } from "@vlxd/api-client";

const apiUrl = import.meta.env.VITE_API_URL || "/api";

export const apiClient = createApiClient({
  baseUrl: apiUrl,
});
