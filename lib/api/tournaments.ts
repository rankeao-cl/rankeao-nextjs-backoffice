import { apiFetch, extractList, extractListMeta } from "./client";
import type {
  RecalculateRatingsRequest,
  RecalculateRatingsResponse,
  TournamentsListResponse,
  TournamentListItem,
} from "@/lib/types/tournament";
import type { ListMeta } from "@/lib/types/api";

export async function recalculateRatings(data: RecalculateRatingsRequest): Promise<RecalculateRatingsResponse> {
  return apiFetch<RecalculateRatingsResponse>("/admin/tournaments/ratings/recalculate", {
    method: "POST",
    body: data,
  });
}

export async function listPendingTournaments(params: {
  page?: number;
  per_page?: number;
}): Promise<{ tournaments: TournamentListItem[]; meta: ListMeta }> {
  const perPage = params.per_page ?? 20;
  const payload = await apiFetch<unknown>("/tournaments", {
    params: {
      status: "PENDING_APPROVAL",
      sort: "created_at_desc",
      page: params.page ?? 1,
      per_page: perPage,
    },
  });
  const tournaments = extractList<TournamentListItem>(payload, ["tournaments", "items"]);
  return {
    tournaments,
    meta: extractListMeta(payload, tournaments.length, perPage),
  };
}

export async function approveTournament(publicId: string): Promise<{ tournament: TournamentListItem }> {
  return apiFetch<{ tournament: TournamentListItem }>(`/tournaments/${publicId}/approve`, {
    method: "POST",
  });
}

export async function rejectTournament(
  publicId: string,
  reason: string
): Promise<{ tournament: TournamentListItem }> {
  return apiFetch<{ tournament: TournamentListItem }>(`/tournaments/${publicId}/reject`, {
    method: "POST",
    body: { reason },
  });
}
