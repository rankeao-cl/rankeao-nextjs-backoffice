import { apiFetch, extractList, extractListMeta, internalFetch } from "./client";
import type {
  Dispute,
  DisputeFilters,
  AssignDisputeRequest,
  ResolveDisputeRequest,
  DuelDispute,
  MatchDispute,
  DuelDisputeFilters,
  MatchDisputeFilters,
  AdminResolveDuelRequest,
  AdminResolveMatchRequest,
} from "@/lib/types/dispute";
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

export async function listDisputedDuels(
  filters?: DuelDisputeFilters
): Promise<{ duels: DuelDispute[]; meta: ListMeta }> {
  const payload = await internalFetch<unknown>("/internal/social/duels/disputed", {
    params: filters as Record<string, string | number | boolean | undefined>,
  });
  const duels = extractList<DuelDispute>(payload, ["duels", "items"]);
  return {
    duels,
    meta: extractListMeta(payload, duels.length, filters?.per_page ?? 20),
  };
}

export async function adminResolveDuel(duelId: string, data: AdminResolveDuelRequest) {
  return internalFetch(`/internal/social/duels/${duelId}/resolve`, {
    method: "POST",
    body: data,
  });
}

export async function listDisputedMatches(
  filters?: MatchDisputeFilters
): Promise<{ matches: MatchDispute[]; meta: ListMeta }> {
  const payload = await internalFetch<unknown>("/internal/tournaments/matches/disputed", {
    params: filters as Record<string, string | number | boolean | undefined>,
  });
  const matches = extractList<MatchDispute>(payload, ["matches", "items"]);
  return {
    matches,
    meta: extractListMeta(payload, matches.length, filters?.per_page ?? 20),
  };
}

export async function adminResolveMatch(matchId: string, data: AdminResolveMatchRequest) {
  return internalFetch(`/internal/tournaments/matches/${matchId}/resolve`, {
    method: "POST",
    body: data,
  });
}
