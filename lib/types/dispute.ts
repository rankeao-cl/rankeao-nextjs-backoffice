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
