import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AuthMeResponse, LoginRequest, LoginResponse, LogoutResponse } from "@vlxd/api-client";
import { apiClient } from "../../../lib/api-client.js";

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

export function useAuthMeQuery(options?: { enabled?: boolean }) {
  return useQuery<AuthMeResponse | null>({
    queryKey: authKeys.me(),
    queryFn: async () => {
      try {
        return await apiClient.getAuthMe();
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
    enabled: options?.enabled ?? true,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation<LoginResponse, Error, LoginRequest>({
    mutationFn: async (payload: LoginRequest) => {
      return apiClient.login(payload);
    },
    onSuccess: (data) => {
      // Pre-fill me query and invalidate
      queryClient.setQueryData(authKeys.me(), {
        user: data.user,
        tenant: data.tenant,
        session: data.session,
        isOwner: false,
        titles: [],
      });
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation<LogoutResponse, Error, void>({
    mutationFn: async () => {
      return apiClient.logout();
    },
    onSuccess: () => {
      // Clear auth query cache
      queryClient.setQueryData(authKeys.me(), null);
      queryClient.removeQueries({ queryKey: authKeys.all });
    },
  });
}
