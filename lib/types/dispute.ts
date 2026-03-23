export interface Dispute {
  id: string;
  order_id?: string;
  buyer_id?: string;
  seller_id?: string;
  status: string;
  reason?: string;
  description?: string;
  moderator_id?: string;
  resolution_outcome?: string;
  refund_amount?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface DisputeFilters {
  status?: string;
  reason?: string;
  assigned_moderator_id?: string;
  unassigned?: boolean;
  page?: number;
  per_page?: number;
}

export interface AssignDisputeRequest {
  moderator_id: string;
}

export interface ResolveDisputeRequest {
  outcome: string;
  refund_amount?: number;
  notes?: string;
  sanction?: string;
}

export interface DuelDispute {
  id: string;
  challenger_username: string;
  challenger_avatar?: string;
  challenged_username: string;
  challenged_avatar?: string;
  game_name: string;
  status: string;
  score_challenger: number;
  score_challenged: number;
  created_at: string;
  admin_notes?: string;
}

export interface MatchDispute {
  id: string;
  tournament_id: string;
  tournament_name: string;
  tournament_slug: string;
  round_number: number;
  player1?: { user_id: string; username: string };
  player2?: { user_id: string; username: string };
  player1_wins: number;
  player2_wins: number;
  draws: number;
  status: string;
  disputed_at?: string;
  dispute_notes?: string;
}

export interface DuelDisputeFilters {
  page?: number;
  per_page?: number;
}

export interface MatchDisputeFilters {
  page?: number;
  per_page?: number;
}

export interface AdminResolveDuelRequest {
  winner_id: string | null;
  admin_notes: string;
}

export interface AdminResolveMatchRequest {
  player1_wins: number;
  player2_wins: number;
  draws: number;
  notes: string;
}
