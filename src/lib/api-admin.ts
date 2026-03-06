// ─── Rankeao Admin API Client ──────────────────────────────────────────────────

const BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ??
    "https://rankeao-go-gateway-production.up.railway.app/api/v1";

// ─── Token helpers (localStorage) ──────────────────────────────────────────────

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

    // Keep middleware auth checks in sync (it reads token from cookie).
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

// ─── Generic fetch wrapper ─────────────────────────────────────────────────────

export class ApiError extends Error {
    status: number;
    code?: string;
    constructor(message: string, status: number, code?: string) {
        super(message);
        this.status = status;
        this.code = code;
    }
}

interface FetchOptions extends Omit<RequestInit, "body"> {
    body?: unknown;
    params?: Record<string, string | number | boolean | undefined>;
}

export async function apiFetch<T = unknown>(
    path: string,
    options: FetchOptions = {}
): Promise<T> {
    const { body, params, headers: extraHeaders, ...rest } = options;

    // Build URL with query params
    let url = `${BASE_URL}${path}`;
    if (params) {
        const searchParams = new URLSearchParams();
        for (const [key, val] of Object.entries(params)) {
            if (val !== undefined && val !== "") searchParams.set(key, String(val));
        }
        const qs = searchParams.toString();
        if (qs) url += `?${qs}`;
    }

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(extraHeaders as Record<string, string>),
    };

    const token = getToken();
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
        ...rest,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401) {
        clearTokens();
        if (typeof window !== "undefined") {
            window.location.href = "/admin/login";
        }
        throw new ApiError("Unauthorized", 401, "UNAUTHORIZED");
    }

    if (res.status === 403) {
        throw new ApiError("No autorizado — permisos insuficientes", 403, "FORBIDDEN");
    }

    if (!res.ok) {
        let msg = `Error ${res.status}`;
        try {
            const errBody = await res.json();
            msg = errBody.error || errBody.message || msg;
        } catch {
            /* empty */
        }
        throw new ApiError(msg, res.status);
    }

    // 204 No Content
    if (res.status === 204) return {} as T;

    return res.json() as Promise<T>;
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

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
    const asDirect = payload as AuthResponse;
    if (asDirect?.access_token && asDirect?.refresh_token && asDirect?.user) {
        return {
            ...asDirect,
            user: {
                ...asDirect.user,
                id: String(asDirect.user.id),
            },
        };
    }

    const envelope = payload as AuthPayload;
    const tokens = envelope.data?.tokens;
    const user = envelope.data?.user;

    if (!tokens?.access_token || !tokens?.refresh_token || !user?.id || !user?.email) {
        throw new ApiError("Respuesta de autenticacion invalida", 500, "INVALID_AUTH_RESPONSE");
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

export async function loginAdmin(
    email: string,
    password: string
): Promise<AuthResponse> {
    const raw = await apiFetch<AuthResponse | AuthPayload>("/auth/login", {
        method: "POST",
        body: { email, password },
    });
    return normalizeAuthResponse(raw);
}

export async function refreshToken(refreshTk: string) {
    const raw = await apiFetch<
        { access_token: string; refresh_token: string; expires_in: number } | AuthPayload
    >(
        "/auth/refresh",
        { method: "POST", body: { refresh_token: refreshTk } }
    );

    if ((raw as { access_token?: string }).access_token) {
        return raw as { access_token: string; refresh_token: string; expires_in: number };
    }

    const tokens = (raw as AuthPayload)?.data?.tokens;
    if (!tokens?.access_token || !tokens?.refresh_token) {
        throw new ApiError("Respuesta de refresh invalida", 500, "INVALID_REFRESH_RESPONSE");
    }

    return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in ?? 3600,
    };
}

// ─── Tenants ───────────────────────────────────────────────────────────────────

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
    return apiFetch("/admin/tenants");
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

// ─── Gamification Stats ────────────────────────────────────────────────────────

export async function getGamificationStats() {
    return apiFetch("/gamification/admin/stats");
}

// ─── Badges ────────────────────────────────────────────────────────────────────

export async function getBadges() {
    return apiFetch("/gamification/admin/badges");
}

export async function createBadge(data: Record<string, unknown>) {
    return apiFetch("/gamification/admin/badges", { method: "POST", body: data });
}

export async function updateBadge(id: string, data: Record<string, unknown>) {
    return apiFetch(`/gamification/admin/badges/${id}`, {
        method: "PATCH",
        body: data,
    });
}

export async function grantBadge(
    badgeId: string,
    data: { user_id: string; reason?: string }
) {
    return apiFetch(`/gamification/admin/badges/${badgeId}/grant`, {
        method: "POST",
        body: data,
    });
}

export async function revokeBadge(
    badgeId: string,
    data: { user_id: string; reason?: string }
) {
    return apiFetch(`/gamification/admin/badges/${badgeId}/revoke`, {
        method: "POST",
        body: data,
    });
}

export async function bulkGrantBadge(
    badgeId: string,
    data: { user_ids: string[] }
) {
    return apiFetch(`/gamification/admin/badges/${badgeId}/bulk-grant`, {
        method: "POST",
        body: data,
    });
}

// ─── Badge Categories ──────────────────────────────────────────────────────────

export async function createBadgeCategory(data: Record<string, unknown>) {
    return apiFetch("/gamification/admin/badge-categories", {
        method: "POST",
        body: data,
    });
}

export async function updateBadgeCategory(
    id: string,
    data: Record<string, unknown>
) {
    return apiFetch(`/gamification/admin/badge-categories/${id}`, {
        method: "PATCH",
        body: data,
    });
}

// ─── Cosmetics ─────────────────────────────────────────────────────────────────

export async function createCosmetic(data: Record<string, unknown>) {
    return apiFetch("/gamification/admin/cosmetics", {
        method: "POST",
        body: data,
    });
}

