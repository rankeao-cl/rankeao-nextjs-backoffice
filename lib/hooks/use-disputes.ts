"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as disputesApi from "@/lib/api/disputes";
import type {
  DisputeFilters,
  AssignDisputeRequest,
  ResolveDisputeRequest,
  DuelDisputeFilters,
  MatchDisputeFilters,
  AdminResolveDuelRequest,
  AdminResolveMatchRequest,
} from "@/lib/types/dispute";

export function useDisputes(filters?: DisputeFilters) {
  return useQuery({
    queryKey: ["disputes", filters],
    queryFn: () => disputesApi.listDisputes(filters),
  });
}

export function useAssignDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ disputeId, data }: { disputeId: string; data: AssignDisputeRequest }) =>
      disputesApi.assignDispute(disputeId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["disputes"] }),
  });
}

export function useResolveDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ disputeId, data }: { disputeId: string; data: ResolveDisputeRequest }) =>
      disputesApi.resolveDispute(disputeId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["disputes"] }),
  });
}

export function useDisputedDuels(filters?: DuelDisputeFilters) {
  return useQuery({
    queryKey: ["disputed-duels", filters],
    queryFn: () => disputesApi.listDisputedDuels(filters),
  });
}

export function useAdminResolveDuel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ duelId, data }: { duelId: string; data: AdminResolveDuelRequest }) =>
      disputesApi.adminResolveDuel(duelId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["disputed-duels"] }),
  });
}

export function useDisputedMatches(filters?: MatchDisputeFilters) {
  return useQuery({
    queryKey: ["disputed-matches", filters],
    queryFn: () => disputesApi.listDisputedMatches(filters),
  });
}

export function useAdminResolveMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ matchId, data }: { matchId: string; data: AdminResolveMatchRequest }) =>
      disputesApi.adminResolveMatch(matchId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["disputed-matches"] }),
  });
}
