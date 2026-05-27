"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";

type AuthUser = {
  id: number;
  name: string;
  email: string;
};

type AuthState =
  | { status: "loading"; user: null }
  | { status: "authenticated"; user: AuthUser }
  | { status: "unauthenticated"; user: null };

type AuthContextValue = {
  state: AuthState;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading", user: null });

  const refresh = useCallback(async () => {
    setState((prev) => (prev.status === "authenticated" ? prev : { status: "loading", user: null }));

    try {
      const res = await axios.get("/api/auth/me", { withCredentials: true });
      const user = (res.data?.data ?? res.data) as AuthUser;

      if (user && typeof user === "object" && typeof user.id === "number") {
        setState({ status: "authenticated", user });
        return;
      }

      setState({ status: "unauthenticated", user: null });
    } catch {
      setState({ status: "unauthenticated", user: null });
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await axios.post("/api/auth/logout", null, { withCredentials: true });
    } catch {
    } finally {
      setState({ status: "unauthenticated", user: null });
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void refresh();
    }, 0);
    return () => clearTimeout(t);
  }, [refresh]);

  const value = useMemo<AuthContextValue>(() => ({ state, refresh, logout }), [state, refresh, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider />");
  return ctx;
}
