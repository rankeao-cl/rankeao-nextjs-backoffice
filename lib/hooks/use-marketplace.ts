"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as marketplaceApi from "@/lib/api/marketplace";
import type { UpdateMarketplaceConfigRequest } from "@/lib/types/marketplace";

export function useMarketplaceConfig() {
  return useQuery({
    queryKey: ["marketplace", "config"],
    queryFn: marketplaceApi.getMarketplaceConfig,
  });
}

export function useUpdateMarketplaceConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateMarketplaceConfigRequest) =>
      marketplaceApi.updateMarketplaceConfig(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["marketplace", "config"] }),
  });
}
