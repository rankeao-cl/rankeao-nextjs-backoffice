import { apiFetch, extractList, extractListMeta, extractRecord } from "./client";
import type {
  Template,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  TestTemplateRequest,
  Broadcast,
  CreateBroadcastRequest,
  EmailTemplate,
  NotificationStats,
} from "@/lib/types/notification";
import type { ListMeta } from "@/lib/types/api";

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export async function listTemplates(params?: {
  category?: string;
  is_active?: boolean;
  q?: string;
  page?: number;
  per_page?: number;
}): Promise<{ templates: Template[]; meta: ListMeta }> {
  const payload = await apiFetch<unknown>("/notifications/admin/templates", {
    params: params as Record<string, string | number | boolean | undefined>,
  });

  const templates = extractList<Template>(payload, ["templates", "items"]);
  return {
    templates,
    meta: extractListMeta(payload, templates.length, params?.per_page ?? 20),
  };
}

export async function createTemplate(data: CreateTemplateRequest) {
  return apiFetch("/notifications/admin/templates", { method: "POST", body: data });
}

export async function updateTemplate(id: number, data: UpdateTemplateRequest) {
  return apiFetch(`/notifications/admin/templates/${id}`, { method: "PATCH", body: data });
}

export async function previewTemplate(id: number, variables?: Record<string, string>) {
  return apiFetch(`/notifications/admin/templates/${id}/preview`, {
    method: "POST",
    body: { variables },
  });
}

export async function testTemplate(id: number, data: TestTemplateRequest) {
  return apiFetch(`/notifications/admin/templates/${id}/test`, { method: "POST", body: data });
}

// ---------------------------------------------------------------------------
// Broadcasts
// ---------------------------------------------------------------------------

export async function listBroadcasts(params?: {
  page?: number;
  per_page?: number;
}): Promise<{ broadcasts: Broadcast[]; meta: ListMeta }> {
  const payload = await apiFetch<unknown>("/notifications/admin/broadcasts", {
    params: params as Record<string, string | number | boolean | undefined>,
  });

  const broadcasts = extractList<Broadcast>(payload, ["broadcasts", "items"]);
  return {
    broadcasts,
    meta: extractListMeta(payload, broadcasts.length, params?.per_page ?? 20),
  };
}

export async function createBroadcast(data: CreateBroadcastRequest) {
  return apiFetch("/notifications/admin/broadcast", { method: "POST", body: data });
}

// ---------------------------------------------------------------------------
// Email Templates
// ---------------------------------------------------------------------------

export async function listEmailTemplates(): Promise<EmailTemplate[]> {
  const payload = await apiFetch<unknown>("/notifications/admin/email-templates");
  return extractList<EmailTemplate>(payload, ["templates", "email_templates", "items"]);
}

export async function previewEmailTemplate(key: string) {
  return apiFetch(`/notifications/admin/email-templates/${encodeURIComponent(key)}/preview`);
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export async function getNotificationStats(period?: string): Promise<NotificationStats> {
  const payload = await apiFetch<unknown>("/notifications/admin/stats", { params: { period } });
  return extractRecord(payload) as NotificationStats;
}
