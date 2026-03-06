// Rankeao Admin API client

const DEFAULT_API_BASE = "https://rankeao-go-gateway-production.up.railway.app/api/v1";

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, "");

  if (trimmed.endsWith("/api/v1")) {
    return trimmed;
  }

  return `${trimmed}/api/v1`;
}

const BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE
);

const LAST_API_ERROR_STORAGE_KEY = "rankeao_admin_last_api_error";
export const LAST_API_ERROR_EVENT = "rankeao:api-error-updated";

export interface LastApiErrorInfo {
  status: number;
  code?: string;
  path: string;
  method: string;
  url: string;
  message: string;
  at: string;
}

function setLastApiError(error: LastApiErrorInfo) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(LAST_API_ERROR_STORAGE_KEY, JSON.stringify(error));
  window.dispatchEvent(new Event(LAST_API_ERROR_EVENT));
}

export function getLastApiError(): LastApiErrorInfo | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(LAST_API_ERROR_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as LastApiErrorInfo;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.path !== "string" ||
      typeof parsed.message !== "string" ||
      typeof parsed.at !== "string"
    ) {
      return null;
    }

    return parsed;
  } catch {
    localStorage.removeItem(LAST_API_ERROR_STORAGE_KEY);
    return null;
  }
}

export function clearLastApiError() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(LAST_API_ERROR_STORAGE_KEY);
  window.dispatchEvent(new Event(LAST_API_ERROR_EVENT));
}

