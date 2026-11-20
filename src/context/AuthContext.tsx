"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { UserProfile } from "@/types/movie";

export interface AuthActionResult {
  ok: boolean;
  user?: UserProfile | null;
  error?: string;
  setupRequired?: boolean;
  emailConfirmationRequired?: boolean;
  message?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  authConfigured: boolean;
  login: (email: string, password: string) => Promise<AuthActionResult>;
  signup: (name: string, email: string, password: string) => Promise<AuthActionResult>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateProfile: (updates: Pick<Partial<UserProfile>, "name" | "avatar">) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authConfigured, setAuthConfigured] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      // Remove any legacy insecure client-side session cache
      if (typeof window !== "undefined") {
        localStorage.removeItem("cinova_user_session");
      }

      const res = await fetch("/api/auth/session", {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => null);
      if (data) {
        setAuthConfigured(Boolean(data.configured));
        setUser(data.authenticated && data.user ? (data.user as UserProfile) : null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthActionResult> => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          cache: "no-store",
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (data?.setupRequired) {
          setAuthConfigured(false);
          return {
            ok: false,
            setupRequired: true,
            error: data.error || "Supabase Auth is not configured.",
          };
        }
        if (!res.ok || !data?.success) {
          return {
            ok: false,
            error: data?.error || "Invalid email or password.",
          };
        }
        setUser(data.user || null);
        setAuthConfigured(true);
        return { ok: true, user: data.user || null };
      } catch {
        return { ok: false, error: "Unable to sign in right now. Please try again." };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const signup = useCallback(
    async (name: string, email: string, password: string): Promise<AuthActionResult> => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          cache: "no-store",
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (data?.setupRequired) {
          setAuthConfigured(false);
          return {
            ok: false,
            setupRequired: true,
            error: data.error || "Supabase Auth is not configured.",
          };
        }
        if (!res.ok || !data?.success) {
          return {
            ok: false,
            error: data?.error || "Unable to create account.",
          };
        }
        if (data.user) {
          setUser(data.user);
        }
        setAuthConfigured(true);
        return {
          ok: true,
          emailConfirmationRequired: Boolean(data.emailConfirmationRequired),
          message: data.message,
        };
      } catch {
        return { ok: false, error: "Unable to create your account right now." };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });
    } finally {
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("cinova_user_session");
      }
    }
  }, []);

  const updateProfile = useCallback(
    (updates: Pick<Partial<UserProfile>, "name" | "avatar">) => {
      setUser((prev) => {
        if (!prev) return prev;
        // Never allow client-side role or membership tier elevation
        return {
          ...prev,
          ...(typeof updates.name === "string" ? { name: updates.name } : {}),
          ...(typeof updates.avatar === "string" ? { avatar: updates.avatar } : {}),
        };
      });
    },
    []
  );

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      isLoading,
      authConfigured,
      login,
      signup,
      logout,
      refreshSession,
      updateProfile,
    }),
    [user, isLoading, authConfigured, login, signup, logout, refreshSession, updateProfile]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
