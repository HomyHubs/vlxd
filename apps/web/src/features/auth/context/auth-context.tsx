import React, { createContext, useContext, useMemo } from "react";
import type {
  AuthMeResponse,
  AuthSession,
  AuthTenant,
  AuthTitle,
  AuthUser,
  LoginRequest,
  LoginResponse,
} from "@vlxd/api-client";
import { useAuthMeQuery, useLoginMutation, useLogoutMutation } from "../api/auth-api.js";

export interface AuthContextValue {
  user: AuthUser | null;
  tenant: AuthTenant | null;
  session: AuthSession | null;
  isOwner: boolean;
  titles: AuthTitle[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isError: boolean;
  login: (credentials: LoginRequest) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  refetchAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export interface AuthProviderProps {
  children: React.ReactNode;
  initialData?: AuthMeResponse | null;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const authMeQuery = useAuthMeQuery();
  const loginMutation = useLoginMutation();
  const logoutMutation = useLogoutMutation();

  const authData = authMeQuery.data;

  const value = useMemo<AuthContextValue>(() => {
    const isAuthenticated = Boolean(authData?.user && authData?.tenant);

    return {
      user: authData?.user ?? null,
      tenant: authData?.tenant ?? null,
      session: authData?.session ?? null,
      isOwner: authData?.isOwner ?? false,
      titles: authData?.titles ?? [],
      isAuthenticated,
      isLoading: authMeQuery.isLoading || loginMutation.isPending || logoutMutation.isPending,
      isError: authMeQuery.isError && !isAuthenticated,
      login: async (credentials: LoginRequest) => {
        const response = await loginMutation.mutateAsync(credentials);
        await authMeQuery.refetch();
        return response;
      },
      logout: async () => {
        await logoutMutation.mutateAsync();
      },
      refetchAuth: async () => {
        await authMeQuery.refetch();
      },
    };
  }, [authData, authMeQuery, loginMutation, logoutMutation]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
