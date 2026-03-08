export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  city: string;
  region: string;
  country: string;
  logo_url?: string;
  is_public: boolean;
  created_at: string;
}
