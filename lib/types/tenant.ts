export interface Tenant {
  id: number;
  public_id: string;
  slug: string;
  name: string;
  email: string;
  owner_id: number;
  plan: string;
  status: string;
  is_verified: boolean;
  is_public: boolean;
  staff_count: number;
  product_count: number;
  created_at: string;
}
