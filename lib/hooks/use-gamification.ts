"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as gamificationApi from "@/lib/api/gamification";
import type {
  CreateBadgeRequest,
  UpdateBadgeRequest,
  GrantRequest,
  BulkGrantRequest,
  CreateCosmeticRequest,
  UpdateCosmeticRequest,
  CreateTitleRequest,
  UpdateTitleRequest,
  CreateXPEventRequest,
  UpdateXPEventRequest,
  CreateSeasonRequest,
} from "@/lib/types/gamification";

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export function useGamificationStats() {
  return useQuery({
    queryKey: ["gamification", "stats"],
    queryFn: gamificationApi.getGamificationStats,
  });
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

export function useBadges() {
  return useQuery({
    queryKey: ["badges"],
    queryFn: gamificationApi.listBadges,
  });
}

export function useCreateBadge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBadgeRequest) => gamificationApi.createBadge(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["badges"] }),
  });
}

export function useUpdateBadge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBadgeRequest }) =>
      gamificationApi.updateBadge(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["badges"] }),
  });
}

export function useGrantBadge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ badgeId, data }: { badgeId: string; data: GrantRequest }) =>
      gamificationApi.grantBadge(badgeId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["badges"] }),
  });
}

export function useRevokeBadge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ badgeId, data }: { badgeId: string; data: GrantRequest }) =>
      gamificationApi.revokeBadge(badgeId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["badges"] }),
  });
}

export function useBulkGrantBadge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ badgeId, data }: { badgeId: string; data: BulkGrantRequest }) =>
      gamificationApi.bulkGrantBadge(badgeId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["badges"] }),
  });
}

// ---------------------------------------------------------------------------
// Badge Categories
// ---------------------------------------------------------------------------

export function useCreateBadgeCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => gamificationApi.createBadgeCategory(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["badges"] }),
  });
}

export function useUpdateBadgeCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      gamificationApi.updateBadgeCategory(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["badges"] }),
  });
}

// ---------------------------------------------------------------------------
// Cosmetics
// ---------------------------------------------------------------------------

export function useCreateCosmetic() {
  return useMutation({
    mutationFn: (data: CreateCosmeticRequest) => gamificationApi.createCosmetic(data),
  });
}

export function useUpdateCosmetic() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCosmeticRequest }) =>
      gamificationApi.updateCosmetic(id, data),
  });
}

export function useGrantCosmetic() {
  return useMutation({
    mutationFn: ({ cosmeticId, data }: { cosmeticId: string; data: GrantRequest }) =>
      gamificationApi.grantCosmetic(cosmeticId, data),
  });
}

export function useRevokeCosmetic() {
  return useMutation({
    mutationFn: ({ cosmeticId, data }: { cosmeticId: string; data: GrantRequest }) =>
      gamificationApi.revokeCosmetic(cosmeticId, data),
  });
}

// ---------------------------------------------------------------------------
// Titles
// ---------------------------------------------------------------------------

export function useCreateTitle() {
  return useMutation({
    mutationFn: (data: CreateTitleRequest) => gamificationApi.createTitle(data),
  });
}

export function useUpdateTitle() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTitleRequest }) =>
      gamificationApi.updateTitle(id, data),
  });
}

export function useGrantTitle() {
  return useMutation({
    mutationFn: ({ titleId, data }: { titleId: string; data: GrantRequest }) =>
      gamificationApi.grantTitle(titleId, data),
  });
}

export function useRevokeTitle() {
  return useMutation({
    mutationFn: ({ titleId, data }: { titleId: string; data: GrantRequest }) =>
      gamificationApi.revokeTitle(titleId, data),
  });
}

// ---------------------------------------------------------------------------
// XP Events
// ---------------------------------------------------------------------------

export function useXPEvents() {
  return useQuery({
    queryKey: ["xp-events"],
    queryFn: gamificationApi.listXPEvents,
  });
}

export function useCreateXPEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateXPEventRequest) => gamificationApi.createXPEvent(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["xp-events"] }),
  });
}

export function useUpdateXPEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateXPEventRequest }) =>
      gamificationApi.updateXPEvent(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["xp-events"] }),
  });
}

// ---------------------------------------------------------------------------
// Levels
// ---------------------------------------------------------------------------

export function useBatchUpdateLevels() {
  return useMutation({
    mutationFn: (data: unknown) => gamificationApi.batchUpdateLevels(data),
  });
}

// ---------------------------------------------------------------------------
// Seasons
// ---------------------------------------------------------------------------

export function useCreateSeason() {
  return useMutation({
    mutationFn: (data: CreateSeasonRequest) => gamificationApi.createSeason(data),
  });
}

export function usePreviewSeasonClose() {
  return useMutation({
    mutationFn: (seasonId: string) => gamificationApi.previewSeasonClose(seasonId),
  });
}

export function useCloseSeason() {
  return useMutation({
    mutationFn: (seasonId: string) => gamificationApi.closeSeason(seasonId),
  });
}
