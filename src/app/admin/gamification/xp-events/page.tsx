"use client";

import {
  useState,
  useCallback,
  useEffect,
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
  TextField,
  Button,
} from "@heroui/react";
import { createXPEvent, getXPEvents, updateXPEvent } from "@/lib/api-admin";
import { getErrorMessage } from "@/lib/error-message";
import { useDisclosure } from "@/hooks/use-disclosure";
import { Edit, Zap } from "lucide-react";
import { toast } from "sonner";

type XPEvent = Record<string, unknown>;

type XPEventForm = {
  event_key: string;
  xp_amount: number;
  cooldown_minutes: number;
  max_per_day: number;
  is_active: boolean;
};

const INITIAL_FORM: XPEventForm = {
  event_key: "",
  xp_amount: 10,
  cooldown_minutes: 0,
  max_per_day: 0,
  is_active: true,
};

const TABLE_COLUMNS = [
  { key: "event", label: "EVENT KEY" },
  { key: "xp", label: "XP" },
  { key: "cooldown", label: "COOLDOWN" },
  { key: "max", label: "MAX/DIA" },
  { key: "status", label: "ESTADO" },
  { key: "actions", label: "ACCIONES" },
] as const;

export default function XPEventsPage() {
  const [events, setEvents] = useState<XPEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const createModal = useDisclosure();
  const [editTarget, setEditTarget] = useState<XPEvent | null>(null);
  const [formData, setFormData] = useState<XPEventForm>(INITIAL_FORM);
  const [formLoading, setFormLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getXPEvents();
      setEvents((res.events as XPEvent[]) || []);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Error al cargar XP events"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const filtered = events.filter((event) =>
    String(event.event_key || "").toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditTarget(null);
    setFormData(INITIAL_FORM);
    createModal.onOpen();
  };

  const openEdit = (event: XPEvent) => {
    setEditTarget(event);
    setFormData({
      event_key: String(event.event_key || ""),
      xp_amount: Number(event.xp_amount || 10),
      cooldown_minutes: Number(event.cooldown_minutes || 0),
      max_per_day: Number(event.max_per_day || 0),
      is_active: Boolean(event.is_active ?? true),
    });
    createModal.onOpen();
  };

  const handleSave = async () => {
    setFormLoading(true);
    try {
      if (editTarget?.id) {
        await updateXPEvent(String(editTarget.id), formData);
        toast.success("XP Event actualizado");
      } else {
        await createXPEvent(formData);
        toast.success("XP Event creado");
      }
      createModal.onClose();
      fetchEvents();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setFormLoading(false);
    }
  };

  const renderCell = (event: XPEvent, columnKey: string) => {
    switch (columnKey) {
      case "event":
        return (
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-[var(--foreground)]" />
            <code className="text-xs">{String(event.event_key || "-")}</code>
          </div>
        );
      case "xp":
        return <span className="font-bold text-[var(--foreground)]">+{String(event.xp_amount || 0)}</span>;
      case "cooldown":
        return Number(event.cooldown_minutes) > 0 ? `${event.cooldown_minutes} min` : "-";
      case "max":
        return Number(event.max_per_day) > 0 ? String(event.max_per_day) : "∞";
      case "status":
        return (
          <Chip size="sm" color="default" variant="soft">
            {event.is_active ? "Activo" : "Inactivo"}
          </Chip>
        );
      case "actions":
        return (
          <Button size="sm" variant="secondary" isIconOnly onPress={() => openEdit(event)}>
            <Edit className="h-3.5 w-3.5" />
          </Button>
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
            Eventos XP
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">Definiciones de eventos que otorgan XP</p>
        </div>
        <Button
          type="button"
          onPress={openCreate}

        >
          Nuevo evento XP
        </Button>
      </div>

      <Card className="bg-[var(--surface)] border border-[var(--border)]">
        <Card.Content className="px-5 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <TextField className="space-y-1 flex flex-col min-w-[200px] flex-1">
              <Label className="text-xs text-[var(--muted)]">Buscar</Label>
              <Input
                placeholder="event_key..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setSearch(e.target.value)}
              />
            </TextField>
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
                    <Skeleton className="h-3 w-4/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="XP Events">
                  <Table.Header columns={TABLE_COLUMNS}>
                    {(column: { key: string; label: string }) => (
                      <Table.Column key={column.key} isRowHeader={column.key === TABLE_COLUMNS[0].key}>
                        {column.label}
                      </Table.Column>
                    )}
                  </Table.Header>
                  <Table.Body>
                    {filtered.map((event) => (
                      <Table.Row key={String(event.id || event.event_key || "-")}>
                        {TABLE_COLUMNS.map((column: { key: string; label: string }) => (
                          <Table.Cell key={column.key}>
                            {renderCell(event, column.key)}
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
        <Modal.Backdrop isOpen={createModal.isOpen} onOpenChange={(isOpen: boolean) => !isOpen && createModal.onClose()}>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>{editTarget ? "Editar evento XP" : "Crear evento XP"}</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="gap-4">
                <Form className="w-full">
                  <Fieldset className="space-y-4 w-full">
                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">Event key</Label>
                      <Input
                        value={formData.event_key}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData((prev) => ({ ...prev, event_key: e.target.value }))}
                        disabled={Boolean(editTarget)}
                      />
                    </TextField>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">XP amount</Label>
                        <Input
                          type="number"
                          value={String(formData.xp_amount)}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                            setFormData((prev) => ({ ...prev, xp_amount: Number.parseInt(e.target.value, 10) || 0 }))
                          }
                        />
                      </TextField>
                      <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Cooldown (min)</Label>
                        <Input
                          type="number"
                          value={String(formData.cooldown_minutes)}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                            setFormData((prev) => ({
                              ...prev,
                              cooldown_minutes: Number.parseInt(e.target.value, 10) || 0,
                            }))
                          }
                        />
                      </TextField>
                      <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Max por dia</Label>
                        <Input
                          type="number"
                          value={String(formData.max_per_day)}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                            setFormData((prev) => ({ ...prev, max_per_day: Number.parseInt(e.target.value, 10) || 0 }))
                          }
                        />
                      </TextField>
                    </div>
                  </Fieldset>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={createModal.onClose}>
                  Cancelar
                </Button>
                <Button onPress={handleSave} isPending={formLoading}>
                  {editTarget ? "Guardar" : "Crear"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}

