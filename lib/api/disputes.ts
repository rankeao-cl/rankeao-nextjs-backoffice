import { apiFetch, extractList, extractListMeta } from "./client";
import type { Dispute, DisputeFilters, AssignDisputeRequest, ResolveDisputeRequest } from "@/lib/types/dispute";
import type { ListMeta } from "@/lib/types/api";

export async function listDisputes(
  filters?: DisputeFilters
): Promise<{ disputes: Dispute[]; meta: ListMeta }> {
  const payload = await apiFetch<unknown>("/marketplace/disputes", {
    params: filters as Record<string, string | number | boolean | undefined>,
  });

  const disputes = extractList<Dispute>(payload, ["disputes", "items"]);
  return {
    disputes,
    meta: extractListMeta(payload, disputes.length, filters?.per_page ?? 20),
  };
}

export async function assignDispute(disputeId: string, data: AssignDisputeRequest) {
  return apiFetch(`/marketplace/disputes/${disputeId}/assign`, { method: "POST", body: data });
}

export async function resolveDispute(disputeId: string, data: ResolveDisputeRequest) {
  return apiFetch(`/marketplace/disputes/${disputeId}/resolve`, { method: "POST", body: data });
}
