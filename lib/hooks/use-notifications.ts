"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as notificationsApi from "@/lib/api/notifications";
import type {
  CreateTemplateRequest,
  UpdateTemplateRequest,
  TestTemplateRequest,
  CreateBroadcastRequest,
} from "@/lib/types/notification";

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export function useTemplates(params?: {
  category?: string;
  is_active?: boolean;
  q?: string;
  page?: number;
  per_page?: number;
}) {
  return useQuery({
    queryKey: ["templates", params],
    queryFn: () => notificationsApi.listTemplates(params),
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTemplateRequest) => notificationsApi.createTemplate(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTemplateRequest }) =>
      notificationsApi.updateTemplate(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
  });
}

export function usePreviewTemplate() {
  return useMutation({
    mutationFn: ({ id, variables }: { id: number; variables?: Record<string, string> }) =>
      notificationsApi.previewTemplate(id, variables),
  });
}

export function useTestTemplate() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TestTemplateRequest }) =>
      notificationsApi.testTemplate(id, data),
  });
}

// ---------------------------------------------------------------------------
// Broadcasts
// ---------------------------------------------------------------------------

export function useBroadcasts(params?: { page?: number; per_page?: number }) {
  return useQuery({
    queryKey: ["broadcasts", params],
    queryFn: () => notificationsApi.listBroadcasts(params),
  });
}

export function useCreateBroadcast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBroadcastRequest) => notificationsApi.createBroadcast(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["broadcasts"] }),
  });
}

// ---------------------------------------------------------------------------
// Email Templates
// ---------------------------------------------------------------------------

export function useEmailTemplates() {
  return useQuery({
    queryKey: ["email-templates"],
    queryFn: notificationsApi.listEmailTemplates,
  });
}

export function usePreviewEmailTemplate() {
  return useMutation({
    mutationFn: (key: string) => notificationsApi.previewEmailTemplate(key),
  });
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export function useNotificationStats(period?: string) {
  return useQuery({
    queryKey: ["notification-stats", period],
    queryFn: () => notificationsApi.getNotificationStats(period),
  });
}
