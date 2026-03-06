"use client";

import { useCallback, useEffect, useState } from "react";
import {
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
  TextArea,
} from "@heroui/react";
import { getDisputes, assignDispute, resolveDispute } from "@/lib/api-admin";
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

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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
      const res = await getDisputes({
        status: statusFilter || undefined,
      });
      setDisputes(res.disputes || []);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Error al cargar disputas"));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const filtered = disputes.filter((d) => {
    const id = String(d.id || "");
    const reason = String(d.reason || "").toLowerCase();
    return id.includes(search) || reason.includes(search.toLowerCase());
  });

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

  const renderCell = (d: Dispute, columnKey: string) => {
    switch (columnKey) {
      case "id":
        return <code className="text-xs text-zinc-500">{String(d.id).slice(0, 8)}...</code>;
      case "reason":
        return <span className="text-sm">{String(d.reason || "-")}</span>;
      case "status":
        return (
          <Chip size="sm" color={STATUS_COLOR[String(d.status)] || "default"} variant="soft">
            {String(d.status)}
          </Chip>
        );
      case "moderator":
        return (
          <span className="text-xs text-zinc-500">
            {d.moderator_id ? `${String(d.moderator_id).slice(0, 8)}...` : "Sin asignar"}
          </span>
        );
      case "actions":
        return (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onPress={() => {
                setSelectedDispute(d);
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
                setSelectedDispute(d);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-purple-cyan">
          Disputes
        </h1>
        <p className="text-sm text-zinc-500 mt-1">Gestion de disputas del marketplace</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <Input
          placeholder="Filtrar por status..."
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-56"
         
        />
        <Button variant="ghost" onPress={fetchDisputes}>
          Filtrar
        </Button>
      </div>

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
            <TableBody items={filtered}>
              {(d) => (
                <TableRow key={String(d.id)}>
                  {(column) => <TableCell>{renderCell(d, getTableColumnKey(column))}</TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table.Content>
        </Table>
      )}

      <Modal
        isOpen={assignModal.isOpen}
        onOpenChange={(isOpen) => !isOpen && assignModal.onClose()}
      >
        <ModalDialog>
          <ModalHeader>Asignar Moderador</ModalHeader>
          <ModalBody className="gap-4">
            <p className="text-xs text-zinc-500">Disputa: {String(selectedDispute?.id || "")}</p>
            <Input
             
              value={moderatorId}
              onChange={(e) => setModeratorId(e.target.value)}
             
            />
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

      <Modal
        isOpen={resolveModal.isOpen}
        onOpenChange={(isOpen) => !isOpen && resolveModal.onClose()}
      >
        <ModalDialog>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-zinc-200" />
              Resolver Disputa
            </div>
          </ModalHeader>
          <ModalBody className="gap-4">
            <Input
             
              value={resolution.outcome}
              onChange={(e) =>
                setResolution((prev) => ({
                  ...prev,
                  outcome: e.target.value,
                }))
              }
             
            />
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
            <TextArea
             
              value={resolution.notes}
              onChange={(e) =>
                setResolution((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
            />
            <Input
             
              value={resolution.sanction}
              onChange={(e) =>
                setResolution((prev) => ({
                  ...prev,
                  sanction: e.target.value,
                }))
              }
            />
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
