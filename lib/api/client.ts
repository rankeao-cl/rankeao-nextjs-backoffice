import { useAuthStore } from "@/lib/stores/auth-store";
import { ApiError, type ListMeta } from "@/lib/types/api";

const DEFAULT_API_BASE = "https://rankeao-go-gateway-production.up.railway.app/api/v1";

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/api/v1") ? trimmed : `${trimmed}/api/v1`;
}

const BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE
);

// ---------------------------------------------------------------------------
// Token refresh with deduplication
// ---------------------------------------------------------------------------

let refreshPromise: Promise<void> | null = null;

async function refreshTokens(): Promise<void> {
  const { refreshToken, setTokens, logout } = useAuthStore.getState();
  if (!refreshToken) {
    logout();
    throw new Error("No refresh token");
  }

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    logout();
    if (typeof window !== "undefined") {
      window.location.href = "/admin/login?session=expired";
    }
    throw new Error("Token refresh failed");
  }

  const payload = await res.json();
  const tokens = extractTokens(payload);

  if (!tokens) {
    logout();
    throw new Error("Token refresh failed");
  }

  setTokens(tokens);
}

async function ensureFreshToken(): Promise<void> {
  const { isTokenExpiringSoon, accessToken } = useAuthStore.getState();
  if (!accessToken) return;

  if (isTokenExpiringSoon()) {
    if (!refreshPromise) {
      refreshPromise = refreshTokens().finally(() => {
        refreshPromise = null;
      });
    }
    await refreshPromise;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractTokens(
  payload: unknown
): { access_token: string; refresh_token: string; expires_in: number } | null {
  if (isRecord(payload)) {
    if (typeof payload.access_token === "string" && typeof payload.refresh_token === "string") {
      return {
        access_token: payload.access_token,
        refresh_token: payload.refresh_token,
        expires_in: typeof payload.expires_in === "number" ? payload.expires_in : 3600,
      };
    }

    const data = payload.data;
    if (isRecord(data)) {
      const tokens = data.tokens;
      if (
        isRecord(tokens) &&
        typeof tokens.access_token === "string" &&
        typeof tokens.refresh_token === "string"
      ) {
        return {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_in: typeof tokens.expires_in === "number" ? tokens.expires_in : 3600,
        };
      }
    }
  }
  return null;
}

function unwrapData(payload: unknown): unknown {
  if (!isRecord(payload)) return payload;
  if ("data" in payload) return payload.data;
  return payload;
}

function extractErrorMessage(payload: unknown, status: number): string {
  const fallback = `Error ${status}`;
  if (!isRecord(payload)) return fallback;

  if (typeof payload.message === "string" && payload.message.trim()) return payload.message;
  if (typeof payload.error === "string" && payload.error.trim()) return payload.error;
  if (isRecord(payload.error) && typeof payload.error.message === "string") return payload.error.message;
  if (isRecord(payload.data) && typeof payload.data.message === "string") return payload.data.message;

  return fallback;
}

function extractErrorCode(payload: unknown): string | undefined {
  if (!isRecord(payload)) return undefined;
  if (typeof payload.code === "string") return payload.code;
  if (isRecord(payload.error) && typeof payload.error.code === "string") return payload.error.code;
  return undefined;
}

async function parseJson(res: Response): Promise<unknown | undefined> {
  const text = await res.text();
  if (!text.trim()) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function buildUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): string {
  let url = `${BASE_URL}${path}`;
  if (!params) return url;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  if (query) url += `?${query}`;
  return url;
}

// ---------------------------------------------------------------------------
// Core fetch
// ---------------------------------------------------------------------------

interface FetchOptions extends Omit<RequestInit, "body" | "headers"> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

export async function apiFetch<T = unknown>(path: string, options: FetchOptions = {}): Promise<T> {
  const { body, params, headers: extraHeaders, skipAuth, ...rest } = options;
  const url = buildUrl(path, params);
  const method = String(rest.method ?? "GET").toUpperCase();

  if (!skipAuth) {
    await ensureFreshToken();
  }

  const makeRequest = async (tokenOverride?: string | null): Promise<Response> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(extraHeaders ?? {}),
    };

    if (!skipAuth) {
      const token = tokenOverride ?? useAuthStore.getState().accessToken;
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }

    return fetch(url, {
      ...rest,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  };

  let response: Response;
  try {
    response = await makeRequest();
  } catch {
    throw new ApiError("No se pudo conectar con el servidor.", 0, path, "NETWORK_ERROR");
  }

  // Auto-retry on 401 (token might have just expired)
  if (response.status === 401 && !skipAuth && !path.startsWith("/auth/")) {
    try {
      await refreshTokens();
      response = await makeRequest(useAuthStore.getState().accessToken);
    } catch {
      useAuthStore.getState().logout();
      if (typeof window !== "undefined") {
        window.location.href = "/admin/login";
      }
      throw new ApiError("Sesión expirada.", 401, path, "UNAUTHORIZED");
    }
  }

  if (response.status === 401) {
    useAuthStore.getState().logout();
    if (typeof window !== "undefined") {
      window.location.href = "/admin/login";
    }
    throw new ApiError("Sesión expirada.", 401, path, "UNAUTHORIZED");
  }

  const payload = await parseJson(response);

  if (response.status === 403) {
    const message = extractErrorMessage(payload, 403) || "No autorizado: permisos insuficientes.";
    throw new ApiError(message, 403, path, extractErrorCode(payload) ?? "FORBIDDEN");
  }

  if (!response.ok) {
    throw new ApiError(
      extractErrorMessage(payload, response.status),
      response.status,
      path,
      extractErrorCode(payload)
    );
  }

  if (response.status === 204 || payload === undefined) {
    return {} as T;
  }

  return payload as T;
}

// ---------------------------------------------------------------------------
// List extraction helpers (API returns data in varying shapes)
// ---------------------------------------------------------------------------

export function extractList<T>(payload: unknown, keys: string[]): T[] {
  const root = unwrapData(payload);
  if (Array.isArray(root)) return root as T[];
  if (!isRecord(root)) return [];

  for (const key of keys) {
    const value = root[key];
    if (Array.isArray(value)) return value as T[];
  }
  return [];
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

export function extractListMeta(
  payload: unknown,
  fallbackTotal: number,
  fallbackPerPage: number = 20
): ListMeta {
  const root = unwrapData(payload);

  const candidates: unknown[] = [];
  if (isRecord(root)) {
    candidates.push(root.meta, root.pagination, root.page_info, root);
  }

  let source: Record<string, unknown> | null = null;
  for (const c of candidates) {
    if (
      isRecord(c) &&
      ("page" in c || "per_page" in c || "total" in c || "total_pages" in c || "count" in c)
    ) {
      source = c;
      break;
    }
  }

  const page = Math.max(1, toNumber(source?.page) ?? 1);
  const perPage = Math.max(
    1,
    toNumber(source?.per_page) ??
      toNumber(source?.limit) ??
      toNumber(source?.page_size) ??
      fallbackPerPage
  );
  const totalRaw =
    toNumber(source?.total) ?? toNumber(source?.count) ?? toNumber(source?.total_count);
  const total = Math.max(fallbackTotal, totalRaw ?? fallbackTotal);
  const totalPages = Math.max(
    1,
    toNumber(source?.total_pages) ??
      toNumber(source?.pages) ??
      (total > 0 ? Math.ceil(total / perPage) : 1)
  );

  return { page, per_page: perPage, total, total_pages: totalPages };
}

export function extractRecord(payload: unknown): Record<string, unknown> {
  const root = unwrapData(payload);
  return isRecord(root) ? root : {};
}
