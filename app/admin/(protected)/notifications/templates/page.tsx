"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  usePreviewTemplate,
  useTestTemplate,
} from "@/lib/hooks/use-notifications";
import type {
  Template,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  TestTemplateRequest,
} from "@/lib/types/notification";
import type { ListMeta } from "@/lib/types/api";
import { getErrorMessage } from "@/lib/utils/error-message";
import { Bell, Edit, Eye, Send } from "lucide-react";

type ActiveFilter = "all" | "true" | "false";

const TABLE_COLUMNS = [
  { key: "key", label: "KEY" },
  { key: "category", label: "CATEGORIA" },
  { key: "priority", label: "PRIORIDAD" },
  { key: "channels", label: "CANALES" },
  { key: "status", label: "ESTADO" },
  { key: "actions", label: "ACCIONES" },
] as const;

const EMPTY_META: ListMeta = {
  page: 1,
  per_page: 20,
  total: 0,
  total_pages: 1,
};

const CATEGORY_OPTIONS = ["system", "social", "marketplace", "tournament"];
const PRIORITY_OPTIONS = ["LOW", "NORMAL", "HIGH", "URGENT"];

function parseJsonObject(text: string, fieldName: string): Record<string, string> {
  if (!text.trim()) {
    return {};
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`${fieldName} debe ser JSON valido`);
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`${fieldName} debe ser un objeto JSON`);
  }

  const output: Record<string, string> = {};
  Object.entries(parsed as Record<string, unknown>).forEach(([key, value]) => {
    output[key] = String(value ?? "");
  });

  return output;
}

