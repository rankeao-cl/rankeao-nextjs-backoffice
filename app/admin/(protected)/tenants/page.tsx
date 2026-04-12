"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useTenants,
  useVerifyTenant,
  useRejectTenant,
  useSuspendTenant,
  useReactivateTenant,
} from "@/lib/hooks/use-tenants";
import type { Tenant } from "@/lib/types/tenant";
import { getErrorMessage } from "@/lib/utils/error-message";
import { Store } from "lucide-react";

type TenantAction = "verify" | "reject" | "suspend" | "reactivate";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activo",
  PENDING_REVIEW: "Pendiente",
  SUSPENDED: "Suspendido",
  REJECTED: "Rechazado",
};

const TABLE_COLUMNS = [
  { key: "tenant", label: "TENANT" },
  { key: "email", label: "EMAIL" },
  { key: "plan", label: "PLAN" },
  { key: "status", label: "ESTADO" },
  { key: "created", label: "CREACION" },
  { key: "actions", label: "ACCIONES" },
] as const;

const actionLabels: Record<TenantAction, string> = {
  verify: "Verificar",
  reject: "Rechazar",
  suspend: "Suspender",
  reactivate: "Reactivar",
};

export default function TenantsPage() {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [actionTarget, setActionTarget] = useState<{
    tenant: Tenant;
    action: TenantAction;
  } | null>(null);

  const { data: tenants = [], isLoading } = useTenants();

  const verifyMutation = useVerifyTenant();
  const rejectMutation = useRejectTenant();
  const suspendMutation = useSuspendTenant();
  const reactivateMutation = useReactivateTenant();

  const filteredTenants = tenants.filter((tenant) => {
    const q = search.toLowerCase();
    return (
      tenant.name?.toLowerCase().includes(q) ||
      tenant.email?.toLowerCase().includes(q) ||
      tenant.slug?.toLowerCase().includes(q)
    );
  });

  const openAction = (tenant: Tenant, action: TenantAction) => {
    setActionTarget({ tenant, action });
    setIsOpen(true);
  };

  const closeAction = () => {
    setIsOpen(false);
  };

  const executeAction = () => {
    if (!actionTarget) return;

    const { tenant, action } = actionTarget;
    const mutationMap: Record<TenantAction, typeof verifyMutation> = {
      verify: verifyMutation,
      reject: rejectMutation,
      suspend: suspendMutation,
      reactivate: reactivateMutation,
    };

    mutationMap[action].mutate(String(tenant.id), {
      onSuccess: () => {
        toast.success(`Tenant "${tenant.name}" actualizado`);
        closeAction();
      },
      onError: (error: unknown) => {
        toast.error(getErrorMessage(error));
      },
    });
  };

  const actionLoading =
    verifyMutation.isPending ||
    rejectMutation.isPending ||
    suspendMutation.isPending ||
    reactivateMutation.isPending;

  const renderCell = (tenant: Tenant, columnKey: string) => {
    switch (columnKey) {
      case "tenant":
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 bg-[var(--default)] text-[var(--foreground)]">
              <AvatarImage src={undefined} alt={tenant.name ?? ""} />
              <AvatarFallback>
                {tenant.name?.[0] ? tenant.name[0].toUpperCase() : <Store className="h-4 w-4" aria-hidden="true" />}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-[var(--foreground)]">{tenant.name}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{tenant.slug}</p>
            </div>
          </div>
        );
      case "email":
        return (
          <span className="text-sm text-[var(--muted-foreground)]">{tenant.email}</span>
        );
      case "plan":
        return (
          <Badge variant="default" className="text-xs">
            {tenant.plan}
          </Badge>
        );
      case "status":
        return (
          <Badge variant="default" className="text-xs">
            {STATUS_LABELS[tenant.status] || tenant.status}
          </Badge>
        );
      case "created":
        return (
          <span className="text-xs text-[var(--muted-foreground)]">
            {tenant.created_at ? new Date(tenant.created_at).toLocaleDateString("es-CL") : "-"}
          </span>
        );
      case "actions":
        return (
          <div className="flex gap-1">
            {tenant.status === "PENDING_REVIEW" && (
              <>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => openAction(tenant, "verify")}
                >
                  Verificar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => openAction(tenant, "reject")}
                >
                  Rechazar
                </Button>
              </>
            )}
            {tenant.status === "ACTIVE" && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => openAction(tenant, "suspend")}
              >
                Suspender
              </Button>
            )}
            {tenant.status === "SUSPENDED" && (
              <Button
                size="sm"
                variant="default"
                onClick={() => openAction(tenant, "reactivate")}
              >
                Reactivar
              </Button>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-brand">
            Tiendas
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Gestion de tiendas registradas</p>
        </div>
      </div>

      {/* Search filter card */}
      <div className="rounded-lg border border-[var(--c-gray-200)] bg-white">
        <div className="px-5 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1 flex flex-col min-w-[200px] flex-1">
              <Label className="text-xs text-[var(--muted-foreground)]">Busqueda</Label>
              <Input
                placeholder="Nombre, slug o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="rounded-lg border border-[var(--c-gray-200)] bg-white">
        <div className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-full rounded" />
                    <Skeleton className="h-3 w-3/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[var(--c-gray-50)]">
                  <tr>
                    {TABLE_COLUMNS.map((column) => (
                      <th key={column.key} className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredTenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-[var(--surface-secondary)] transition-colors">
                      {TABLE_COLUMNS.map((column) => (
                        <td key={column.key} className="px-4 py-3">
                          {renderCell(tenant, column.key)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {filteredTenants.length === 0 && (
                    <tr>
                      <td colSpan={TABLE_COLUMNS.length} className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                        No se encontraron tiendas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={closeAction}
          />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white border border-[var(--c-gray-200)] shadow-elevated p-6">
            <h2 className="text-base font-semibold text-[var(--foreground)] mb-2">
              {actionTarget ? `¿${actionLabels[actionTarget.action]} tenant?` : "Confirmar"}
            </h2>
            <p className="text-[var(--muted-foreground)] text-sm mb-6">
              Esta accion cambiara el estado de{" "}
              <strong className="text-[var(--foreground)]">{actionTarget?.tenant.name}</strong>.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={closeAction}>
                Cancelar
              </Button>
              <Button
                variant="default"
                onClick={executeAction}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--c-gray-200)] border-t-[var(--c-navy-500)]" />
                    Procesando...
                  </span>
                ) : (
                  "Confirmar"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