function rememberApiError(
  path: string,
  method: string,
  url: string,
  status: number,
  message: string,
  code?: string
) {
  setLastApiError({
    path,
    method,
    url,
    status,
    message,
    code,
    at: new Date().toISOString(),
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unwrapData(payload: unknown): unknown {
  if (!isRecord(payload)) {
    return payload;
  }

  if ("data" in payload) {
    return payload.data;
  }

  return payload;
}

function extractList<T>(payload: unknown, keys: string[]): T[] {
  const root = unwrapData(payload);

  if (Array.isArray(root)) {
    return root as T[];
  }

  if (!isRecord(root)) {
    return [];
  }

  for (const key of keys) {
    const value = root[key];
    if (Array.isArray(value)) {
      return value as T[];
    }
  }

  return [];
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

export interface ListMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

function hasPaginationHints(record: Record<string, unknown>): boolean {
  return (
    "page" in record ||
    "per_page" in record ||
    "total" in record ||
    "total_pages" in record ||
    "count" in record ||
    "total_count" in record
  );
}

function extractListMeta(
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
  for (const candidate of candidates) {
    if (isRecord(candidate) && hasPaginationHints(candidate)) {
      source = candidate;
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

  return {
    page,
    per_page: perPage,
    total,
    total_pages: totalPages,
  };
}

function extractRecord(payload: unknown): Record<string, unknown> {
  const root = unwrapData(payload);
  return isRecord(root) ? root : {};
}

function extractErrorMessage(payload: unknown, status: number): string {
  const fallback = `Error ${status}`;

  if (!isRecord(payload)) {
    return fallback;
  }

  const direct = payload.message;
  if (typeof direct === "string" && direct.trim()) {
    return direct;
  }

  const errorField = payload.error;
  if (typeof errorField === "string" && errorField.trim()) {
    return errorField;
  }

  if (isRecord(errorField) && typeof errorField.message === "string") {
    return errorField.message;
  }

  const data = payload.data;
  if (isRecord(data) && typeof data.message === "string") {
    return data.message;
  }

  return fallback;
}

function extractErrorCode(payload: unknown): string | undefined {
  if (!isRecord(payload)) {
    return undefined;
  }

  if (typeof payload.code === "string") {
    return payload.code;
  }

  const errorField = payload.error;
  if (isRecord(errorField) && typeof errorField.code === "string") {
    return errorField.code;
  }

  return undefined;
}

async function parseJson(res: Response): Promise<unknown | undefined> {
  const text = await res.text();
  if (!text.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  let url = `${BASE_URL}${path}`;

  if (!params) {
    return url;
  }

  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") {
      continue;
    }
    search.set(key, String(value));
  }

  const query = search.toString();
  if (query) {
    url += `?${query}`;
  }

  return url;
}

// Token helpers (localStorage)
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("rankeao_admin_token");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("rankeao_admin_refresh_token");
}

export function setTokens(access: string, refresh: string) {
  if (typeof window === "undefined") return;

  localStorage.setItem("rankeao_admin_token", access);
  localStorage.setItem("rankeao_admin_refresh_token", refresh);

  // Keep middleware checks synced (reads cookie token on protected routes).
  document.cookie = `rankeao_admin_token=${encodeURIComponent(access)}; Path=/; Max-Age=604800; SameSite=Lax`;
  document.cookie = `rankeao_admin_refresh_token=${encodeURIComponent(refresh)}; Path=/; Max-Age=604800; SameSite=Lax`;
}

export function clearTokens() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("rankeao_admin_token");
  localStorage.removeItem("rankeao_admin_refresh_token");
  localStorage.removeItem("rankeao_admin_user");

  document.cookie = "rankeao_admin_token=; Path=/; Max-Age=0; SameSite=Lax";
  document.cookie = "rankeao_admin_refresh_token=; Path=/; Max-Age=0; SameSite=Lax";
}

export class ApiError extends Error {
  status: number;
  code?: string;
  path: string;

  constructor(message: string, status: number, path: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.path = path;
  }
}

interface FetchOptions extends Omit<RequestInit, "body" | "headers"> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  skipAuthRetry?: boolean;
}

interface TokenEnvelope {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
}

interface AuthEnvelope {
  data?: {
    tokens?: TokenEnvelope;
  };
}

function extractTokens(payload: unknown): TokenEnvelope | null {
  if (isRecord(payload)) {
    const directAccess = payload.access_token;
    const directRefresh = payload.refresh_token;

    if (typeof directAccess === "string" && typeof directRefresh === "string") {
      return {
        access_token: directAccess,
        refresh_token: directRefresh,
        expires_in: typeof payload.expires_in === "number" ? payload.expires_in : undefined,
      };
    }
  }

  const nested = (payload as AuthEnvelope | undefined)?.data?.tokens;
  if (nested?.access_token && nested.refresh_token) {
    return nested;
  }

  return null;
}

async function tryRefreshSession(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  let res: Response;
  try {
    res = await fetch(buildUrl("/auth/refresh"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } catch {
    return null;
  }

  if (!res.ok) {
    return null;
  }

  const payload = await parseJson(res);
  const tokens = extractTokens(payload);

  if (!tokens?.access_token || !tokens.refresh_token) {
    return null;
  }

  setTokens(tokens.access_token, tokens.refresh_token);
  return tokens.access_token;
}

export async function apiFetch<T = unknown>(path: string, options: FetchOptions = {}): Promise<T> {
  const { body, params, headers: extraHeaders, skipAuthRetry, ...rest } = options;
  const url = buildUrl(path, params);
  const method = String(rest.method ?? "GET").toUpperCase();

  const executeRequest = async (tokenOverride?: string | null): Promise<Response> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(extraHeaders ?? {}),
    };

    const token = tokenOverride ?? getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return fetch(url, {
      ...rest,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  };

  let response: Response;
  try {
    response = await executeRequest();
  } catch {
    const message = "No se pudo conectar con el servidor.";
    rememberApiError(path, method, url, 0, message, "NETWORK_ERROR");
    throw new ApiError(message, 0, path, "NETWORK_ERROR");
  }

  if (
    response.status === 401 &&
    !skipAuthRetry &&
    !path.startsWith("/auth/") &&
    typeof window !== "undefined"
  ) {
    const refreshedToken = await tryRefreshSession();
    if (refreshedToken) {
      try {
        response = await executeRequest(refreshedToken);
      } catch {
        const message = "No se pudo conectar con el servidor.";
        rememberApiError(path, method, url, 0, message, "NETWORK_ERROR");
        throw new ApiError(message, 0, path, "NETWORK_ERROR");
      }
    }
  }

  if (response.status === 401) {
    rememberApiError(
      path,
      method,
      url,
      401,
      "Sesion expirada. Inicia sesion nuevamente.",
      "UNAUTHORIZED"
    );
    clearTokens();
    if (typeof window !== "undefined") {
      window.location.href = "/admin/login";
    }
    throw new ApiError("Sesion expirada. Inicia sesion nuevamente.", 401, path, "UNAUTHORIZED");
  }

  const payload = await parseJson(response);

  if (response.status === 403) {
    const message = extractErrorMessage(payload, 403) || "No autorizado: permisos insuficientes.";
    const code = extractErrorCode(payload) ?? "FORBIDDEN";
    rememberApiError(path, method, url, 403, message, code);
    throw new ApiError(message, 403, path, code);
  }

  if (!response.ok) {
    const message = extractErrorMessage(payload, response.status);
    const code = extractErrorCode(payload);
    rememberApiError(path, method, url, response.status, message, code);
    throw new ApiError(message, response.status, path, code);
  }

  if (response.status === 204 || payload === undefined) {
    return {} as T;
  }

  return payload as T;
}

// Auth
export interface AuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
    avatar_url?: string;
    created_at: string;
  };
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

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
}

function normalizeAuthResponse(payload: AuthResponse | AuthPayload): AuthResponse {
  const direct = payload as AuthResponse;
  if (direct?.access_token && direct?.refresh_token && direct?.user) {
    return {
      ...direct,
      user: {
        ...direct.user,
        id: String(direct.user.id),
      },
    };
  }

  const envelope = payload as AuthPayload;
  const tokens = envelope.data?.tokens;
  const user = envelope.data?.user;

  if (!tokens?.access_token || !tokens?.refresh_token || !user?.id || !user.email) {
    throw new ApiError("Respuesta de autenticacion invalida", 500, "/auth/login", "INVALID_AUTH_RESPONSE");
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
      created_at: user.created_at ?? "",
    },
  };
}

export async function loginAdmin(email: string, password: string): Promise<AuthResponse> {
  const raw = await apiFetch<AuthResponse | AuthPayload>("/auth/login", {
    method: "POST",
    body: { email, password },
    skipAuthRetry: true,
  });

  return normalizeAuthResponse(raw);
}

export async function refreshToken(refreshTk: string): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const raw = await apiFetch<{ access_token: string; refresh_token: string; expires_in: number } | AuthPayload>(
    "/auth/refresh",
    {
      method: "POST",
      body: { refresh_token: refreshTk },
      skipAuthRetry: true,
    }
  );

  if (isRecord(raw) && typeof raw.access_token === "string" && typeof raw.refresh_token === "string") {
    return {
      access_token: raw.access_token,
      refresh_token: raw.refresh_token,
      expires_in: typeof raw.expires_in === "number" ? raw.expires_in : 3600,
    };
  }

  const tokens = (raw as AuthPayload)?.data?.tokens;
  if (!tokens?.access_token || !tokens?.refresh_token) {
    throw new ApiError("Respuesta de refresh invalida", 500, "/auth/refresh", "INVALID_REFRESH_RESPONSE");
  }

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_in: tokens.expires_in ?? 3600,
  };
}