export default function TemplatesPage() {
  // -- Filters & pagination --------------------------------------------------
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [isActive, setIsActive] = useState<ActiveFilter>("all");
  const [page, setPage] = useState(1);
  const [perPageInput, setPerPageInput] = useState("20");

  const perPage = Math.max(1, Number.parseInt(perPageInput, 10) || 20);

  // -- React Query -----------------------------------------------------------
  const { data, isLoading } = useTemplates({
    q: query || undefined,
    category: category || undefined,
    is_active: isActive === "all" ? undefined : isActive === "true",
    page,
    per_page: perPage,
  });

  const templates: Template[] = data?.templates ?? [];
  const meta: ListMeta = data?.meta ?? EMPTY_META;

  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();
  const previewMutation = usePreviewTemplate();
  const testMutation = useTestTemplate();

  // -- Create / Edit modal ---------------------------------------------------
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    key: "",
    category: "system",
    title_template: "",
    body_template: "",
    channels: "IN_APP",
    priority: "NORMAL",
    is_active: true,
  });

  // -- Preview modal ---------------------------------------------------------
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<Template | null>(null);
  const [previewVariablesText, setPreviewVariablesText] = useState("{}");
  const [previewData, setPreviewData] = useState<Record<string, unknown> | null>(null);

  // -- Test modal ------------------------------------------------------------
  const [testOpen, setTestOpen] = useState(false);
  const [testTarget, setTestTarget] = useState<Template | null>(null);
  const [testUserId, setTestUserId] = useState("");
  const [testChannels, setTestChannels] = useState("IN_APP");
  const [testVariablesText, setTestVariablesText] = useState("{}");

  // -- Handlers --------------------------------------------------------------

  const applyFilters = () => {
    if (page !== 1) {
      setPage(1);
    }
  };

  const clearFilters = () => {
    setQuery("");
    setCategory("");
    setIsActive("all");
    setPerPageInput("20");
    setPage(1);
  };

  const openCreate = () => {
    setEditTarget(null);
    setFormData({
      key: "",
      category: "system",
      title_template: "",
      body_template: "",
      channels: "IN_APP",
      priority: "NORMAL",
      is_active: true,
    });
    setCreateOpen(true);
  };

  const openEdit = (template: Template) => {
    setEditTarget(template);
    setFormData({
      key: String(template.key || ""),
      category: String(template.category || "system"),
      title_template: String(template.title_template || ""),
      body_template: String(template.body_template || ""),
      channels: Array.isArray(template.channels)
        ? template.channels.join(",")
        : "IN_APP",
      priority: String(template.priority || "NORMAL"),
      is_active: Boolean(template.is_active ?? true),
    });
    setCreateOpen(true);
  };

  const handleSave = () => {
    const channelList = formData.channels
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (editTarget?.id) {
      const payload: UpdateTemplateRequest = {
        title_template: formData.title_template,
        body_template: formData.body_template,
        channels: channelList,
        priority: formData.priority,
        is_active: formData.is_active,
      };

      updateMutation.mutate(
        { id: editTarget.id, data: payload },
        {
          onSuccess: () => {
            toast.success("Template actualizado");
            setCreateOpen(false);
          },
          onError: (error: unknown) => {
            toast.error(getErrorMessage(error));
          },
        },
      );
    } else {
      const payload: CreateTemplateRequest = {
        key: formData.key,
        category: formData.category,
        title_template: formData.title_template,
        body_template: formData.body_template,
        channels: channelList,
        priority: formData.priority,
      };

      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Template creado");
          setCreateOpen(false);
        },
        onError: (error: unknown) => {
          toast.error(getErrorMessage(error));
        },
      });
    }
  };

  const openPreview = (template: Template) => {
    setPreviewTarget(template);
    setPreviewVariablesText("{}");
    setPreviewData(null);
    setPreviewOpen(true);
  };

  const handlePreview = () => {
    if (!previewTarget?.id) {
      return;
    }

    try {
      const variables = parseJsonObject(previewVariablesText, "variables");

      previewMutation.mutate(
        {
          id: previewTarget.id,
          variables: Object.keys(variables).length ? variables : undefined,
        },
        {
          onSuccess: (result) => {
            setPreviewData(result as Record<string, unknown>);
          },
          onError: (error: unknown) => {
            toast.error(getErrorMessage(error));
          },
        },
      );
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  };

  const openTest = (template: Template) => {
    setTestTarget(template);
    setTestUserId("");
    setTestChannels(
      Array.isArray(template.channels) ? template.channels.join(",") : "IN_APP",
    );
    setTestVariablesText("{}");
    setTestOpen(true);
  };

  const handleTest = () => {
    if (!testTarget?.id) return;
    if (!testUserId) {
      toast.error("User ID es requerido");
      return;
    }

    try {
      const variables = parseJsonObject(testVariablesText, "variables");
      const channels = testChannels
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      const payload: TestTemplateRequest = {
        user_id: Number.parseInt(testUserId, 10),
        channels: channels.length ? channels : undefined,
        variables: Object.keys(variables).length ? variables : undefined,
      };

      testMutation.mutate(
        { id: testTarget.id, data: payload },
        {
          onSuccess: () => {
            toast.success("Test notification sent");
            setTestOpen(false);
          },
          onError: (error: unknown) => {
            toast.error(getErrorMessage(error));
          },
        },
      );
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  };

  // -- Render helpers --------------------------------------------------------

  const formLoading = createMutation.isPending || updateMutation.isPending;

  const renderCell = (template: Template, columnKey: string) => {
    switch (columnKey) {
      case "key":
        return (
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-[var(--foreground)]" aria-hidden="true" />
            <code className="text-xs">{String(template.key || "-")}</code>
          </div>
        );
      case "category":
        return (
          <span className="inline-flex items-center rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-xs font-medium text-[var(--foreground)]">
            {String(template.category || "-")}
          </span>
        );
      case "priority":
        return (
          <span className="inline-flex items-center rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-xs font-medium text-[var(--foreground)]">
            {String(template.priority || "-")}
          </span>
        );
      case "channels":
        return (
          <span className="text-xs">
            {Array.isArray(template.channels)
              ? template.channels.join(", ")
              : "-"}
          </span>
        );
      case "status":
        return (
          <span className="inline-flex items-center rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-xs font-medium text-[var(--foreground)]">
            {template.is_active ? "Activo" : "Inactivo"}
          </span>
        );
      case "actions":
        return (
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" aria-label="Editar plantilla" onClick={() => openEdit(template)}>
              <Edit className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
            <Button size="icon" variant="ghost" aria-label="Previsualizar plantilla" onClick={() => openPreview(template)}>
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
            <Button size="icon" variant="ghost" aria-label="Enviar prueba" onClick={() => openTest(template)}>
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        );
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
          <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-brand">
            Plantillas de Notificacion
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">CRUD completo con preview y test usando variables</p>
        </div>
        <Button type="button" onClick={openCreate}>
          Nueva plantilla
        </Button>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
        <div className="px-5 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1 flex flex-col min-w-[160px] flex-1">
              <Label className="text-xs text-[var(--muted-foreground)]">Busqueda</Label>
              <Input placeholder="texto libre" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>

            <div className="space-y-1 flex flex-col min-w-[160px] flex-1">
              <Label className="text-xs text-[var(--muted-foreground)]">Categoria</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Todas</option>
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1 flex flex-col w-24">
              <Label className="text-xs text-[var(--muted-foreground)]">Per page</Label>
              <Input
                type="number"
                min={1}
                value={perPageInput}
                onChange={(e) => setPerPageInput(e.target.value)}
              />
            </div>

            <div className="space-y-1 flex flex-col min-w-[120px]">
              <Label className="text-xs text-[var(--muted-foreground)]">Estado</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={isActive}
                onChange={(e) => setIsActive(e.target.value as ActiveFilter)}
              >
                <option value="all">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            </div>

            <Button type="button" size="sm" onClick={applyFilters}>Aplicar filtros</Button>
            <Button type="button" size="sm" variant="ghost" onClick={clearFilters}>Limpiar</Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
        <div className="p-0">
          {isLoading ? (
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[var(--surface)]">
                  <tr>
                    {TABLE_COLUMNS.map((col) => (
                      <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)]">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {templates.map((template) => (
                    <tr key={String(template.id || template.key || "-")} className="border-b border-[var(--border)] last:border-b-0">
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

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--muted-foreground)] px-5 py-3 border-t border-[var(--border)]">
            <span>
              Pagina {meta.page} de {meta.total_pages} | Total aproximado: {meta.total}
            </span>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="ghost" disabled={!canPrev} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
                Anterior
              </Button>
              <Button type="button" size="sm" variant="ghost" disabled={!canNext} onClick={() => setPage((prev) => prev + 1)}>
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Create / Edit */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setCreateOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-elevated p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
              {editTarget ? "Editar plantilla" : "Crear plantilla"}
            </h2>
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Key</Label>
                  <Input
                    value={formData.key}
                    onChange={(e) => setFormData((prev) => ({ ...prev, key: e.target.value }))}
                    disabled={Boolean(editTarget)}
                  />
                </div>
                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Categoria</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={formData.category}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                  >
                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted-foreground)]">Titulo plantilla</Label>
                <Input
                  value={formData.title_template}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title_template: e.target.value }))}
                />
              </div>

              <div className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted-foreground)]">Cuerpo plantilla</Label>
                <Textarea
                  value={formData.body_template}
                  onChange={(e) => setFormData((prev) => ({ ...prev, body_template: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Canales</Label>
                  <Input
                    placeholder="IN_APP,EMAIL..."
                    value={formData.channels}
                    onChange={(e) => setFormData((prev) => ({ ...prev, channels: e.target.value }))}
                  />
                </div>
                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Prioridad</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={formData.priority}
                    onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value }))}
                  >
                    {PRIORITY_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={formData.is_active ? "default" : "ghost"}
                  onClick={() => setFormData((prev) => ({ ...prev, is_active: !prev.is_active }))}
                >
                  is_active: {formData.is_active ? "true" : "false"}
                </Button>
                <p className="text-xs text-[var(--muted-foreground)]">Se envía en update.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button type="button" onClick={handleSave} disabled={formLoading}>
                {editTarget ? "Guardar" : "Crear"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Preview */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setPreviewOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-elevated p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
              Previsualizar plantilla - {String(previewTarget?.key || "")}
            </h2>
            <div className="space-y-4 mb-6">
              <div className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted-foreground)]">Variables (JSON)</Label>
                <Textarea
                  placeholder='{"username":"demo"}'
                  value={previewVariablesText}
                  onChange={(e) => setPreviewVariablesText(e.target.value)}
                  rows={4}
                  className="font-mono text-xs"
                />
              </div>
              <div>
                <Button type="button" size="sm" variant="ghost" onClick={handlePreview} disabled={previewMutation.isPending}>
                  Renderizar preview
                </Button>
              </div>

              {previewData ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-[var(--muted-foreground)]">Titulo</label>
                    <p className="text-[var(--foreground)] font-medium">
                      {String((previewData.data as Record<string, unknown>)?.title || previewData.title || "")}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--muted-foreground)]">Cuerpo</label>
                    <p className="text-[var(--foreground)] text-sm whitespace-pre-wrap">
                      {String((previewData.data as Record<string, unknown>)?.body || previewData.body || "")}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="flex justify-end">
              <Button type="button" variant="ghost" onClick={() => setPreviewOpen(false)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Test */}
      {testOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setTestOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-elevated p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
              Enviar prueba - {String(testTarget?.key || "")}
            </h2>
            <div className="space-y-4 mb-6">
              <div className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted-foreground)]">User ID</Label>
                <Input
                  value={testUserId}
                  onChange={(e) => setTestUserId(e.target.value)}
                  type="number"
                />
              </div>
              <div className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted-foreground)]">Canales</Label>
                <Input
                  placeholder="IN_APP,EMAIL,PUSH,SMS"
                  value={testChannels}
                  onChange={(e) => setTestChannels(e.target.value)}
                />
              </div>
              <div className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted-foreground)]">Variables (JSON)</Label>
                <Textarea
                  placeholder='{"username":"demo"}'
                  value={testVariablesText}
                  onChange={(e) => setTestVariablesText(e.target.value)}
                  rows={4}
                  className="font-mono text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setTestOpen(false)}>Cancelar</Button>
              <Button type="button" onClick={handleTest} disabled={testMutation.isPending}>Enviar prueba</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
