export interface RecalculateRatingsRequest {
  tournament_id: number;
  reason?: string;
}

export interface RecalculateRatingsResponse {
  status: string;
  tournament_id: number;
}
