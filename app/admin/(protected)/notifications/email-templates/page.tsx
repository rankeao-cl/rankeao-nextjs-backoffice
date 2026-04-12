"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useEmailTemplates,
  usePreviewEmailTemplate,
} from "@/lib/hooks/use-notifications";
import type { EmailTemplate } from "@/lib/types/notification";
import { getErrorMessage } from "@/lib/utils/error-message";
import { Eye, Mail } from "lucide-react";

const TABLE_COLUMNS = [
  { key: "key", label: "KEY" },
  { key: "category", label: "CATEGORIA" },
  { key: "channels", label: "CANALES" },
  { key: "actions", label: "ACCIONES" },
] as const;

export default function EmailTemplatesPage() {
  const [search, setSearch] = useState("");

  const [previewOpen, setPreviewOpen] = useState(false);
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
      toast.error("Template key invalido");
      return;
    }

    previewMutation.mutate(templateKey, {
      onSuccess: (result) => {
        const data = (result as Record<string, unknown>).data as Record<string, unknown> | undefined;
        const resolved = data || (result as Record<string, unknown>);
        setPreviewTitle(String(resolved.title || ""));
        setPreviewBody(String(resolved.body || ""));
        setPreviewOpen(true);
      },
      onError: (error: unknown) => {
        toast.error(getErrorMessage(error));
      },
    });
  };

  const renderCell = (template: EmailTemplate, columnKey: string) => {
    switch (columnKey) {
      case "key":
        return (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-[var(--foreground)]" aria-hidden="true" />
            <code className="text-xs">{template.key || "-"}</code>
          </div>
        );
      case "category":
        return <span className="text-sm text-[var(--foreground)]">{template.category || "-"}</span>;
      case "channels":
        return (
          <span className="text-xs text-[var(--muted-foreground)]">
            {Array.isArray(template.channels)
              ? (template.channels as string[]).join(", ")
              : "EMAIL"}
          </span>
        );
      case "actions":
        return (
          <Button
            size="icon"
            variant="ghost"
            aria-label="Previsualizar plantilla de email"
            onClick={() => handlePreview(template.key || "")}
          >
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
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
          <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-brand">
            Plantillas de Email
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Lista y preview de templates de correo.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--c-gray-200)] bg-white">
        <div className="px-5 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1 flex flex-col min-w-[200px] flex-1">
              <Label className="text-xs text-[var(--muted-foreground)]">Busqueda</Label>
              <Input
                placeholder="Key o categoría..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--c-gray-200)] bg-white">
        <div className="p-0">
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[var(--c-gray-50)]">
                  <tr>
                    {TABLE_COLUMNS.map((col) => (
                      <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)]">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTemplates.map((template) => (
                    <tr key={template.key || "-"} className="border-b border-[var(--border)] last:border-b-0">
                      {TABLE_COLUMNS.map((column) => (
                        <td key={column.key} className="px-4 py-3">
                          {renderCell(template, column.key)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setPreviewOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-white border border-[var(--c-gray-200)] shadow-elevated p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Previsualizar plantilla de email</h2>
            <div className="space-y-3 mb-6">
              <div>
                <p className="text-xs text-[var(--muted-foreground)]">Titulo</p>
                <p className="text-[var(--foreground)] font-medium">{previewTitle || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--muted-foreground)]">Cuerpo</p>
                <p className="text-[var(--foreground)] text-sm whitespace-pre-wrap">{previewBody || "-"}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => setPreviewOpen(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
