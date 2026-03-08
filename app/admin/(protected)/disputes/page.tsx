"use client";

import { useMemo, useState } from "react";
import {
  Card,
  Chip,
  Description,
  Fieldset,
  Form,
  Input,
  Label,
  Modal,
  Skeleton,
  Table,
  TextArea,
  TextField,
  Button,
  toast,
} from "@heroui/react";
import { useDisclosure } from "@/lib/hooks/use-disclosure";
import { useDisputes, useAssignDispute, useResolveDispute } from "@/lib/hooks/use-disputes";
import { getErrorMessage } from "@/lib/utils/error-message";
import type { Dispute } from "@/lib/types/dispute";
import { Scale } from "lucide-react";

type ResolutionForm = {
  outcome: string;
  refund_amount: number;
  notes: string;
  sanction: string;
};

const STATUS_COLOR: Record<string, "default"> = {
  OPEN: "default",
  IN_PROGRESS: "default",
  RESOLVED: "default",
  CLOSED: "default",
  ESCALATED: "default",
};

const TABLE_COLUMNS = [
  { key: "id", label: "ID" },
  { key: "reason", label: "RAZON" },
  { key: "status", label: "ESTADO" },
  { key: "moderator", label: "MODERADOR" },
  { key: "actions", label: "ACCIONES" },
] as const;

const EMPTY_META = {
  page: 1,
  per_page: 20,
  total: 0,
  total_pages: 1,
};

