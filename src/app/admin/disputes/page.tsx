"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  Chip,
  Description,
  Fieldset,
  Form,
  Input,
  Label,
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
  TextField,
  TextArea,
} from "@heroui/react";
import { assignDispute, getDisputes, resolveDispute, type ListMeta } from "@/lib/api-admin";
import { getErrorMessage } from "@/lib/error-message";
import { getTableColumnKey } from "@/lib/table-column-key";
import { useDisclosure } from "@/hooks/use-disclosure";
import { Scale } from "lucide-react";
import { toast } from "sonner";

type Dispute = Record<string, unknown>;

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

const EMPTY_META: ListMeta = {
  page: 1,
  per_page: 20,
  total: 0,
  total_pages: 1,
};

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [meta, setMeta] = useState<ListMeta>(EMPTY_META);
  const [loading, setLoading] = useState(true);

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
  const [assignLoading, setAssignLoading] = useState(false);

  const [resolution, setResolution] = useState<ResolutionForm>({
    outcome: "FULL_REFUND",
    refund_amount: 0,
    notes: "",
    sanction: "",
  });
  const [resolveLoading, setResolveLoading] = useState(false);

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const perPage = Math.max(1, Number.parseInt(perPageInput, 10) || 20);
      const res = await getDisputes({
        status: statusFilter || undefined,
        reason: reasonFilter || undefined,
        assigned_moderator_id: assignedModeratorFilter || undefined,
        unassigned: unassignedOnly ? true : undefined,
        page,
        per_page: perPage,
      });
      setDisputes(res.disputes || []);
      setMeta(res.meta || EMPTY_META);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Error al cargar disputas"));
    } finally {
      setLoading(false);
    }
  }, [assignedModeratorFilter, page, perPageInput, reasonFilter, statusFilter, unassignedOnly]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

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
      return;
    }
    fetchDisputes();
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

  const handleAssign = async () => {
    if (!selectedDispute || !moderatorId) return;
    setAssignLoading(true);
    try {
      await assignDispute(String(selectedDispute.id), { moderator_id: moderatorId });
      toast.success("Moderador asignado");
      assignModal.onClose();
      fetchDisputes();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setAssignLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedDispute) return;
    setResolveLoading(true);
    try {
      await resolveDispute(String(selectedDispute.id), {
        outcome: resolution.outcome,
        refund_amount: resolution.refund_amount || undefined,
        notes: resolution.notes || undefined,
        sanction: resolution.sanction || undefined,
      });
      toast.success("Disputa resuelta");
      resolveModal.onClose();
      fetchDisputes();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setResolveLoading(false);
    }
  };

  const renderCell = (dispute: Dispute, columnKey: string) => {
    switch (columnKey) {
      case "id":
        return <code className="text-xs text-zinc-500">{String(dispute.id).slice(0, 8)}...</code>;
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
          <span className="text-xs text-zinc-500">
            {dispute.moderator_id ? `${String(dispute.moderator_id).slice(0, 8)}...` : "Sin asignar"}
          </span>
        );
      case "actions":
        return (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
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
              variant="ghost"
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
        <p className="text-sm text-zinc-500 mt-1">Gestion de disputas del marketplace</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="w-full lg:w-1/3 shrink-0">
          <Card className="bg-[#0f1017] border border-[#2a2f4b]/40">
            <CardContent className="p-5">
              <Form>
                <Fieldset className="space-y-4">
                  <Fieldset.Legend className="text-zinc-200 font-semibold">Filtros</Fieldset.Legend>
                  <Description className="text-xs text-zinc-500">
                    Filtra por ID, estado, razon y moderador para encontrar casos rapidamente.
                  </Description>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-zinc-400">ID (local)</Label>
                      <Input value={idSearch} onChange={(e) => setIdSearch(e.target.value)} />
                    </TextField>
                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-zinc-400">Estado</Label>
                      <Input placeholder="OPEN, RESOLVED..." value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
                    </TextField>
                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-zinc-400">Razon</Label>
                      <Input value={reasonFilter} onChange={(e) => setReasonFilter(e.target.value)} />
                    </TextField>
                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-zinc-400">Moderador ID</Label>
                      <Input value={assignedModeratorFilter} onChange={(e) => setAssignedModeratorFilter(e.target.value)} />
                    </TextField>
                  </div>

                  <Fieldset.Actions className="flex flex-wrap items-center gap-2">
                    <Input
                      className="w-28"
                      type="number"
                      min={1}
                      value={perPageInput}
                      onChange={(e) => setPerPageInput(e.target.value)}
                      placeholder="per_page"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant={unassignedOnly ? "primary" : "ghost"}
                      onPress={() => setUnassignedOnly((prev) => !prev)}
                    >
                      Solo sin asignar
                    </Button>
                    <Button type="button" size="sm" onPress={applyFilters}>
                      Aplicar filtros
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onPress={clearFilters}>
                      Limpiar
                    </Button>
                  </Fieldset.Actions>
                </Fieldset>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="w-full lg:w-2/3">
          <Card className="bg-[#0f1017] border border-[#2a2f4b]/40">
            <CardContent className="p-5 space-y-4">
              {loading ? (
                <div className="flex justify-center py-20">
                  <Spinner size="lg" />
                </div>
              ) : (
                <Table>
                  <Table.Content aria-label="Disputes">
                    <TableHeader columns={TABLE_COLUMNS}>
                      {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
                    </TableHeader>
                    <TableBody items={filteredDisputes}>
                      {(dispute) => (
                        <TableRow key={String(dispute.id)}>
                          {(column) => <TableCell>{renderCell(dispute, getTableColumnKey(column))}</TableCell>}
                        </TableRow>
                      )}
                    </TableBody>
                  </Table.Content>
                </Table>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-500">
                <span>
                  Pagina {meta.page} de {meta.total_pages} | Total aproximado: {meta.total}
                </span>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="ghost" isDisabled={!canPrev} onPress={() => setPage((prev) => Math.max(1, prev - 1))}>
                    Anterior
                  </Button>
                  <Button type="button" size="sm" variant="ghost" isDisabled={!canNext} onPress={() => setPage((prev) => prev + 1)}>
                    Siguiente
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal isOpen={assignModal.isOpen} onOpenChange={(isOpen) => !isOpen && assignModal.onClose()}>
        <ModalDialog>
          <ModalHeader>Asignar Moderador</ModalHeader>
          <ModalBody className="gap-4">
            <Form className="w-full">
              <Fieldset className="space-y-4 w-full">
                <Description className="text-xs text-zinc-500">Disputa: {String(selectedDispute?.id || "")}</Description>
                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-zinc-400">Moderador ID</Label>
                  <Input value={moderatorId} onChange={(e) => setModeratorId(e.target.value)} />
                </TextField>
              </Fieldset>
            </Form>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onPress={assignModal.onClose}>
              Cancelar
            </Button>
            <Button onPress={handleAssign} isPending={assignLoading}>
              Asignar
            </Button>
          </ModalFooter>
        </ModalDialog>
      </Modal>

      <Modal isOpen={resolveModal.isOpen} onOpenChange={(isOpen) => !isOpen && resolveModal.onClose()}>
        <ModalDialog>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-zinc-200" />
              Resolver Disputa
            </div>
          </ModalHeader>
          <ModalBody className="gap-4">
            <Form className="w-full">
              <Fieldset className="space-y-4 w-full">
                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-zinc-400">Outcome</Label>
                  <Input
                    value={resolution.outcome}
                    onChange={(e) => setResolution((prev) => ({ ...prev, outcome: e.target.value }))}
                  />
                </TextField>
                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-zinc-400">Refund amount</Label>
                  <Input
                    type="number"
                    value={String(resolution.refund_amount)}
                    onChange={(e) =>
                      setResolution((prev) => ({
                        ...prev,
                        refund_amount: Number.parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </TextField>
                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-zinc-400">Notas</Label>
                  <TextArea
                    value={resolution.notes}
                    onChange={(e) => setResolution((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </TextField>
                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-zinc-400">Sancion</Label>
                  <Input
                    value={resolution.sanction}
                    onChange={(e) => setResolution((prev) => ({ ...prev, sanction: e.target.value }))}
                  />
                </TextField>
              </Fieldset>
            </Form>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onPress={resolveModal.onClose}>
              Cancelar
            </Button>
            <Button onPress={handleResolve} isPending={resolveLoading}>
              Resolver
            </Button>
          </ModalFooter>
        </ModalDialog>
      </Modal>
    </div>
  );
}
