"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Avatar,
  Button,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalDialog,
  ModalFooter,
  ModalHeader,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import {
  getTenants,
  reactivateTenant,
  rejectTenant,
  suspendTenant,
  type Tenant,
  verifyTenant,
} from "@/lib/api-admin";
import { getTableColumnKey } from "@/lib/table-column-key";
import { useDisclosure } from "@/hooks/use-disclosure";
import { Store } from "lucide-react";
import { toast } from "sonner";

type TenantAction = "verify" | "reject" | "suspend" | "reactivate";

const STATUS_COLOR: Record<string, "default"> = {
  active: "default",
  pending: "default",
  suspended: "default",
  rejected: "default",
};

const TABLE_COLUMNS = [
  { key: "tenant", label: "TENANT" },
  { key: "city", label: "CIUDAD" },
  { key: "status", label: "ESTADO" },
  { key: "created", label: "CREACION" },
  { key: "actions", label: "ACCIONES" },
] as const;

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [actionTarget, setActionTarget] = useState<{
    tenant: Tenant;
    action: TenantAction;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTenants();
      setTenants(res.tenants || []);
    } catch {
      toast.error("Error al cargar tenants");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const filteredTenants = tenants.filter((tenant) => {
    const q = search.toLowerCase();
    return (
      tenant.name?.toLowerCase().includes(q) ||
      tenant.city?.toLowerCase().includes(q) ||
      tenant.slug?.toLowerCase().includes(q)
    );
  });

  const openAction = (tenant: Tenant, action: TenantAction) => {
    setActionTarget({ tenant, action });
    onOpen();
  };

  const executeAction = async () => {
    if (!actionTarget) return;

    setActionLoading(true);
    try {
      const { tenant, action } = actionTarget;
      const actionMap: Record<TenantAction, () => Promise<unknown>> = {
        verify: () => verifyTenant(tenant.id),
        reject: () => rejectTenant(tenant.id),
        suspend: () => suspendTenant(tenant.id),
        reactivate: () => reactivateTenant(tenant.id),
      };

      await actionMap[action]();
      toast.success(`Tenant \"${tenant.name}\" actualizado`);
      onClose();
      fetchTenants();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Error");
    } finally {
      setActionLoading(false);
    }
  };

  const actionLabels: Record<TenantAction, string> = {
    verify: "Verificar",
    reject: "Rechazar",
    suspend: "Suspender",
    reactivate: "Reactivar",
  };

  const renderCell = (tenant: Tenant, columnKey: string) => {
    switch (columnKey) {
      case "tenant":
        return (
          <div className="flex items-center gap-3">
            <Avatar
              size="sm"
              className="bg-white/10 text-zinc-200"
            >
              {tenant.logo_url ? <Avatar.Image src={tenant.logo_url} alt={tenant.name} /> : null}
              <Avatar.Fallback>
                {tenant.name?.[0] ? tenant.name[0].toUpperCase() : <Store className="h-4 w-4" />}
              </Avatar.Fallback>
            </Avatar>
            <div>
              <p className="font-medium text-zinc-200">{tenant.name}</p>
              <p className="text-xs text-zinc-500">{tenant.slug}</p>
            </div>
          </div>
        );
      case "city":
        return (
          <span className="text-zinc-400">
            {tenant.city}
            {tenant.region ? `, ${tenant.region}` : ""}
          </span>
        );
      case "status":
        return (
          <Chip size="sm" color={STATUS_COLOR[tenant.status] || "default"} variant="soft">
            {tenant.status}
          </Chip>
        );
      case "created":
        return (
          <span className="text-xs text-zinc-500">
            {tenant.created_at ? new Date(tenant.created_at).toLocaleDateString("es-CL") : "-"}
          </span>
        );
      case "actions":
        return (
          <div className="flex gap-1">
            {tenant.status === "pending" && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => openAction(tenant, "verify")}
                >
                  Verificar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => openAction(tenant, "reject")}
                >
                  Rechazar
                </Button>
              </>
            )}
            {tenant.status === "active" && (
              <Button
                size="sm"
                variant="ghost"
                onPress={() => openAction(tenant, "suspend")}
              >
                Suspender
              </Button>
            )}
            {tenant.status === "suspended" && (
              <Button
                size="sm"
                variant="ghost"
                onPress={() => openAction(tenant, "reactivate")}
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
          <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-purple-cyan">
            Tenants
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Gestion de tiendas registradas</p>
        </div>
        <Input
          placeholder="Buscar por nombre, slug o ciudad..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-72"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" color="current" />
        </div>
      ) : (
        <Table>
          <Table.Content aria-label="Tenants table">
            <TableHeader columns={TABLE_COLUMNS}>
              {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
            </TableHeader>
            <TableBody items={filteredTenants}>
              {(tenant) => (
                <TableRow key={tenant.id}>
                  {(column) => <TableCell>{renderCell(tenant, getTableColumnKey(column))}</TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table.Content>
        </Table>
      )}

      <Modal
        isOpen={isOpen}
        onOpenChange={(isOpen) => !isOpen && onClose()}
      >
        <ModalDialog>
          <ModalHeader>
            {actionTarget ? `¿${actionLabels[actionTarget.action]} tenant?` : "Confirmar"}
          </ModalHeader>
          <ModalBody>
            <p className="text-zinc-400 text-sm">
              Esta accion cambiara el estado de
              <strong className="text-zinc-200"> {actionTarget?.tenant.name}</strong>.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onPress={onClose}>
              Cancelar
            </Button>
            <Button onPress={executeAction} isPending={actionLoading}>
              Confirmar
            </Button>
          </ModalFooter>
        </ModalDialog>
      </Modal>
    </div>
  );
}