export async function updateCosmetic(
    id: string,
    data: Record<string, unknown>
) {
    return apiFetch(`/gamification/admin/cosmetics/${id}`, {
        method: "PATCH",
        body: data,
    });
}

export async function grantCosmetic(
    cosmeticId: string,
    data: { user_id: string; reason?: string }
) {
    return apiFetch(`/gamification/admin/cosmetics/${cosmeticId}/grant`, {
        method: "POST",
        body: data,
    });
}

export async function revokeCosmetic(
    cosmeticId: string,
    data: { user_id: string; reason?: string }
) {
    return apiFetch(`/gamification/admin/cosmetics/${cosmeticId}/revoke`, {
        method: "POST",
        body: data,
    });
}

// ─── Titles ────────────────────────────────────────────────────────────────────

export async function createTitle(data: Record<string, unknown>) {
    return apiFetch("/gamification/admin/titles", {
        method: "POST",
        body: data,
    });
}

export async function updateTitle(id: string, data: Record<string, unknown>) {
    return apiFetch(`/gamification/admin/titles/${id}`, {
        method: "PATCH",
        body: data,
    });
}

export async function grantTitle(
    titleId: string,
    data: { user_id: string; reason?: string }
) {
    return apiFetch(`/gamification/admin/titles/${titleId}/grant`, {
        method: "POST",
        body: data,
    });
}

export async function revokeTitle(
    titleId: string,
    data: { user_id: string; reason?: string }
) {
    return apiFetch(`/gamification/admin/titles/${titleId}/revoke`, {
        method: "POST",
        body: data,
    });
}

// ─── XP Events ─────────────────────────────────────────────────────────────────

export async function getXPEvents() {
    return apiFetch("/gamification/admin/xp-events");
}

export async function createXPEvent(data: Record<string, unknown>) {
    return apiFetch("/gamification/admin/xp-events", {
        method: "POST",
        body: data,
    });
}

export async function updateXPEvent(id: string, data: Record<string, unknown>) {
    return apiFetch(`/gamification/admin/xp-events/${id}`, {
        method: "PATCH",
        body: data,
    });
}

// ─── Levels ────────────────────────────────────────────────────────────────────

export async function batchUpdateLevels(data: Record<string, unknown>) {
    return apiFetch("/gamification/admin/levels", { method: "PUT", body: data });
}

// ─── Seasons ───────────────────────────────────────────────────────────────────

export async function createSeason(data: {
    name: string;
    starts_at: string;
    ends_at: string;
}) {
    return apiFetch("/gamification/admin/seasons", {
        method: "POST",
        body: data,
    });
}

export async function previewSeasonClose(seasonId: string) {
    return apiFetch(`/gamification/seasons/${seasonId}/preview-close`);
}

export async function closeSeason(
    seasonId: string,
    confirm: boolean = true
) {
    return apiFetch(`/gamification/seasons/${seasonId}/close`, {
        method: "POST",
        body: { confirm },
    });
}

// ─── Disputes ──────────────────────────────────────────────────────────────────

export async function getDisputes(filters?: {
    status?: string;
    reason?: string;
    page?: number;
    per_page?: number;
}) {
    return apiFetch("/marketplace/disputes", {
        params: filters as Record<string, string | number>,
    });
}

export async function assignDispute(
    disputeId: string,
    data: { moderator_id: string }
) {
    return apiFetch(`/marketplace/disputes/${disputeId}/assign`, {
        method: "POST",
        body: data,
    });
}

export async function resolveDispute(
    disputeId: string,
    data: Record<string, unknown>
) {
    return apiFetch(`/marketplace/disputes/${disputeId}/resolve`, {
        method: "POST",
        body: data,
    });
}

// ─── Notifications — Templates ─────────────────────────────────────────────────

export async function getTemplates(params?: {
    category?: string;
    is_active?: boolean;
    q?: string;
    page?: number;
    per_page?: number;
}) {
    return apiFetch("/notifications/admin/templates", {
        params: params as Record<string, string | number | boolean>,
    });
}

export async function createTemplate(data: {
    key: string;
    category: string;
    title_template: string;
    body_template: string;
    channels?: string[];
    priority?: string;
}) {
    return apiFetch("/notifications/admin/templates", {
        method: "POST",
        body: data,
    });
}

export async function updateTemplate(
    id: number,
    data: Record<string, unknown>
) {
    return apiFetch(`/notifications/admin/templates/${id}`, {
        method: "PATCH",
        body: data,
    });
}

export async function previewTemplate(
    id: number,
    variables?: Record<string, string>
) {
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
    return apiFetch(`/notifications/admin/templates/${id}/test`, {
        method: "POST",
        body: data,
    });
}

// ─── Notifications — Email Templates ───────────────────────────────────────────

export async function getEmailTemplates() {
    return apiFetch("/notifications/admin/email-templates");
}

export async function previewEmailTemplate(key: string) {
    return apiFetch(`/notifications/admin/email-templates/${key}/preview`);
}

// ─── Notifications — Stats ─────────────────────────────────────────────────────

export async function getNotificationStats(period?: string) {
    return apiFetch("/notifications/admin/stats", { params: { period } });
}

// ─── Notifications — Broadcasts ────────────────────────────────────────────────

export async function createBroadcast(data: {
    title: string;
    body: string;
    target: string;
    action_url?: string;
    channels?: string[];
    schedule_at?: string;
}) {
    return apiFetch("/notifications/admin/broadcast", {
        method: "POST",
        body: data,
    });
}

export async function getBroadcasts(params?: {
    page?: number;
    per_page?: number;
}) {
    return apiFetch("/notifications/admin/broadcasts", {
        params: params as Record<string, string | number>,
    });
}
