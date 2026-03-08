"use client";

import { useMemo, useState } from "react";
import {
  Button,
  Input,
  Label,
  Modal,
  Skeleton,
  Table,
  TextField,
  Card,
  toast,
} from "@heroui/react";
import {
  useEmailTemplates,
  usePreviewEmailTemplate,
} from "@/lib/hooks/use-notifications";
import type { EmailTemplate } from "@/lib/types/notification";
import { getErrorMessage } from "@/lib/utils/error-message";
import { useDisclosure } from "@/lib/hooks/use-disclosure";
import { Eye, Mail } from "lucide-react";

const TABLE_COLUMNS = [
  { key: "key", label: "KEY" },
  { key: "category", label: "CATEGORIA" },
  { key: "channels", label: "CANALES" },
  { key: "actions", label: "ACCIONES" },
] as const;

export default function EmailTemplatesPage() {
  const [search, setSearch] = useState("");

  const previewModal = useDisclosure();
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewBody, setPreviewBody] = useState("");

  const { data: templates = [], isLoading } = useEmailTemplates();
  const previewMutation = usePreviewEmailTemplate();

  const filteredTemplates = useMemo(() => {
    const q = search.toLowerCase();
    return templates.filter((template) => {
      const key = (template.key || "").toLowerCase();
      const category = (template.category || "").toLowerCase();
      return key.includes(q) || category.includes(q);
    });
  }, [search, templates]);

  const handlePreview = (templateKey: string) => {
    if (!templateKey) {
      toast.danger("Template key invalido");
      return;
    }

    previewMutation.mutate(templateKey, {
      onSuccess: (result) => {
        const data = (result as Record<string, unknown>).data as Record<string, unknown> | undefined;
        const resolved = data || (result as Record<string, unknown>);
        setPreviewTitle(String(resolved.title || ""));
        setPreviewBody(String(resolved.body || ""));
        previewModal.onOpen();
      },
      onError: (error: unknown) => {
        toast.danger(getErrorMessage(error));
      },
    });
  };

  const renderCell = (template: EmailTemplate, columnKey: string) => {
    switch (columnKey) {
      case "key":
        return (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-[var(--foreground)]" />
            <code className="text-xs">{template.key || "-"}</code>
          </div>
        );
      case "category":
        return <span className="text-sm text-[var(--foreground)]">{template.category || "-"}</span>;
      case "channels":
        return (
          <span className="text-xs text-[var(--muted)]">
            {Array.isArray(template.channels)
              ? (template.channels as string[]).join(", ")
              : "EMAIL"}
          </span>
        );
      case "actions":
        return (
          <Button
            size="sm"
            variant="secondary"
            isIconOnly
            onPress={() => handlePreview(template.key || "")}
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
            Plantillas de Email
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Lista y preview de templates de correo.
          </p>
        </div>
      </div>

      <Card className="bg-[var(--surface)] border border-[var(--border)]">
        <Card.Content className="px-5 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <TextField className="space-y-1 flex flex-col min-w-[200px] flex-1">
              <Label className="text-xs text-[var(--muted)]">Busqueda</Label>
              <Input
                placeholder="Key o categoría..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setSearch(e.target.value)}
              />
            </TextField>
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
                <Table.Content aria-label="Email templates">
                  <Table.Header columns={TABLE_COLUMNS}>
                    {(column: { key: string; label: string }) => (
                      <Table.Column key={column.key} isRowHeader={column.key === TABLE_COLUMNS[0].key}>
                        {column.label}
                      </Table.Column>
                    )}
                  </Table.Header>
                  <Table.Body>
                    {filteredTemplates.map((template) => (
                      <Table.Row key={template.key || "-"}>
                        {TABLE_COLUMNS.map((column: { key: string; label: string }) => (
                          <Table.Cell key={column.key}>
                            {renderCell(template, column.key)}
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
        <Modal.Backdrop isOpen={previewModal.isOpen} onOpenChange={(isOpen: boolean) => !isOpen && previewModal.onClose()}>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Previsualizar plantilla de email</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-[var(--muted)]">Titulo</p>
                    <p className="text-[var(--foreground)] font-medium">{previewTitle || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--muted)]">Cuerpo</p>
                    <p className="text-[var(--foreground)] text-sm whitespace-pre-wrap">{previewBody || "-"}</p>
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={previewModal.onClose}>
                  Cerrar
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
