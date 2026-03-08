import { apiFetch, extractList, extractRecord } from "./client";
import type {
  Badge,
  CreateBadgeRequest,
  UpdateBadgeRequest,
  GrantRequest,
  BulkGrantRequest,
  Cosmetic,
  CreateCosmeticRequest,
  UpdateCosmeticRequest,
  Title,
  CreateTitleRequest,
  UpdateTitleRequest,
  XPEvent,
  CreateXPEventRequest,
  UpdateXPEventRequest,
  Season,
  CreateSeasonRequest,
  GamificationStats,
} from "@/lib/types/gamification";

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export async function getGamificationStats(): Promise<GamificationStats> {
  const payload = await apiFetch<unknown>("/gamification/admin/stats");
  return extractRecord(payload) as GamificationStats;
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

export async function listBadges(): Promise<Badge[]> {
  const payload = await apiFetch<unknown>("/gamification/admin/badges");
  return extractList<Badge>(payload, ["badges", "items"]);
}

export async function createBadge(data: CreateBadgeRequest) {
  return apiFetch("/gamification/admin/badges", { method: "POST", body: data });
}

export async function updateBadge(id: string, data: UpdateBadgeRequest) {
  return apiFetch(`/gamification/admin/badges/${id}`, { method: "PATCH", body: data });
}

export async function grantBadge(badgeId: string, data: GrantRequest) {
  return apiFetch(`/gamification/admin/badges/${badgeId}/grant`, { method: "POST", body: data });
}

export async function revokeBadge(badgeId: string, data: GrantRequest) {
  return apiFetch(`/gamification/admin/badges/${badgeId}/revoke`, { method: "POST", body: data });
}

export async function bulkGrantBadge(badgeId: string, data: BulkGrantRequest) {
  return apiFetch(`/gamification/admin/badges/${badgeId}/bulk-grant`, { method: "POST", body: data });
}

// ---------------------------------------------------------------------------
// Badge Categories
// ---------------------------------------------------------------------------

export async function createBadgeCategory(data: Record<string, unknown>) {
  return apiFetch("/gamification/admin/badge-categories", { method: "POST", body: data });
}

export async function updateBadgeCategory(id: string, data: Record<string, unknown>) {
  return apiFetch(`/gamification/admin/badge-categories/${id}`, { method: "PATCH", body: data });
}

// ---------------------------------------------------------------------------
// Cosmetics
// ---------------------------------------------------------------------------

export async function listCosmetics(params?: {
  type?: string;
  rarity?: string;
  page?: number;
  per_page?: number;
}): Promise<{ items: Cosmetic[]; meta: { page: number; page_size: number; total: number; total_pages: number } }> {
  const payload = await apiFetch<unknown>("/gamification/admin/cosmetics", { params });
  const items = extractList<Cosmetic>(payload, ["cosmetics", "items", "data"]);
  const meta = (payload as Record<string, unknown>)?.meta as { page: number; page_size: number; total: number; total_pages: number } | undefined;
  return { items, meta: meta ?? { page: 1, page_size: 20, total: items.length, total_pages: 1 } };
}

export async function createCosmetic(data: CreateCosmeticRequest) {
  return apiFetch("/gamification/admin/cosmetics", { method: "POST", body: data });
}

export async function updateCosmetic(id: string, data: UpdateCosmeticRequest) {
  return apiFetch(`/gamification/admin/cosmetics/${id}`, { method: "PATCH", body: data });
}

export async function grantCosmetic(cosmeticId: string, data: GrantRequest) {
  return apiFetch(`/gamification/admin/cosmetics/${cosmeticId}/grant`, { method: "POST", body: data });
}

export async function revokeCosmetic(cosmeticId: string, data: GrantRequest) {
  return apiFetch(`/gamification/admin/cosmetics/${cosmeticId}/revoke`, { method: "POST", body: data });
}

// ---------------------------------------------------------------------------
// Titles (public list endpoint)
// ---------------------------------------------------------------------------

export async function listTitles(params?: {
  type?: string;
  season_id?: string;
  page?: number;
  per_page?: number;
}): Promise<Title[]> {
  const payload = await apiFetch<unknown>("/gamification/titles", { params });
  return extractList<Title>(payload, ["titles", "items", "data"]);
}

export async function createTitle(data: CreateTitleRequest) {
  return apiFetch("/gamification/admin/titles", { method: "POST", body: data });
}

export async function updateTitle(id: string, data: UpdateTitleRequest) {
  return apiFetch(`/gamification/admin/titles/${id}`, { method: "PATCH", body: data });
}

export async function grantTitle(titleId: string, data: GrantRequest) {
  return apiFetch(`/gamification/admin/titles/${titleId}/grant`, { method: "POST", body: data });
}

export async function revokeTitle(titleId: string, data: GrantRequest) {
  return apiFetch(`/gamification/admin/titles/${titleId}/revoke`, { method: "POST", body: data });
}

// ---------------------------------------------------------------------------
// XP Events
// ---------------------------------------------------------------------------

export async function listXPEvents(): Promise<XPEvent[]> {
  const payload = await apiFetch<unknown>("/gamification/admin/xp-events");
  return extractList<XPEvent>(payload, ["events", "xp_events", "items"]);
}

export async function createXPEvent(data: CreateXPEventRequest) {
  return apiFetch("/gamification/admin/xp-events", { method: "POST", body: data });
}

export async function updateXPEvent(id: string, data: UpdateXPEventRequest) {
  return apiFetch(`/gamification/admin/xp-events/${id}`, { method: "PATCH", body: data });
}

// ---------------------------------------------------------------------------
// Levels
// ---------------------------------------------------------------------------

export async function batchUpdateLevels(data: unknown) {
  return apiFetch("/gamification/admin/levels", { method: "PUT", body: data });
}

// ---------------------------------------------------------------------------
// Seasons (public list endpoint)
// ---------------------------------------------------------------------------

export async function listSeasons(): Promise<Season[]> {
  const payload = await apiFetch<unknown>("/gamification/seasons");
  return extractList<Season>(payload, ["seasons", "items", "data"]);
}

export async function createSeason(data: CreateSeasonRequest) {
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
