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
import {
  createTemplate,
  getTemplates,
  previewTemplate,
  testTemplate,
  updateTemplate,
} from "@/lib/api-admin";
import { getTableColumnKey } from "@/lib/table-column-key";
import { useDisclosure } from "@/hooks/use-disclosure";
import { Bell, Edit, Eye, Send } from "lucide-react";
import { toast } from "sonner";

type Template = Record<string, unknown>;

const CATEGORIES = ["tournament", "social", "marketplace", "system"];
const CHANNELS = ["IN_APP", "EMAIL", "PUSH", "SMS"];
const PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"];

const TABLE_COLUMNS = [
  { key: "key", label: "KEY" },
  { key: "category", label: "CATEGORIA" },
  { key: "priority", label: "PRIORIDAD" },
  { key: "channels", label: "CANALES" },
  { key: "status", label: "ESTADO" },
  { key: "actions", label: "ACCIONES" },
] as const;

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const createModal = useDisclosure();
  const [editTarget, setEditTarget] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    key: "",
    category: "system",
    title_template: "",
    body_template: "",
    channels: "IN_APP",
    priority: "NORMAL",
  });
  const [formLoading, setFormLoading] = useState(false);

  const previewModal = useDisclosure();
  const [previewData, setPreviewData] = useState<Record<string, unknown> | null>(null);

  const testModal = useDisclosure();
  const [testTarget, setTestTarget] = useState<Template | null>(null);
  const [testUserId, setTestUserId] = useState("");
  const [testLoading, setTestLoading] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await getTemplates({ q: search || undefined })) as Record<string, unknown>;
      const data =
        (res.templates as Template[]) ||
        (res.data as Template[]) ||
        (Array.isArray(res) ? (res as Template[]) : []);
      setTemplates(data);
    } catch {
      toast.error("Error al cargar templates");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const openCreate = () => {
    setEditTarget(null);
    setFormData({
      key: "",
      category: "system",
      title_template: "",
      body_template: "",
      channels: "IN_APP",
      priority: "NORMAL",
    });
    createModal.onOpen();
  };

  const openEdit = (template: Template) => {
    setEditTarget(template);
    setFormData({
      key: String(template.key || ""),
      category: String(template.category || "system"),
      title_template: String(template.title_template || ""),
      body_template: String(template.body_template || ""),
      channels: Array.isArray(template.channels)
        ? (template.channels as string[]).join(",")
        : "IN_APP",
      priority: String(template.priority || "NORMAL"),
    });
    createModal.onOpen();
  };

  const handleSave = async () => {
    setFormLoading(true);
    try {
      const payload = {
        ...formData,
        channels: formData.channels.split(",").map((value) => value.trim()),
      };

      if (editTarget?.id) {
        await updateTemplate(Number(editTarget.id), payload);
        toast.success("Template actualizado");
      } else {
        await createTemplate(payload);
        toast.success("Template creado");
      }

      createModal.onClose();
      fetchTemplates();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Error");
    } finally {
      setFormLoading(false);
    }
  };

  const handlePreview = async (template: Template) => {
    if (!template.id) return;

    try {
      const result = await previewTemplate(Number(template.id));
      setPreviewData(result as Record<string, unknown>);
      previewModal.onOpen();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Error");
    }
  };

  const handleTest = async () => {
    if (!testTarget?.id || !testUserId) return;

    setTestLoading(true);
    try {
      await testTemplate(Number(testTarget.id), { user_id: Number.parseInt(testUserId, 10) });
      toast.success("Test notification sent");
      testModal.onClose();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Error");
    } finally {
      setTestLoading(false);
    }
  };

  const renderCell = (template: Template, columnKey: string) => {
    switch (columnKey) {
      case "key":
        return (
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-zinc-200" />
            <code className="text-xs">{String(template.key || "-")}</code>
          </div>
        );
      case "category":
        return (
          <Chip size="sm" variant="soft">
            {String(template.category || "-")}
          </Chip>
        );
      case "priority":
        return (
          <Chip size="sm" color="default" variant="soft">
            {String(template.priority || "-")}
          </Chip>
        );
      case "channels":
        return (
          <span className="text-xs">
            {Array.isArray(template.channels)
              ? (template.channels as string[]).join(", ")
              : "-"}
          </span>
        );
      case "status":
        return (
          <Chip size="sm" color="default" variant="soft">
            {template.is_active ? "Activo" : "Inactivo"}
          </Chip>
        );
      case "actions":
        return (
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" isIconOnly onPress={() => openEdit(template)}>
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              isIconOnly
              onPress={() => handlePreview(template)}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              isIconOnly
              onPress={() => {
                setTestTarget(template);
                setTestUserId("");
                testModal.onOpen();
              }}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
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
            Notification Templates
          </h1>
          <p className="text-sm text-zinc-500 mt-1">CRUD de templates con preview y test</p>
        </div>
        <Button
         
          onPress={openCreate}
          className="bg-gradient-to-r from-zinc-700 to-black shadow-lg shadow-white/10"
        >
          Nuevo Template
        </Button>
      </div>

      <Input
        placeholder="Buscar..."
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
          <Table.Content aria-label="Templates">
            <TableHeader columns={TABLE_COLUMNS}>
              {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
            </TableHeader>
            <TableBody items={templates}>
              {(template) => (
                <TableRow key={String(template.id || template.key || "-")}>
                  {(column) => <TableCell>{renderCell(template, getTableColumnKey(column))}</TableCell>}
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
          <ModalHeader>{editTarget ? "Editar Template" : "Crear Template"}</ModalHeader>
          <ModalBody className="gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
               
                value={formData.key}
                onChange={(e) => setFormData((prev) => ({ ...prev, key: e.target.value }))}
                disabled={Boolean(editTarget)}
              />
              <Input
               
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
              />
            </div>
            <Input
             
              value={formData.title_template}
              onChange={(e) => setFormData((prev) => ({ ...prev, title_template: e.target.value }))}
            />
            <TextArea
             
              value={formData.body_template}
              onChange={(e) => setFormData((prev) => ({ ...prev, body_template: e.target.value }))}
              rows={3}
             
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
               
                value={formData.channels}
                onChange={(e) => setFormData((prev) => ({ ...prev, channels: e.target.value }))}
              />
              <Input
               
                value={formData.priority}
                onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value }))}
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

      <Modal
        isOpen={previewModal.isOpen}
        onOpenChange={(isOpen) => !isOpen && previewModal.onClose()}
      >
        <ModalDialog>
          <ModalHeader>Preview Template</ModalHeader>
          <ModalBody>
            {previewData && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-zinc-500">Title</label>
                  <p className="text-zinc-200 font-medium">
                    {String((previewData.data as Record<string, unknown>)?.title || previewData.title || "")}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-zinc-500">Body</label>
                  <p className="text-zinc-300 text-sm whitespace-pre-wrap">
                    {String((previewData.data as Record<string, unknown>)?.body || previewData.body || "")}
                  </p>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onPress={previewModal.onClose}>
              Cerrar
            </Button>
          </ModalFooter>
        </ModalDialog>
      </Modal>

      <Modal
        isOpen={testModal.isOpen}
        onOpenChange={(isOpen) => !isOpen && testModal.onClose()}
      >
        <ModalDialog>
          <ModalHeader>Enviar Test - {String(testTarget?.key || "")}</ModalHeader>
          <ModalBody className="gap-4">
            <Input
             
              value={testUserId}
              onChange={(e) => setTestUserId(e.target.value)}
              type="number"
             
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onPress={testModal.onClose}>
              Cancelar
            </Button>
            <Button onPress={handleTest} isPending={testLoading}>
              Enviar Test
            </Button>
          </ModalFooter>
        </ModalDialog>
      </Modal>
    </div>
  );
}
