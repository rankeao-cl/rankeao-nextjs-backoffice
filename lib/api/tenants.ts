import { apiFetch, extractList } from "./client";
import type { Tenant } from "@/lib/types/tenant";

export async function listTenants(): Promise<Tenant[]> {
  const payload = await apiFetch<unknown>("/admin/tenants");
  return extractList<Tenant>(payload, ["tenants", "items"]);
}

export async function verifyTenant(id: string) {
  return apiFetch(`/admin/tenants/${id}/verify`, { method: "POST" });
}

export async function rejectTenant(id: string) {
  return apiFetch(`/admin/tenants/${id}/reject`, { method: "POST" });
}

export async function suspendTenant(id: string) {
  return apiFetch(`/admin/tenants/${id}/suspend`, { method: "POST" });
}

export async function reactivateTenant(id: string) {
  return apiFetch(`/admin/tenants/${id}/reactivate`, { method: "POST" });
}
