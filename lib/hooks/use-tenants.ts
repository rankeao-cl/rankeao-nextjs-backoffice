"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as tenantsApi from "@/lib/api/tenants";

export function useTenants() {
  return useQuery({
    queryKey: ["tenants"],
    queryFn: tenantsApi.listTenants,
  });
}

export function useVerifyTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantsApi.verifyTenant(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tenants"] }),
  });
}

export function useRejectTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantsApi.rejectTenant(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tenants"] }),
  });
}

export function useSuspendTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantsApi.suspendTenant(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tenants"] }),
  });
}

export function useReactivateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantsApi.reactivateTenant(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tenants"] }),
  });
}
