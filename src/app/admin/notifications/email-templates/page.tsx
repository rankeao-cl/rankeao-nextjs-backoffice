"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
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
import { getEmailTemplates, previewEmailTemplate } from "@/lib/api-admin";
import { getErrorMessage } from "@/lib/error-message";
import { getTableColumnKey } from "@/lib/table-column-key";
import { useDisclosure } from "@/hooks/use-disclosure";
import { Eye, Mail } from "lucide-react";
import { toast } from "sonner";

type EmailTemplate = Record<string, unknown>;

const TABLE_COLUMNS = [
  { key: "key", label: "KEY" },
  { key: "category", label: "CATEGORIA" },
  { key: "channels", label: "CANALES" },
  { key: "actions", label: "ACCIONES" },
] as const;

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const previewModal = useDisclosure();
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewBody, setPreviewBody] = useState("");

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getEmailTemplates();
      setTemplates((res.templates as EmailTemplate[]) || []);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Error al cargar email templates"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const filteredTemplates = useMemo(() => {
    const q = search.toLowerCase();
    return templates.filter((template) => {
      const key = String(template.key || "").toLowerCase();
      const category = String(template.category || "").toLowerCase();
      return key.includes(q) || category.includes(q);
    });
  }, [search, templates]);

  const handlePreview = async (templateKey: string) => {
    if (!templateKey) {
      toast.error("Template key invalido");
      return;
    }

    try {
      const result = (await previewEmailTemplate(templateKey)) as Record<string, unknown>;
      const data = (result.data as Record<string, unknown>) || result;
      setPreviewTitle(String(data.title || ""));
      setPreviewBody(String(data.body || ""));
      previewModal.onOpen();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  };

  const renderCell = (template: EmailTemplate, columnKey: string) => {
    switch (columnKey) {
      case "key":
        return (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-zinc-300" />
            <code className="text-xs">{String(template.key || "-")}</code>
          </div>
        );
      case "category":
        return <span className="text-sm text-zinc-300">{String(template.category || "-")}</span>;
      case "channels":
        return (
          <span className="text-xs text-zinc-500">
            {Array.isArray(template.channels)
              ? (template.channels as string[]).join(", ")
              : "EMAIL"}
          </span>
        );
      case "actions":
        return (
          <Button
            size="sm"
            variant="ghost"
            isIconOnly
            onPress={() => handlePreview(String(template.key || ""))}
          >
            <Eye className="h-3.5 w-3.5" />
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
            Email Templates
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Lista y preview de templates de correo.
          </p>
        </div>
        <Button variant="ghost" onPress={fetchTemplates}>
          Recargar
        </Button>
      </div>

      <Input
        placeholder="Buscar por key o categoria..."
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
          <Table.Content aria-label="Email templates">
            <TableHeader columns={TABLE_COLUMNS}>
              {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
            </TableHeader>
            <TableBody items={filteredTemplates}>
              {(template) => (
                <TableRow key={String(template.key || "-")}>
                  {(column) => (
                    <TableCell>{renderCell(template, getTableColumnKey(column))}</TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table.Content>
        </Table>
      )}

      <Modal
        isOpen={previewModal.isOpen}
        onOpenChange={(isOpen) => !isOpen && previewModal.onClose()}
      >
        <ModalDialog>
          <ModalHeader>Preview Email Template</ModalHeader>
          <ModalBody>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-zinc-500">Title</p>
                <p className="text-zinc-200 font-medium">{previewTitle || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Body</p>
                <p className="text-zinc-300 text-sm whitespace-pre-wrap">{previewBody || "-"}</p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onPress={previewModal.onClose}>
              Cerrar
            </Button>
          </ModalFooter>
        </ModalDialog>
      </Modal>
    </div>
  );
}
