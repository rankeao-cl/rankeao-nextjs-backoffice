"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { createBroadcast, getBroadcasts, type ListMeta } from "@/lib/api-admin";
import { getErrorMessage } from "@/lib/error-message";
import { getTableColumnKey } from "@/lib/table-column-key";
import { useDisclosure } from "@/hooks/use-disclosure";
import { Radio, Send } from "lucide-react";
import { toast } from "sonner";

type Broadcast = Record<string, unknown>;

const TABLE_COLUMNS = [
  { key: "title", label: "TITULO" },
  { key: "target", label: "TARGET" },
  { key: "status", label: "ESTADO" },
  { key: "recipients", label: "DESTINATARIOS" },
  { key: "reads", label: "LECTURA" },
] as const;

const EMPTY_META: ListMeta = {
  page: 1,
  per_page: 20,
  total: 0,
  total_pages: 1,
};

export default function BroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [meta, setMeta] = useState<ListMeta>(EMPTY_META);
  const [loading, setLoading] = useState(true);

  const [queryFilter, setQueryFilter] = useState("");
  const [targetFilter, setTargetFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [perPageInput, setPerPageInput] = useState("20");

  const createModal = useDisclosure();
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    target: "ALL",
    action_url: "",
    channels: "IN_APP",
    schedule_at: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  const fetchBroadcasts = useCallback(async () => {
    setLoading(true);
    try {
      const perPage = Math.max(1, Number.parseInt(perPageInput, 10) || 20);
      const res = await getBroadcasts({ page, per_page: perPage });
      setBroadcasts((res.broadcasts as Broadcast[]) || []);
      setMeta(res.meta || EMPTY_META);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Error al cargar broadcasts"));
    } finally {
      setLoading(false);
    }
  }, [page, perPageInput]);

  useEffect(() => {
    fetchBroadcasts();
  }, [fetchBroadcasts]);

  const filteredBroadcasts = useMemo(() => {
    return broadcasts.filter((broadcast) => {
      const title = String(broadcast.title || "").toLowerCase();
      const target = String(broadcast.target || "").toLowerCase();
      const status = String(broadcast.status || "").toLowerCase();

      const matchesQuery = !queryFilter || title.includes(queryFilter.toLowerCase());
      const matchesTarget = !targetFilter || target.includes(targetFilter.toLowerCase());
      const matchesStatus = !statusFilter || status.includes(statusFilter.toLowerCase());

      return matchesQuery && matchesTarget && matchesStatus;
    });
  }, [broadcasts, queryFilter, statusFilter, targetFilter]);

  const clearFilters = () => {
    setQueryFilter("");
    setTargetFilter("");
    setStatusFilter("");
  };

  const applyPagination = () => {
    if (page !== 1) {
      setPage(1);
      return;
    }
    fetchBroadcasts();
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.body) {
      toast.error("Titulo y body son requeridos");
      return;
    }

    setFormLoading(true);
    try {
      await createBroadcast({
        title: formData.title,
        body: formData.body,
        target: formData.target,
        action_url: formData.action_url || undefined,
        channels: formData.channels
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        schedule_at: formData.schedule_at
          ? new Date(formData.schedule_at).toISOString()
          : undefined,
      });

      toast.success("Broadcast creado");
      createModal.onClose();
      fetchBroadcasts();
      setFormData({
        title: "",
        body: "",
        target: "ALL",
        action_url: "",
        channels: "IN_APP",
        schedule_at: "",
      });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setFormLoading(false);
    }
  };

  const renderCell = (broadcast: Broadcast, columnKey: string) => {
    switch (columnKey) {
      case "title":
        return (
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-zinc-200" />
            <span className="font-medium">{String(broadcast.title || "-")}</span>
          </div>
        );
      case "target":
        return (
          <Chip size="sm" variant="soft" color="default">
            {String(broadcast.target || "-")}
          </Chip>
        );
      case "status":
        return (
          <Chip size="sm" color="default" variant="soft">
            {String(broadcast.status || "-")}
          </Chip>
        );
      case "recipients":
        return String(broadcast.recipient_count ?? "-");
      case "reads":
        return String(broadcast.read_count ?? "-");
      default:
        return null;
    }
  };

  const canPrev = page > 1;
  const canNext = page < Math.max(1, meta.total_pages);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-purple-cyan">
            Broadcasts
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Notificaciones masivas a grupos de usuarios</p>
        </div>
        <Button
          onPress={createModal.onOpen}
          className="bg-gradient-to-r from-zinc-700 to-black shadow-lg shadow-white/10"
        >
          Nuevo Broadcast
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <Input placeholder="Buscar titulo" value={queryFilter} onChange={(e) => setQueryFilter(e.target.value)} />
        <Input placeholder="Filtrar target" value={targetFilter} onChange={(e) => setTargetFilter(e.target.value)} />
        <Input placeholder="Filtrar status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
        <Input
          type="number"
          min={1}
          placeholder="per_page"
          value={perPageInput}
          onChange={(e) => setPerPageInput(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <Button size="sm" onPress={applyPagination}>Aplicar paginacion</Button>
        <Button size="sm" variant="ghost" onPress={clearFilters}>Limpiar filtros locales</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" color="current" />
        </div>
      ) : (
        <Table>
          <Table.Content aria-label="Broadcasts">
            <TableHeader columns={TABLE_COLUMNS}>
              {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
            </TableHeader>
            <TableBody items={filteredBroadcasts}>
              {(broadcast) => (
                <TableRow key={String(broadcast.id || String(broadcast.title || "-"))}>
                  {(column) => <TableCell>{renderCell(broadcast, getTableColumnKey(column))}</TableCell>}
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
          <Button size="sm" variant="ghost" isDisabled={!canPrev} onPress={() => setPage((prev) => Math.max(1, prev - 1))}>
            Anterior
          </Button>
          <Button size="sm" variant="ghost" isDisabled={!canNext} onPress={() => setPage((prev) => prev + 1)}>
            Siguiente
          </Button>
        </div>
      </div>

      <Modal isOpen={createModal.isOpen} onOpenChange={(isOpen) => !isOpen && createModal.onClose()}>
        <ModalDialog>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-zinc-200" />
              Crear Broadcast
            </div>
          </ModalHeader>
          <ModalBody className="gap-4">
            <Input
              placeholder="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            />
            <TextArea
              placeholder="body"
              value={formData.body}
              onChange={(e) => setFormData((prev) => ({ ...prev, body: e.target.value }))}
              rows={3}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="target"
                value={formData.target}
                onChange={(e) => setFormData((prev) => ({ ...prev, target: e.target.value }))}
              />
              <Input
                placeholder="channels (IN_APP,EMAIL...)"
                value={formData.channels}
                onChange={(e) => setFormData((prev) => ({ ...prev, channels: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="action_url"
                value={formData.action_url}
                onChange={(e) => setFormData((prev) => ({ ...prev, action_url: e.target.value }))}
              />
              <Input
                type="datetime-local"
                value={formData.schedule_at}
                onChange={(e) => setFormData((prev) => ({ ...prev, schedule_at: e.target.value }))}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onPress={createModal.onClose}>Cancelar</Button>
            <Button onPress={handleCreate} isPending={formLoading}>Enviar Broadcast</Button>
          </ModalFooter>
        </ModalDialog>
      </Modal>
    </div>
  );
}
