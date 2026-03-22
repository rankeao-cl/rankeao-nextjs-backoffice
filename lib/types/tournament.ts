export interface RecalculateRatingsRequest {
  tournament_id: number;
  reason?: string;
}

export interface RecalculateRatingsResponse {
  status: string;
  tournament_id: number;
}

export interface TournamentListItem {
  id: string;
  name: string;
  slug: string;
  banner_url?: string;
  logo_url?: string;
  origin: string;
  status: string;
  visibility: string;
  modality: string;
  format_type: string;
  tier: string;
  is_ranked: boolean;
  current_players: number;
  max_players?: number;
  entry_fee: number;
  currency: string;
  city?: string;
  region?: string;
  starts_at: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface TournamentsListResponse {
  tournaments: TournamentListItem[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}
