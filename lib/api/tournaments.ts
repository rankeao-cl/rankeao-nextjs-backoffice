import { apiFetch } from "./client";
import type { RecalculateRatingsRequest, RecalculateRatingsResponse } from "@/lib/types/tournament";

export async function recalculateRatings(data: RecalculateRatingsRequest): Promise<RecalculateRatingsResponse> {
  return apiFetch<RecalculateRatingsResponse>("/admin/tournaments/ratings/recalculate", {
    method: "POST",
    body: data,
  });
}
