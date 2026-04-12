"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useBroadcasts, useCreateBroadcast } from "@/lib/hooks/use-notifications";
import type { Broadcast, CreateBroadcastRequest } from "@/lib/types/notification";
import type { ListMeta } from "@/lib/types/api";
import { Radio, Send } from "lucide-react";

const TARGET_OPTIONS = ["ALL", "ACTIVE_7D", "SELLERS", "JUDGES", "TENANT_OWNERS"];

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
  const [queryFilter, setQueryFilter] = useState("");
  const [targetFilter, setTargetFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [perPageInput, setPerPageInput] = useState("20");

  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    target: "ALL",
    action_url: "",
    channels: "IN_APP",
    schedule_at: "",
  });

  const perPage = Math.max(1, Number.parseInt(perPageInput, 10) || 20);

  const { data, isLoading: loading } = useBroadcasts({ page, per_page: perPage });
  const broadcasts: Broadcast[] = data?.broadcasts ?? [];
  const meta: ListMeta = data?.meta ?? EMPTY_META;

  const createMutation = useCreateBroadcast();

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
    }
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.body) {
      toast.error("Titulo y body son requeridos");
      return;
    }

    const payload: CreateBroadcastRequest = {
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
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Broadcast creado");
        setCreateOpen(false);
        setFormData({
          title: "",
          body: "",
          target: "ALL",
          action_url: "",
          channels: "IN_APP",
          schedule_at: "",
        });
      },
      onError: (error: unknown) => {
        const message =
          error instanceof Error ? error.message : "Error al crear broadcast";
        toast.error(message);
      },
    });
  };

  const renderCell = (broadcast: Broadcast, columnKey: string) => {
    switch (columnKey) {
      case "title":
        return (
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-[var(--foreground)]" aria-hidden="true" />
            <span className="font-medium">{String(broadcast.title || "-")}</span>
          </div>
        );
      case "target":
        return (
          <span className="inline-flex items-center rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-xs font-medium text-[var(--foreground)]">
            {String(broadcast.target || "-")}
          </span>
        );
      case "status":
        return (
          <span className="inline-flex items-center rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-xs font-medium text-[var(--foreground)]">
            {String(broadcast.status || "-")}
          </span>
        );
      case "recipients":
        return String(broadcast.recipients ?? "-");
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
          <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-brand">
            Difusiones
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Notificaciones masivas a grupos de usuarios</p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          Nueva difusion
        </Button>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
        <div className="px-5 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1 flex flex-col min-w-[140px] flex-1">
              <Label className="text-xs text-[var(--muted-foreground)]">Titulo</Label>
              <Input placeholder="texto" value={queryFilter} onChange={(e) => setQueryFilter(e.target.value)} />
            </div>
            <div className="space-y-1 flex flex-col min-w-[140px] flex-1">
              <Label className="text-xs text-[var(--muted-foreground)]">Target</Label>
              <Input placeholder="ALL, SEGMENT..." value={targetFilter} onChange={(e) => setTargetFilter(e.target.value)} />
            </div>
            <div className="space-y-1 flex flex-col min-w-[140px] flex-1">
              <Label className="text-xs text-[var(--muted-foreground)]">Estado</Label>
              <Input placeholder="PENDING, SENT..." value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
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
            <Button type="button" size="sm" onClick={applyPagination}>Aplicar</Button>
            <Button type="button" size="sm" variant="ghost" onClick={clearFilters}>Limpiar</Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
        <div className="p-0">
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
                  {filteredBroadcasts.map((broadcast) => (
                    <tr key={String(broadcast.id || String(broadcast.title || "-"))} className="border-b border-[var(--border)] last:border-b-0">
                      {TABLE_COLUMNS.map((column) => (
                        <td key={column.key} className="px-4 py-3">
                          {renderCell(broadcast, column.key)}
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

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setCreateOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-elevated p-6">
            <div className="flex items-center gap-2 mb-4">
              <Send className="h-5 w-5 text-[var(--foreground)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Crear difusion</h2>
            </div>
            <div className="space-y-4 mb-6">
              <div className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted-foreground)]">Titulo</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted-foreground)]">Mensaje</Label>
                <Textarea
                  value={formData.body}
                  onChange={(e) => setFormData((prev) => ({ ...prev, body: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Target</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={formData.target}
                    onChange={(e) => setFormData((prev) => ({ ...prev, target: e.target.value }))}
                  >
                    {TARGET_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Canales</Label>
                  <Input
                    placeholder="IN_APP,EMAIL..."
                    value={formData.channels}
                    onChange={(e) => setFormData((prev) => ({ ...prev, channels: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Action URL</Label>
                  <Input
                    value={formData.action_url}
                    onChange={(e) => setFormData((prev) => ({ ...prev, action_url: e.target.value }))}
                  />
                </div>
                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Programar para</Label>
                  <Input
                    type="datetime-local"
                    value={formData.schedule_at}
                    onChange={(e) => setFormData((prev) => ({ ...prev, schedule_at: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button type="button" onClick={handleCreate} disabled={createMutation.isPending}>Enviar difusion</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