// Tenants
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  city: string;
  region: string;
  country: string;
  logo_url?: string;
  is_public: boolean;
  created_at: string;
}

export async function getTenants(): Promise<{ tenants: Tenant[] }> {
  const payload = await apiFetch<unknown>("/admin/tenants");
  return { tenants: extractList<Tenant>(payload, ["tenants", "items"]) };
}

export async function verifyTenant(id: string) {
  return apiFetch(`/admin/tenants/${id}/verify`, { method: "POST" });
}

export async function rejectTenant(id: string) {
  return apiFetch(`/admin/tenants/${id}/reject`, { method: "POST" });
}

export async function suspendTenant(id: string) {
  return apiFetch(`/admin/tenants/${id}/suspend`, { method: "POST" });
}

export async function reactivateTenant(id: string) {
  return apiFetch(`/admin/tenants/${id}/reactivate`, { method: "POST" });
}

// Gamification stats
export async function getGamificationStats(): Promise<Record<string, unknown>> {
  const payload = await apiFetch<unknown>("/gamification/admin/stats");
  return extractRecord(payload);
}

// Badges
export async function getBadges(): Promise<{ badges: Record<string, unknown>[] }> {
  const payload = await apiFetch<unknown>("/gamification/admin/badges");
  return { badges: extractList<Record<string, unknown>>(payload, ["badges", "items"]) };
}

