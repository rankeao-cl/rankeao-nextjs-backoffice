"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  Card,
  Chip,
  Fieldset,
  Form,
  Input,
  Label,
  Modal,
  Skeleton,
  Spinner,
  Table,
  TextArea,
  TextField,
  Button,
} from "@heroui/react";
import { createBroadcast, getBroadcasts, type ListMeta } from "@/lib/api-admin";
import { getErrorMessage } from "@/lib/error-message";
import { useDisclosure } from "@/hooks/use-disclosure";
import { Radio, Send } from "lucide-react";
import { toast } from "@heroui/react";

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
      toast.danger(getErrorMessage(error, "Error al cargar broadcasts"));
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
      toast.danger("Titulo y body son requeridos");
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
      toast.danger(getErrorMessage(error));
    } finally {
      setFormLoading(false);
    }
  };

  const renderCell = (broadcast: Broadcast, columnKey: string) => {
    switch (columnKey) {
      case "title":
        return (
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-[var(--foreground)]" />
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
            Difusiones
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">Notificaciones masivas a grupos de usuarios</p>
        </div>
        <Button
          type="button"
          onPress={createModal.onOpen}
        >
          Nueva difusion
        </Button>
      </div>

      <Card className="bg-[var(--surface)] border border-[var(--border)]">
        <Card.Content className="px-5 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <TextField className="space-y-1 flex flex-col min-w-[140px] flex-1">
              <Label className="text-xs text-[var(--muted)]">Titulo</Label>
              <Input placeholder="texto" value={queryFilter} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setQueryFilter(e.target.value)} />
            </TextField>
            <TextField className="space-y-1 flex flex-col min-w-[140px] flex-1">
              <Label className="text-xs text-[var(--muted)]">Target</Label>
              <Input placeholder="ALL, SEGMENT..." value={targetFilter} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setTargetFilter(e.target.value)} />
            </TextField>
            <TextField className="space-y-1 flex flex-col min-w-[140px] flex-1">
              <Label className="text-xs text-[var(--muted)]">Estado</Label>
              <Input placeholder="PENDING, SENT..." value={statusFilter} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setStatusFilter(e.target.value)} />
            </TextField>
            <TextField className="space-y-1 flex flex-col w-24">
              <Label className="text-xs text-[var(--muted)]">Per page</Label>
              <Input
                type="number"
                min={1}
                value={perPageInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setPerPageInput(e.target.value)}
              />
            </TextField>
            <Button type="button" size="sm" variant="primary" onPress={applyPagination}>Aplicar</Button>
            <Button type="button" size="sm" variant="tertiary" onPress={clearFilters}>Limpiar</Button>
          </div>
        </Card.Content>
      </Card>

      <Card className="bg-[var(--surface)] border border-[var(--border)]">
        <Card.Content className="p-0">
          {loading ? (
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
                <Table.Content aria-label="Broadcasts">
                  <Table.Header columns={TABLE_COLUMNS}>
                    {(column: { key: string; label: string }) => (
                      <Table.Column key={column.key} isRowHeader={column.key === TABLE_COLUMNS[0].key}>
                        {column.label}
                      </Table.Column>
                    )}
                  </Table.Header>
                  <Table.Body>
                    {filteredBroadcasts.map((broadcast) => (
                      <Table.Row key={String(broadcast.id || String(broadcast.title || "-"))}>
                        {TABLE_COLUMNS.map((column: { key: string; label: string }) => (
                          <Table.Cell key={column.key}>
                            {renderCell(broadcast, column.key)}
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
        <Modal.Backdrop isOpen={createModal.isOpen} onOpenChange={(isOpen: boolean) => !isOpen && createModal.onClose()}>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <div className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-[var(--foreground)]" />
                  Crear difusion
                </div>
              </Modal.Header>
              <Modal.Body className="gap-4">
                <Form className="w-full">
                  <Fieldset className="space-y-4 w-full">
                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">Titulo</Label>
                      <Input
                        value={formData.title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      />
                    </TextField>

                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">Mensaje</Label>
                      <TextArea
                        value={formData.body}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData((prev) => ({ ...prev, body: e.target.value }))}
                        rows={3}
                      />
                    </TextField>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Target</Label>
                        <Input
                          value={formData.target}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData((prev) => ({ ...prev, target: e.target.value }))}
                        />
                      </TextField>
                      <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Canales</Label>
                        <Input
                          placeholder="IN_APP,EMAIL..."
                          value={formData.channels}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData((prev) => ({ ...prev, channels: e.target.value }))}
                        />
                      </TextField>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Action URL</Label>
                        <Input
                          value={formData.action_url}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData((prev) => ({ ...prev, action_url: e.target.value }))}
                        />
                      </TextField>
                      <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Programar para</Label>
                        <Input
                          type="datetime-local"
                          value={formData.schedule_at}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData((prev) => ({ ...prev, schedule_at: e.target.value }))}
                        />
                      </TextField>
                    </div>
                  </Fieldset>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={createModal.onClose}>Cancelar</Button>
                <Button variant="primary" onPress={handleCreate} isPending={formLoading}>Enviar difusion</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}

