import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { apiClient } from "../services/api/client";
import { authApi } from "../services/api/auth";
import { tokenStorage } from "../services/api/tokenStorage";
import type { Principal } from "../services/api/types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: AuthStatus;
  principal: Principal | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Re-fetch the principal from /auth/me (e.g. after switching organization). */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Owns the authenticated session for the SPA: a short-lived Sanctum access token
 * plus a rotating refresh token, both kept in sessionStorage, with the principal
 * re-fetched from `/auth/me` on load. Registers (a) a 401 handler so terminal
 * token invalidation logs the user out, and (b) a refresh handler so the API
 * client can silently mint a new access token when the old one expires.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [principal, setPrincipal] = useState<Principal | null>(null);

  // Organization context (X-Organization header) is owned by OrganizationProvider,
  // which reacts to the principal's current_organization_id.
  const applyPrincipal = useCallback((next: Principal) => {
    setPrincipal(next);
    setStatus("authenticated");
  }, []);

  const clearSession = useCallback(() => {
    tokenStorage.clear();
    setPrincipal(null);
    setStatus("unauthenticated");
  }, []);

  // Automatic logout on terminal token invalidation (a 401 the client could not
  // recover from via silent refresh).
  useEffect(() => {
    apiClient.setUnauthorizedHandler(() => {
      setPrincipal(null);
      setStatus("unauthenticated");
    });
    return () => apiClient.setUnauthorizedHandler(null);
  }, []);

  // Silent refresh: when a call 401s, the client asks us to exchange the stored
  // refresh token for a fresh pair. Returning true lets the client replay the call.
  useEffect(() => {
    apiClient.setRefreshHandler(async () => {
      const refreshToken = tokenStorage.getRefresh();
      if (!refreshToken) return false;
      try {
        const { data } = await authApi.refresh(refreshToken);
        tokenStorage.set(data.access_token ?? data.token);
        if (data.refresh_token) tokenStorage.setRefresh(data.refresh_token);
        return true;
      } catch {
        return false;
      }
    });
    return () => apiClient.setRefreshHandler(null);
  }, []);

  // Bootstrap: if a token exists, validate it by loading the principal.
  useEffect(() => {
    let active = true;

    (async () => {
      if (!tokenStorage.get()) {
        setStatus("unauthenticated");
        return;
      }
      try {
        const { data } = await authApi.me();
        if (active) applyPrincipal(data);
      } catch {
        if (active) clearSession();
      }
    })();

    return () => {
      active = false;
    };
  }, [applyPrincipal, clearSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await authApi.login(email, password);
      tokenStorage.set(data.access_token ?? data.token);
      if (data.refresh_token) tokenStorage.setRefresh(data.refresh_token);

      // Hydrate the full principal (roles + permissions); fall back to the login
      // payload if the profile call is briefly unavailable.
      try {
        const me = await authApi.me();
        applyPrincipal(me.data);
      } catch {
        applyPrincipal(data.user);
      }
    },
    [applyPrincipal],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // best-effort revoke; tear down the local session regardless
    }
    clearSession();
  }, [clearSession]);

  // Re-fetch the principal (roles/permissions/org context) without a full reload.
  const refresh = useCallback(async () => {
    try {
      const me = await authApi.me();
      setPrincipal(me.data);
    } catch {
      // leave current state; a 401 will have already triggered logout
    }
  }, []);

  return (
    <AuthContext.Provider value={{ status, principal, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