export async function createBadge(data: Record<string, unknown>) {
  return apiFetch("/gamification/admin/badges", { method: "POST", body: data });
}

export async function updateBadge(id: string, data: Record<string, unknown>) {
  return apiFetch(`/gamification/admin/badges/${id}`, { method: "PATCH", body: data });
}

export async function grantBadge(badgeId: string, data: { user_id: string; reason?: string }) {
  return apiFetch(`/gamification/admin/badges/${badgeId}/grant`, { method: "POST", body: data });
}

export async function revokeBadge(badgeId: string, data: { user_id: string; reason?: string }) {
  return apiFetch(`/gamification/admin/badges/${badgeId}/revoke`, { method: "POST", body: data });
}

export async function bulkGrantBadge(badgeId: string, data: { user_ids: string[] }) {
  return apiFetch(`/gamification/admin/badges/${badgeId}/bulk-grant`, { method: "POST", body: data });
}

// Badge categories
export async function createBadgeCategory(data: Record<string, unknown>) {
  return apiFetch("/gamification/admin/badge-categories", { method: "POST", body: data });
}

export async function updateBadgeCategory(id: string, data: Record<string, unknown>) {
  return apiFetch(`/gamification/admin/badge-categories/${id}`, { method: "PATCH", body: data });
}

// Cosmetics
export async function createCosmetic(data: Record<string, unknown>) {
  return apiFetch("/gamification/admin/cosmetics", { method: "POST", body: data });
}

export async function updateCosmetic(id: string, data: Record<string, unknown>) {
  return apiFetch(`/gamification/admin/cosmetics/${id}`, { method: "PATCH", body: data });
}

export async function grantCosmetic(cosmeticId: string, data: { user_id: string; reason?: string }) {
  return apiFetch(`/gamification/admin/cosmetics/${cosmeticId}/grant`, { method: "POST", body: data });
}

export async function revokeCosmetic(cosmeticId: string, data: { user_id: string; reason?: string }) {
  return apiFetch(`/gamification/admin/cosmetics/${cosmeticId}/revoke`, { method: "POST", body: data });
}

// Titles
export async function createTitle(data: Record<string, unknown>) {
  return apiFetch("/gamification/admin/titles", { method: "POST", body: data });
}

export async function updateTitle(id: string, data: Record<string, unknown>) {
  return apiFetch(`/gamification/admin/titles/${id}`, { method: "PATCH", body: data });
}

export async function grantTitle(titleId: string, data: { user_id: string; reason?: string }) {
  return apiFetch(`/gamification/admin/titles/${titleId}/grant`, { method: "POST", body: data });
}

export async function revokeTitle(titleId: string, data: { user_id: string; reason?: string }) {
  return apiFetch(`/gamification/admin/titles/${titleId}/revoke`, { method: "POST", body: data });
}

// XP events
export async function getXPEvents(): Promise<{ events: Record<string, unknown>[] }> {
  const payload = await apiFetch<unknown>("/gamification/admin/xp-events");
  return { events: extractList<Record<string, unknown>>(payload, ["events", "xp_events", "items"]) };
}

export async function createXPEvent(data: Record<string, unknown>) {
  return apiFetch("/gamification/admin/xp-events", { method: "POST", body: data });
}

export async function updateXPEvent(id: string, data: Record<string, unknown>) {
  return apiFetch(`/gamification/admin/xp-events/${id}`, { method: "PATCH", body: data });
}

// Levels
export async function batchUpdateLevels(data: Record<string, unknown>) {
  return apiFetch("/gamification/admin/levels", { method: "PUT", body: data });
}

// Seasons
export async function createSeason(data: { name: string; starts_at: string; ends_at: string }) {
  return apiFetch("/gamification/admin/seasons", { method: "POST", body: data });
}

export async function previewSeasonClose(seasonId: string) {
  return apiFetch(`/gamification/seasons/${seasonId}/preview-close`);
}

