"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as tournamentsApi from "@/lib/api/tournaments";
import type { RecalculateRatingsRequest } from "@/lib/types/tournament";

export function useRecalculateRatings() {
  return useMutation({
    mutationFn: (data: RecalculateRatingsRequest) =>
      tournamentsApi.recalculateRatings(data),
  });
}

export function usePendingTournaments(params: { page?: number; per_page?: number }) {
  return useQuery({
    queryKey: ["tournaments", "pending", params],
    queryFn: () => tournamentsApi.listPendingTournaments(params),
  });
}

export function useApproveTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (publicId: string) => tournamentsApi.approveTournament(publicId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tournaments", "pending"] }),
  });
}

export function useRejectTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ publicId, reason }: { publicId: string; reason: string }) =>
      tournamentsApi.rejectTournament(publicId, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tournaments", "pending"] }),
  });
}
