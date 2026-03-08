import { apiFetch } from "./client";
import type { MarketplaceConfig, UpdateMarketplaceConfigRequest } from "@/lib/types/marketplace";

export async function getMarketplaceConfig(): Promise<MarketplaceConfig> {
  const payload = await apiFetch<unknown>("/marketplace/config");
  if (typeof payload === "object" && payload !== null) {
    const root = payload as Record<string, unknown>;
    const data = root.data ?? root;
    if (typeof data === "object" && data !== null) {
      return data as MarketplaceConfig;
    }
  }
  return {};
}

export async function updateMarketplaceConfig(data: UpdateMarketplaceConfigRequest) {
  return apiFetch("/marketplace/config", { method: "PATCH", body: data });
}
