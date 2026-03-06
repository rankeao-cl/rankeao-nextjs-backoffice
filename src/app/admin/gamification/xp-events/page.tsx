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
} from "@heroui/react";
import { createXPEvent, getXPEvents, updateXPEvent } from "@/lib/api-admin";
import { getTableColumnKey } from "@/lib/table-column-key";
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
      const payload = res as Record<string, unknown>;
      const list =
        (payload.events as XPEvent[]) ||
        (payload.data as XPEvent[]) ||
        (Array.isArray(res) ? (res as XPEvent[]) : []);
      setEvents(list);
    } catch {
      toast.error("Error al cargar XP events");
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
      toast.error(error instanceof Error ? error.message : "Error");
    } finally {
      setFormLoading(false);
    }
  };

  const renderCell = (event: XPEvent, columnKey: string) => {
    switch (columnKey) {
      case "event":
        return (
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-zinc-200" />
            <code className="text-xs">{String(event.event_key || "-")}</code>
          </div>
        );
      case "xp":
        return <span className="font-bold text-zinc-200">+{String(event.xp_amount || 0)}</span>;
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
          <Button size="sm" variant="ghost" isIconOnly onPress={() => openEdit(event)}>
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
            XP Events
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Definiciones de eventos que otorgan XP</p>
        </div>
        <Button
         
          onPress={openCreate}
          className="bg-gradient-to-r from-zinc-700 to-black shadow-lg shadow-white/10"
        >
          Nuevo XP Event
        </Button>
      </div>

      <Input
        placeholder="Buscar por event_key..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs"
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" color="current" />
        </div>
      ) : (
        <Table>
          <Table.Content aria-label="XP Events">
            <TableHeader columns={TABLE_COLUMNS}>
              {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
            </TableHeader>
            <TableBody items={filtered}>
              {(event) => (
                <TableRow key={String(event.id || event.event_key || "-")}>
                  {(column) => <TableCell>{renderCell(event, getTableColumnKey(column))}</TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table.Content>
        </Table>
      )}

      <Modal
        isOpen={createModal.isOpen}
        onOpenChange={(isOpen) => !isOpen && createModal.onClose()}
      >
        <ModalDialog>
          <ModalHeader>{editTarget ? "Editar XP Event" : "Crear XP Event"}</ModalHeader>
          <ModalBody className="gap-4">
            <Input
             
              value={formData.event_key}
              onChange={(e) => setFormData((prev) => ({ ...prev, event_key: e.target.value }))}
              disabled={Boolean(editTarget)}
            />
            <div className="grid grid-cols-3 gap-4">
              <Input
               
                type="number"
                value={String(formData.xp_amount)}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, xp_amount: Number.parseInt(e.target.value, 10) || 0 }))
                }
              />
              <Input
               
                type="number"
                value={String(formData.cooldown_minutes)}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    cooldown_minutes: Number.parseInt(e.target.value, 10) || 0,
                  }))
                }
              />
              <Input
               
                type="number"
                value={String(formData.max_per_day)}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, max_per_day: Number.parseInt(e.target.value, 10) || 0 }))
                }
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onPress={createModal.onClose}>
              Cancelar
            </Button>
            <Button onPress={handleSave} isPending={formLoading}>
              {editTarget ? "Guardar" : "Crear"}
            </Button>
          </ModalFooter>
        </ModalDialog>
      </Modal>
    </div>
  );
}
