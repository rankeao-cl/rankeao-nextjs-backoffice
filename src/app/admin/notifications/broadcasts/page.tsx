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
import { createBroadcast, getBroadcasts } from "@/lib/api-admin";
import { getTableColumnKey } from "@/lib/table-column-key";
import { useDisclosure } from "@/hooks/use-disclosure";
import { Radio, Send } from "lucide-react";
import { toast } from "sonner";

type Broadcast = Record<string, unknown>;

const TARGETS = ["ALL", "ACTIVE_7D", "SELLERS", "JUDGES", "TENANT_OWNERS"];

const TABLE_COLUMNS = [
  { key: "title", label: "TITULO" },
  { key: "target", label: "TARGET" },
  { key: "status", label: "ESTADO" },
  { key: "recipients", label: "DESTINATARIOS" },
  { key: "reads", label: "LECTURA" },
] as const;

export default function BroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);

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
      const res = (await getBroadcasts()) as Record<string, unknown>;
      const data =
        (res.broadcasts as Broadcast[]) ||
        (res.data as Broadcast[]) ||
        (Array.isArray(res) ? (res as Broadcast[]) : []);
      setBroadcasts(data);
    } catch {
      toast.error("Error al cargar broadcasts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBroadcasts();
  }, [fetchBroadcasts]);

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
        channels: formData.channels.split(",").map((item) => item.trim()),
        schedule_at: formData.schedule_at ? new Date(formData.schedule_at).toISOString() : undefined,
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
      toast.error(error instanceof Error ? error.message : "Error");
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
            <TableBody items={broadcasts}>
              {(broadcast) => (
                <TableRow key={String(broadcast.id || String(broadcast.title || "-"))}>
                  {(column) => <TableCell>{renderCell(broadcast, getTableColumnKey(column))}</TableCell>}
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
          <ModalHeader>
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-zinc-200" />
              Crear Broadcast
            </div>
          </ModalHeader>
          <ModalBody className="gap-4">
            <Input
             
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
             
            />
            <TextArea
             
              value={formData.body}
              onChange={(e) => setFormData((prev) => ({ ...prev, body: e.target.value }))}
             
              rows={3}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
               
                value={formData.target}
                onChange={(e) => setFormData((prev) => ({ ...prev, target: e.target.value }))}
              />
              <Input
               
                value={formData.channels}
                onChange={(e) => setFormData((prev) => ({ ...prev, channels: e.target.value }))}
               
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
               
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
            <Button variant="ghost" onPress={createModal.onClose}>
              Cancelar
            </Button>
            <Button onPress={handleCreate} isPending={formLoading}>
              Enviar Broadcast
            </Button>
          </ModalFooter>
        </ModalDialog>
      </Modal>
    </div>
  );
}
