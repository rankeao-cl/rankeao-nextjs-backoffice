"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/lib/types/auth";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  user: User | null;
  _hasHydrated: boolean;

  setAuth: (data: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user: User;
  }) => void;
  setTokens: (data: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isTokenExpiringSoon: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      user: null,
      _hasHydrated: false,

      setAuth: (data) => {
        const expiresAt = Date.now() + data.expires_in * 1000;
        set({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresAt,
          user: data.user,
        });
        // Sync cookie for middleware
        if (typeof document !== "undefined") {
          document.cookie = `rankeao_admin_token=${encodeURIComponent(data.access_token)}; Path=/; Max-Age=604800; SameSite=Lax`;
        }
      },

      setTokens: (data) => {
        const expiresAt = Date.now() + data.expires_in * 1000;
        set({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresAt,
        });
        if (typeof document !== "undefined") {
          document.cookie = `rankeao_admin_token=${encodeURIComponent(data.access_token)}; Path=/; Max-Age=604800; SameSite=Lax`;
        }
      },

      logout: () => {
        set({
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
          user: null,
        });
        if (typeof document !== "undefined") {
          document.cookie = "rankeao_admin_token=; Path=/; Max-Age=0; SameSite=Lax";
          document.cookie = "rankeao_admin_refresh_token=; Path=/; Max-Age=0; SameSite=Lax";
        }
      },

      isAuthenticated: () => {
        const { accessToken, expiresAt } = get();
        if (!accessToken || !expiresAt) return false;
        return expiresAt > Date.now();
      },

      isTokenExpiringSoon: () => {
        const { expiresAt } = get();
        if (!expiresAt) return false;
        return expiresAt - Date.now() < 5 * 60 * 1000;
      },
    }),
    {
      name: "rankeao-admin-auth",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
        user: state.user,
      }),
    }
  )
);

if (typeof window !== "undefined") {
  useAuthStore.persist.onFinishHydration(() => {
    useAuthStore.setState({ _hasHydrated: true });
  });
  if (useAuthStore.persist.hasHydrated()) {
    useAuthStore.setState({ _hasHydrated: true });
  }
}
