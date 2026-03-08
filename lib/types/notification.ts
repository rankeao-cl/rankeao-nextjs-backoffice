export interface Template {
  id: number;
  key: string;
  category: string;
  title_template: string;
  body_template: string;
  channels: string[];
  priority: string;
  is_active: boolean;
  created_at?: string;
  [key: string]: unknown;
}

export interface CreateTemplateRequest {
  key: string;
  category: string;
  title_template: string;
  body_template: string;
  channels?: string[];
  priority?: string;
}

export interface UpdateTemplateRequest {
  title_template?: string;
  body_template?: string;
  channels?: string[];
  priority?: string;
  is_active?: boolean;
}

export interface PreviewTemplateRequest {
  variables?: Record<string, string>;
}

export interface TestTemplateRequest {
  user_id: number;
  channels?: string[];
  variables?: Record<string, string>;
}

export interface Broadcast {
  id: string;
  public_id?: string;
  title: string;
  body: string;
  target: string;
  action_url?: string;
  channels: string[];
  priority?: string;
  status: string;
  scheduled_at?: string;
  sent_at?: string;
  recipients?: number;
  read_count?: number;
  created_at?: string;
  [key: string]: unknown;
}

export interface CreateBroadcastRequest {
  title: string;
  body: string;
  target: string;
  action_url?: string;
  channels?: string[];
  schedule_at?: string;
}

export interface EmailTemplate {
  id?: number;
  key: string;
  category?: string;
  title?: string;
  body?: string;
  [key: string]: unknown;
}

export interface NotificationStats {
  sent_24h?: number;
  read_rate?: number;
  by_channel?: Record<string, number>;
  by_category?: Record<string, number>;
  by_priority?: Record<string, number>;
  [key: string]: unknown;
}
