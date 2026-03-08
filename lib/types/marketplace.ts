export interface ConfigEntry {
  key: string;
  value: string;
  value_type: string;
  description?: string;
  updated_at: string;
}

export type MarketplaceConfig = Record<string, ConfigEntry>;

export interface UpdateMarketplaceConfigRequest {
  values: Record<string, string>;
}
