export interface Badge {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  rarity?: string;
  category_id?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface BadgeCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  sort_order?: number;
}

export interface CreateBadgeRequest {
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  rarity?: string;
  category_id?: string;
}

export interface UpdateBadgeRequest {
  name?: string;
  description?: string;
  icon?: string;
  rarity?: string;
  category_id?: string;
  is_active?: boolean;
}

export interface GrantRequest {
  user_id: string;
  reason?: string;
}

export interface BulkGrantRequest {
  user_ids: string[];
}

export interface Cosmetic {
  id: string;
  slug: string;
  name: string;
  type: string;
  asset_url?: string;
  rarity?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface CreateCosmeticRequest {
  slug: string;
  name: string;
  type: string;
  asset_url?: string;
  rarity?: string;
}

export interface UpdateCosmeticRequest {
  name?: string;
  type?: string;
  asset_url?: string;
  rarity?: string;
  is_active?: boolean;
}

export interface Title {
  id: string;
  slug: string;
  name: string;
  color?: string;
  season_id?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface CreateTitleRequest {
  slug: string;
  name: string;
  color?: string;
  season_id?: string;
}

export interface UpdateTitleRequest {
  name?: string;
  color?: string;
  season_id?: string;
  is_active?: boolean;
}

export interface XPEvent {
  id: string;
  event_key: string;
  xp_amount: number;
  cooldown_minutes?: number;
  max_per_day?: number;
  is_active: boolean;
  created_at?: string;
}

export interface CreateXPEventRequest {
  event_key: string;
  xp_amount: number;
  cooldown_minutes?: number;
  max_per_day?: number;
}

export interface UpdateXPEventRequest {
  event_key?: string;
  xp_amount?: number;
  cooldown_minutes?: number;
  max_per_day?: number;
  is_active?: boolean;
}

export interface Level {
  level: number;
  xp_required: number;
  title?: string;
  perks?: string[];
}

export interface Season {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  status?: string;
  created_at?: string;
}

export interface CreateSeasonRequest {
  name: string;
  starts_at: string;
  ends_at: string;
}

export interface GamificationStats {
  total_xp_granted?: number;
  total_badges_earned?: number;
  total_titles_earned?: number;
  total_cosmetics_granted?: number;
  xp_events_today?: number;
  [key: string]: unknown;
}
