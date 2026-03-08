"use client";

import { useMutation } from "@tanstack/react-query";
import * as tournamentsApi from "@/lib/api/tournaments";
import type { RecalculateRatingsRequest } from "@/lib/types/tournament";

export function useRecalculateRatings() {
  return useMutation({
    mutationFn: (data: RecalculateRatingsRequest) =>
      tournamentsApi.recalculateRatings(data),
  });
}
