"use client";

import { useState } from "react";
import {
  Avatar,
  Card,
  Chip,
  Input,
  Label,
  Modal,
  Skeleton,
  Table,
  TextField,
  Button,
  toast,
} from "@heroui/react";
import {
  useTenants,
  useVerifyTenant,
  useRejectTenant,
  useSuspendTenant,
  useReactivateTenant,
} from "@/lib/hooks/use-tenants";
import type { Tenant } from "@/lib/types/tenant";
import { getErrorMessage } from "@/lib/utils/error-message";
import { useDisclosure } from "@/lib/hooks/use-disclosure";
import { Store } from "lucide-react";

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

const actionLabels: Record<TenantAction, string> = {
  verify: "Verificar",
  reject: "Rechazar",
  suspend: "Suspender",
  reactivate: "Reactivar",
};

export default function TenantsPage() {
  const [search, setSearch] = useState("");
  const [actionTarget, setActionTarget] = useState<{
    tenant: Tenant;
    action: TenantAction;
  } | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const { data: tenants = [], isLoading } = useTenants();

  const verifyMutation = useVerifyTenant();
  const rejectMutation = useRejectTenant();
  const suspendMutation = useSuspendTenant();
  const reactivateMutation = useReactivateTenant();

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

  const executeAction = () => {
    if (!actionTarget) return;

    const { tenant, action } = actionTarget;
    const mutationMap: Record<TenantAction, typeof verifyMutation> = {
      verify: verifyMutation,
      reject: rejectMutation,
      suspend: suspendMutation,
      reactivate: reactivateMutation,
    };

    mutationMap[action].mutate(tenant.id, {
      onSuccess: () => {
        toast.success(`Tenant "${tenant.name}" actualizado`);
        onClose();
      },
      onError: (error: unknown) => {
        toast.danger(getErrorMessage(error));
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
            <Avatar
              size="sm"
              className="bg-[var(--default)] text-[var(--foreground)]"
            >
              {tenant.logo_url ? <Avatar.Image src={tenant.logo_url} alt={tenant.name} /> : null}
              <Avatar.Fallback>
                {tenant.name?.[0] ? tenant.name[0].toUpperCase() : <Store className="h-4 w-4" />}
              </Avatar.Fallback>
            </Avatar>
            <div>
              <p className="font-medium text-[var(--foreground)]">{tenant.name}</p>
              <p className="text-xs text-[var(--muted)]">{tenant.slug}</p>
            </div>
          </div>
        );
      case "city":
        return (
          <span className="text-[var(--muted)]">
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
          <span className="text-xs text-[var(--muted)]">
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
                  variant="secondary"
                  onPress={() => openAction(tenant, "verify")}
                >
                  Verificar
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onPress={() => openAction(tenant, "reject")}
                >
                  Rechazar
                </Button>
              </>
            )}
            {tenant.status === "active" && (
              <Button
                size="sm"
                variant="danger"
                onPress={() => openAction(tenant, "suspend")}
              >
                Suspender
              </Button>
            )}
            {tenant.status === "suspended" && (
              <Button
                size="sm"
                variant="secondary"
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
            Tiendas
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">Gestion de tiendas registradas</p>
        </div>
      </div>

      <Card className="bg-[var(--surface)] border border-[var(--border)]">
        <Card.Content className="px-5 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <TextField className="space-y-1 flex flex-col min-w-[200px] flex-1">
              <Label className="text-xs text-[var(--muted)]">Busqueda</Label>
              <Input
                placeholder="Nombre, slug o ciudad..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setSearch(e.target.value)}
              />
            </TextField>
          </div>
        </Card.Content>
      </Card>

      <Card className="bg-[var(--surface)] border border-[var(--border)]">
        <Card.Content className="p-0">
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
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Tenants table">
                  <Table.Header columns={TABLE_COLUMNS}>
                    {(column: { key: string; label: string }) => (
                      <Table.Column key={column.key} isRowHeader={column.key === TABLE_COLUMNS[0].key}>
                        {column.label}
                      </Table.Column>
                    )}
                  </Table.Header>
                  <Table.Body>
                    {filteredTenants.map((tenant) => (
                      <Table.Row key={tenant.id}>
                        {TABLE_COLUMNS.map((column: { key: string; label: string }) => (
                          <Table.Cell key={column.key}>
                            {renderCell(tenant, column.key)}
                          </Table.Cell>
                        ))}
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          )}
        </Card.Content>
      </Card>

      <Modal>
        <Modal.Backdrop
          isOpen={isOpen}
          onOpenChange={(isOpen: boolean) => !isOpen && onClose()}
        >
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>{actionTarget ? `¿${actionLabels[actionTarget.action]} tenant?` : "Confirmar"}</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className="text-[var(--muted)] text-sm">
                  Esta accion cambiara el estado de
                  <strong className="text-[var(--foreground)]"> {actionTarget?.tenant.name}</strong>.
                </p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={onClose}>
                  Cancelar
                </Button>
                <Button variant="primary" onPress={executeAction} isPending={actionLoading}>
                  Confirmar
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