export async function closeSeason(seasonId: string, confirm: boolean = true) {
  return apiFetch(`/gamification/seasons/${seasonId}/close`, {
    method: "POST",
    body: { confirm },
  });
}

// Disputes
export async function getDisputes(filters?: {
  status?: string;
  reason?: string;
  assigned_moderator_id?: string;
  unassigned?: boolean;
  page?: number;
  per_page?: number;
}): Promise<{ disputes: Record<string, unknown>[]; meta: ListMeta }> {
  const payload = await apiFetch<unknown>("/marketplace/disputes", {
    params: filters as Record<string, string | number | boolean | undefined>,
  });

  const disputes = extractList<Record<string, unknown>>(payload, ["disputes", "items"]);

  return {
    disputes,
    meta: extractListMeta(payload, disputes.length, filters?.per_page ?? 20),
  };
}

export async function assignDispute(disputeId: string, data: { moderator_id: string }) {
  return apiFetch(`/marketplace/disputes/${disputeId}/assign`, { method: "POST", body: data });
}

export async function resolveDispute(disputeId: string, data: Record<string, unknown>) {
  return apiFetch(`/marketplace/disputes/${disputeId}/resolve`, { method: "POST", body: data });
}

// Notification templates
export async function getTemplates(params?: {
  category?: string;
  is_active?: boolean;
  q?: string;
  page?: number;
  per_page?: number;
}): Promise<{ templates: Record<string, unknown>[]; meta: ListMeta }> {
  const payload = await apiFetch<unknown>("/notifications/admin/templates", {
    params: params as Record<string, string | number | boolean | undefined>,
  });

  const templates = extractList<Record<string, unknown>>(payload, ["templates", "items"]);

  return {
    templates,
    meta: extractListMeta(payload, templates.length, params?.per_page ?? 20),
  };
}

export async function createTemplate(data: {
  key: string;
  category: string;
  title_template: string;
  body_template: string;
  channels?: string[];
  priority?: string;
}) {
  return apiFetch("/notifications/admin/templates", { method: "POST", body: data });
}

export async function updateTemplate(id: number, data: Record<string, unknown>) {
  return apiFetch(`/notifications/admin/templates/${id}`, { method: "PATCH", body: data });
}

export async function previewTemplate(id: number, variables?: Record<string, string>) {
  return apiFetch(`/notifications/admin/templates/${id}/preview`, {
    method: "POST",
    body: { variables },
  });
}

export async function testTemplate(
  id: number,
  data: {
    user_id: number;
    channels?: string[];
    variables?: Record<string, string>;
  }
) {
  return apiFetch(`/notifications/admin/templates/${id}/test`, { method: "POST", body: data });
}

// Email templates
export async function getEmailTemplates(): Promise<{ templates: Record<string, unknown>[] }> {
  const payload = await apiFetch<unknown>("/notifications/admin/email-templates");
  return { templates: extractList<Record<string, unknown>>(payload, ["templates", "email_templates", "items"]) };
}

export async function previewEmailTemplate(key: string) {
  return apiFetch(`/notifications/admin/email-templates/${encodeURIComponent(key)}/preview`);
}

// Notification stats
export async function getNotificationStats(period?: string): Promise<Record<string, unknown>> {
  const payload = await apiFetch<unknown>("/notifications/admin/stats", { params: { period } });
  return extractRecord(payload);
}

// Broadcasts
export async function createBroadcast(data: {
  title: string;
  body: string;
  target: string;
  action_url?: string;
  channels?: string[];
  schedule_at?: string;
}) {
  return apiFetch("/notifications/admin/broadcast", { method: "POST", body: data });
}

export async function getBroadcasts(params?: {
  page?: number;
  per_page?: number;
}): Promise<{ broadcasts: Record<string, unknown>[]; meta: ListMeta }> {
  const payload = await apiFetch<unknown>("/notifications/admin/broadcasts", {
    params: params as Record<string, string | number | boolean | undefined>,
  });

  const broadcasts = extractList<Record<string, unknown>>(payload, ["broadcasts", "items"]);

  return {
    broadcasts,
    meta: extractListMeta(payload, broadcasts.length, params?.per_page ?? 20),
  };
}