export default function DisputesPage() {
  const [idSearch, setIdSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [reasonFilter, setReasonFilter] = useState("");
  const [assignedModeratorFilter, setAssignedModeratorFilter] = useState("");
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [perPageInput, setPerPageInput] = useState("20");

  const assignModal = useDisclosure();
  const resolveModal = useDisclosure();

  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [moderatorId, setModeratorId] = useState("");

  const [resolution, setResolution] = useState<ResolutionForm>({
    outcome: "FULL_REFUND",
    refund_amount: 0,
    notes: "",
    sanction: "",
  });

  const perPage = Math.max(1, Number.parseInt(perPageInput, 10) || 20);

  const filters = useMemo(
    () => ({
      status: statusFilter || undefined,
      reason: reasonFilter || undefined,
      assigned_moderator_id: assignedModeratorFilter || undefined,
      unassigned: unassignedOnly ? true : undefined,
      page,
      per_page: perPage,
    }),
    [statusFilter, reasonFilter, assignedModeratorFilter, unassignedOnly, page, perPage]
  );

  const { data, isLoading } = useDisputes(filters);
  const disputes = data?.disputes ?? [];
  const meta = data?.meta ?? EMPTY_META;

  const assignMutation = useAssignDispute();
  const resolveMutation = useResolveDispute();

  const filteredDisputes = useMemo(() => {
    const q = idSearch.toLowerCase();
    if (!q) {
      return disputes;
    }

    return disputes.filter((dispute) => String(dispute.id || "").toLowerCase().includes(q));
  }, [disputes, idSearch]);

  const applyFilters = () => {
    if (page !== 1) {
      setPage(1);
    }
  };

  const clearFilters = () => {
    setStatusFilter("");
    setReasonFilter("");
    setAssignedModeratorFilter("");
    setUnassignedOnly(false);
    setIdSearch("");
    setPerPageInput("20");
    setPage(1);
  };

  const handleAssign = () => {
    if (!selectedDispute || !moderatorId) return;
    assignMutation.mutate(
      { disputeId: String(selectedDispute.id), data: { moderator_id: moderatorId } },
      {
        onSuccess: () => {
          toast.success("Moderador asignado");
          assignModal.onClose();
        },
        onError: (error: unknown) => {
          toast.danger(getErrorMessage(error));
        },
      }
    );
  };

  const handleResolve = () => {
    if (!selectedDispute) return;
    resolveMutation.mutate(
      {
        disputeId: String(selectedDispute.id),
        data: {
          outcome: resolution.outcome,
          refund_amount: resolution.refund_amount || undefined,
          notes: resolution.notes || undefined,
          sanction: resolution.sanction || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success("Disputa resuelta");
          resolveModal.onClose();
        },
        onError: (error: unknown) => {
          toast.danger(getErrorMessage(error));
        },
      }
    );
  };

  const renderCell = (dispute: Dispute, columnKey: string) => {
    switch (columnKey) {
      case "id":
        return <code className="text-xs text-[var(--muted)]">{String(dispute.id).slice(0, 8)}...</code>;
      case "reason":
        return <span className="text-sm">{String(dispute.reason || "-")}</span>;
      case "status":
        return (
          <Chip size="sm" color={STATUS_COLOR[String(dispute.status)] || "default"} variant="soft">
            {String(dispute.status || "-")}
          </Chip>
        );
      case "moderator":
        return (
          <span className="text-xs text-[var(--muted)]">
            {dispute.moderator_id ? `${String(dispute.moderator_id).slice(0, 8)}...` : "Sin asignar"}
          </span>
        );
      case "actions":
        return (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="secondary"
              onPress={() => {
                setSelectedDispute(dispute);
                setModeratorId("");
                assignModal.onOpen();
              }}
            >
              Asignar
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onPress={() => {
                setSelectedDispute(dispute);
                setResolution({
                  outcome: "FULL_REFUND",
                  refund_amount: 0,
                  notes: "",
                  sanction: "",
                });
                resolveModal.onOpen();
              }}
            >
              Resolver
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  const canPrev = page > 1;
  const canNext = page < Math.max(1, meta.total_pages);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-purple-cyan">
          Disputas
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">Gestion de disputas del marketplace</p>
      </div>

      <Card className="bg-[var(--surface)] border border-[var(--border)]">
        <Card.Content className="px-5 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <TextField className="space-y-1 flex flex-col min-w-[140px] flex-1">
              <Label className="text-xs text-[var(--muted)]">ID (local)</Label>
              <Input value={idSearch} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setIdSearch(e.target.value)} />
            </TextField>
            <TextField className="space-y-1 flex flex-col min-w-[140px] flex-1">
              <Label className="text-xs text-[var(--muted)]">Estado</Label>
              <Input placeholder="OPEN, RESOLVED..." value={statusFilter} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setStatusFilter(e.target.value)} />
            </TextField>
            <TextField className="space-y-1 flex flex-col min-w-[140px] flex-1">
              <Label className="text-xs text-[var(--muted)]">Razon</Label>
              <Input value={reasonFilter} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setReasonFilter(e.target.value)} />
            </TextField>
            <TextField className="space-y-1 flex flex-col min-w-[140px] flex-1">
              <Label className="text-xs text-[var(--muted)]">Moderador ID</Label>
              <Input value={assignedModeratorFilter} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setAssignedModeratorFilter(e.target.value)} />
            </TextField>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Input
              className="w-28"
              type="number"
              min={1}
              value={perPageInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setPerPageInput(e.target.value)}
              placeholder="per_page"
            />
            <Button
              type="button"
              size="sm"
              variant={unassignedOnly ? "primary" : "secondary"}
              onPress={() => setUnassignedOnly((prev) => !prev)}
            >
              Solo sin asignar
            </Button>
            <Button type="button" size="sm" variant="primary" onPress={applyFilters}>
              Aplicar filtros
            </Button>
            <Button type="button" size="sm" variant="tertiary" onPress={clearFilters}>
              Limpiar
            </Button>
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
                <Table.Content aria-label="Disputes">
                  <Table.Header columns={TABLE_COLUMNS}>
                    {(column: { key: string; label: string }) => (
                      <Table.Column key={column.key} isRowHeader={column.key === TABLE_COLUMNS[0].key}>
                        {column.label}
                      </Table.Column>
                    )}
                  </Table.Header>
                  <Table.Body>
                    {filteredDisputes.map((dispute) => (
                      <Table.Row key={String(dispute.id)}>
                        {TABLE_COLUMNS.map((column: { key: string; label: string }) => (
                          <Table.Cell key={column.key}>
                            {renderCell(dispute, column.key)}
                          </Table.Cell>
                        ))}
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--muted)] px-5 py-3 border-t border-[var(--border)]">
            <span>
              Pagina {meta.page} de {meta.total_pages} | Total aproximado: {meta.total}
            </span>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="secondary" isDisabled={!canPrev} onPress={() => setPage((prev) => Math.max(1, prev - 1))}>
                Anterior
              </Button>
              <Button type="button" size="sm" variant="secondary" isDisabled={!canNext} onPress={() => setPage((prev) => prev + 1)}>
                Siguiente
              </Button>
            </div>
          </div>
        </Card.Content>
      </Card>

      <Modal>
        <Modal.Backdrop isOpen={assignModal.isOpen} onOpenChange={(isOpen: boolean) => !isOpen && assignModal.onClose()}>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header><Modal.Heading>Asignar Moderador</Modal.Heading></Modal.Header>
              <Modal.Body className="gap-4">
                <Form className="w-full">
                  <Fieldset className="space-y-4 w-full">
                    <Description className="text-xs text-[var(--muted)]">Disputa: {String(selectedDispute?.id || "")}</Description>
                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">Moderador ID</Label>
                      <Input value={moderatorId} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setModeratorId(e.target.value)} />
                    </TextField>
                  </Fieldset>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={assignModal.onClose}>
                  Cancelar
                </Button>
                <Button variant="primary" onPress={handleAssign} isPending={assignMutation.isPending}>
                  Asignar
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal>
        <Modal.Backdrop isOpen={resolveModal.isOpen} onOpenChange={(isOpen: boolean) => !isOpen && resolveModal.onClose()}>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>
                  <div className="flex items-center gap-2">
                    <Scale className="h-5 w-5 text-[var(--foreground)]" />
                    Resolver Disputa
                  </div>
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body className="gap-4">
                <Form className="w-full">
                  <Fieldset className="space-y-4 w-full">
                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">Outcome</Label>
                      <Input
                        value={resolution.outcome}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setResolution((prev) => ({ ...prev, outcome: e.target.value }))}
                      />
                    </TextField>
                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">Refund amount</Label>
                      <Input
                        type="number"
                        value={String(resolution.refund_amount)}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                          setResolution((prev) => ({
                            ...prev,
                            refund_amount: Number.parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                    </TextField>
                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">Notas</Label>
                      <TextArea
                        value={resolution.notes}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setResolution((prev) => ({ ...prev, notes: e.target.value }))}
                      />
                    </TextField>
                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">Sancion</Label>
                      <Input
                        value={resolution.sanction}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setResolution((prev) => ({ ...prev, sanction: e.target.value }))}
                      />
                    </TextField>
                  </Fieldset>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={resolveModal.onClose}>
                  Cancelar
                </Button>
                <Button variant="primary" onPress={handleResolve} isPending={resolveMutation.isPending}>
                  Resolver
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
