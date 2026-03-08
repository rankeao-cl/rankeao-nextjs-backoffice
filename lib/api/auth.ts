import { apiFetch } from "./client";
import type { AuthResponse, User } from "@/lib/types/auth";

// ---------------------------------------------------------------------------
// Auth response normalization (API returns different shapes)
// ---------------------------------------------------------------------------

interface AuthPayload {
  data?: {
    tokens?: {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
    };
    user?: {
      id?: string | number;
      username?: string;
      email?: string;
      avatar_url?: string;
      created_at?: string;
    };
  };
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: User;
}

function normalizeAuthResponse(payload: AuthPayload): AuthResponse {
  // Direct shape: { access_token, refresh_token, user, expires_in }
  if (payload.access_token && payload.refresh_token && payload.user) {
    return {
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
      expires_in: payload.expires_in ?? 3600,
      user: {
        ...payload.user,
        id: String(payload.user.id),
      },
    };
  }

  // Envelope shape: { data: { tokens: {...}, user: {...} } }
  const tokens = payload.data?.tokens;
  const user = payload.data?.user;

  if (!tokens?.access_token || !tokens?.refresh_token || !user?.id || !user.email) {
    throw new Error("Respuesta de autenticación inválida");
  }

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_in: tokens.expires_in ?? 3600,
    user: {
      id: String(user.id),
      username: user.username ?? "",
      email: user.email,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
    },
  };
}

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------

export async function login(email: string, password: string): Promise<AuthResponse> {
  const raw = await apiFetch<AuthPayload>("/auth/login", {
    method: "POST",
    body: { email, password },
    skipAuth: true,
  });
  return normalizeAuthResponse(raw);
}

export async function register(data: {
  username: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const raw = await apiFetch<AuthPayload>("/auth/register", {
    method: "POST",
    body: data,
    skipAuth: true,
  });
  return normalizeAuthResponse(raw);
}

export async function refreshToken(token: string) {
  const raw = await apiFetch<AuthPayload>("/auth/refresh", {
    method: "POST",
    body: { refresh_token: token },
    skipAuth: true,
  });

  if (raw.access_token && raw.refresh_token) {
    return {
      access_token: raw.access_token,
      refresh_token: raw.refresh_token,
      expires_in: raw.expires_in ?? 3600,
    };
  }

  const tokens = raw.data?.tokens;
  if (!tokens?.access_token || !tokens?.refresh_token) {
    throw new Error("Respuesta de refresh inválida");
  }

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_in: tokens.expires_in ?? 3600,
  };
}

export async function forgotPassword(email: string) {
  return apiFetch("/auth/forgot-password", {
    method: "POST",
    body: { email },
    skipAuth: true,
  });
}

export async function resetPassword(data: Record<string, unknown>) {
  return apiFetch("/auth/reset-password", {
    method: "POST",
    body: data,
    skipAuth: true,
  });
}

export async function verifyEmail(data: Record<string, unknown>) {
  return apiFetch("/auth/verify-email", {
    method: "POST",
    body: data,
    skipAuth: true,
  });
}

export async function oauthGoogleCallback(params?: Record<string, string | undefined>) {
  return apiFetch("/auth/oauth/google/callback", { params, skipAuth: true });
}

export async function oauthDiscordCallback(params?: Record<string, string | undefined>) {
  return apiFetch("/auth/oauth/discord/callback", { params, skipAuth: true });
}

export async function oauthAppleCallback(params?: Record<string, string | undefined>) {
  return apiFetch("/auth/oauth/apple/callback", { params, skipAuth: true });
}
