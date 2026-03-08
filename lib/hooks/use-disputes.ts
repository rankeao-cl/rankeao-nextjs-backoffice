"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as disputesApi from "@/lib/api/disputes";
import type { DisputeFilters, AssignDisputeRequest, ResolveDisputeRequest } from "@/lib/types/dispute";

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
