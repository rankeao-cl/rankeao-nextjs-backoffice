"use client";

import { useState, useCallback } from "react";
import {
  Card,
  Chip,
  Input,
  Label,
  Skeleton,
  Table,
  TextField,
  Button,
} from "@heroui/react";
import { useXPLogs } from "@/lib/hooks/use-gamification";
import { useXPEvents } from "@/lib/hooks/use-gamification";
import type { XPLogsParams } from "@/lib/types/gamification";
import { ScrollText, Search, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";

const SOURCE_TYPES = ["DUEL", "MATCH", "TOURNAMENT", "SOCIAL", "SYSTEM", "MANUAL"];

const TABLE_COLUMNS = [
  { key: "user", label: "USUARIO" },
  { key: "event", label: "EVENTO" },
  { key: "xp", label: "XP" },
  { key: "total", label: "TOTAL XP" },
  { key: "source", label: "ORIGEN" },
  { key: "date", label: "FECHA" },
] as const;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sourceChipColor(source?: string): string {
  switch (source?.toUpperCase()) {
    case "DUEL": return "bg-purple-500/15 text-purple-400";
    case "MATCH": return "bg-blue-500/15 text-blue-400";
    case "TOURNAMENT": return "bg-emerald-500/15 text-emerald-400";
    case "SOCIAL": return "bg-cyan-500/15 text-cyan-400";
    case "MANUAL": return "bg-orange-500/15 text-orange-400";
    default: return "bg-[var(--surface)] text-[var(--muted)]";
  }
}

export default function XPLogsPage() {
  const { data: xpEvents = [] } = useXPEvents();

  const [filters, setFilters] = useState<XPLogsParams>({ page: 1, per_page: 50 });
  const [draft, setDraft] = useState({
    user_id: "",
    event_key: "",
    source_type: "",
    date_from: "",
    date_to: "",
  });

  const { data, isLoading, refetch, isFetching } = useXPLogs(filters);

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;
  const currentPage = data?.page ?? 1;
  const totalPages = data?.total_pages ?? 1;

  const applyFilters = useCallback(() => {
    const next: XPLogsParams = { page: 1, per_page: 50 };
    if (draft.user_id.trim()) next.user_id = parseInt(draft.user_id.trim(), 10);
    if (draft.event_key) next.event_key = draft.event_key;
    if (draft.source_type) next.source_type = draft.source_type;
    if (draft.date_from) next.date_from = draft.date_from;
    if (draft.date_to) next.date_to = draft.date_to;
    setFilters(next);
  }, [draft]);

  const clearFilters = () => {
    setDraft({ user_id: "", event_key: "", source_type: "", date_from: "", date_to: "" });
    setFilters({ page: 1, per_page: 50 });
  };

  const goToPage = (p: number) => setFilters((f) => ({ ...f, page: p }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-purple-cyan flex items-center gap-2">
            <ScrollText className="h-6 w-6" aria-hidden="true" />
            Logs XP
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Historial completo de otorgamiento de XP · {total.toLocaleString("es-CL")} registros
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onPress={() => refetch()}
          isPending={isFetching}
        >
          <RefreshCw className="h-4 w-4 mr-1" aria-hidden="true" />
          Actualizar
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-[var(--surface)] border border-[var(--border)]">
        <Card.Content className="px-5 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            <TextField className="space-y-1 flex flex-col">
              <Label className="text-xs text-[var(--muted)]">User ID</Label>
              <Input
                type="number"
                placeholder="ej: 42"
                value={draft.user_id}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                  setDraft((d) => ({ ...d, user_id: e.target.value }))
                }
              />
            </TextField>

            <TextField className="space-y-1 flex flex-col">
              <Label className="text-xs text-[var(--muted)]">Evento XP</Label>
              <select
                value={draft.event_key}
                onChange={(e) => setDraft((d) => ({ ...d, event_key: e.target.value }))}
                className="h-9 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              >
                <option value="">Todos</option>
                {xpEvents.map((ev) => (
                  <option key={ev.event_key} value={ev.event_key}>
                    {ev.event_key}
                  </option>
                ))}
              </select>
            </TextField>

            <TextField className="space-y-1 flex flex-col">
              <Label className="text-xs text-[var(--muted)]">Origen</Label>
              <select
                value={draft.source_type}
                onChange={(e) => setDraft((d) => ({ ...d, source_type: e.target.value }))}
                className="h-9 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              >
                <option value="">Todos</option>
                {SOURCE_TYPES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </TextField>

            <TextField className="space-y-1 flex flex-col">
              <Label className="text-xs text-[var(--muted)]">Desde</Label>
              <Input
                type="date"
                value={draft.date_from}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                  setDraft((d) => ({ ...d, date_from: e.target.value }))
                }
              />
            </TextField>

            <TextField className="space-y-1 flex flex-col">
              <Label className="text-xs text-[var(--muted)]">Hasta</Label>
              <Input
                type="date"
                value={draft.date_to}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                  setDraft((d) => ({ ...d, date_to: e.target.value }))
                }
              />
            </TextField>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Button type="button" onPress={applyFilters}>
              <Search className="h-4 w-4 mr-1" aria-hidden="true" />
              Filtrar
            </Button>
            <Button type="button" variant="tertiary" onPress={clearFilters}>
              Limpiar
            </Button>
          </div>
        </Card.Content>
      </Card>

      {/* Table */}
      <Card className="bg-[var(--surface)] border border-[var(--border)]">
        <Card.Content className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-full rounded" />
                    <Skeleton className="h-3 w-3/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center text-[var(--muted)]">
              <ScrollText className="h-10 w-10 mx-auto mb-3 opacity-30" aria-hidden="true" />
              <p className="text-sm font-medium">Sin registros</p>
              <p className="text-xs mt-1">Prueba ajustando los filtros</p>
            </div>
          ) : (
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Logs XP">
                  <Table.Header columns={TABLE_COLUMNS}>
                    {(col: typeof TABLE_COLUMNS[number]) => (
                      <Table.Column key={col.key} isRowHeader={col.key === "user"}>
                        {col.label}
                      </Table.Column>
                    )}
                  </Table.Header>
                  <Table.Body>
                    {logs.map((log) => (
                      <Table.Row key={log.id}>
                        <Table.Cell>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-[var(--foreground)]">
                              {log.username}
                            </span>
                            <span className="text-xs text-[var(--muted)]">#{log.user_id}</span>
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          <code className="text-xs bg-[var(--surface-solid)] px-1.5 py-0.5 rounded">
                            {log.event_key}
                          </code>
                        </Table.Cell>
                        <Table.Cell>
                          <span className="font-bold text-emerald-400">+{log.xp_earned}</span>
                        </Table.Cell>
                        <Table.Cell>
                          <span className="text-sm text-[var(--foreground)]">
                            {log.xp_total.toLocaleString("es-CL")}
                          </span>
                        </Table.Cell>
                        <Table.Cell>
                          {log.source_type ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${sourceChipColor(log.source_type)}`}
                            >
                              {log.source_type}
                              {log.source_id ? (
                                <span className="opacity-60">#{log.source_id}</span>
                              ) : null}
                            </span>
                          ) : (
                            <span className="text-[var(--muted)] text-xs">—</span>
                          )}
                        </Table.Cell>
                        <Table.Cell>
                          <span className="text-xs text-[var(--muted)]">
                            {formatDate(log.created_at)}
                          </span>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          )}
        </Card.Content>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-[var(--muted)]">
          <span>
            Página {currentPage} de {totalPages} · {total.toLocaleString("es-CL")} registros
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              isDisabled={currentPage <= 1}
              onPress={() => goToPage(currentPage - 1)}
              isIconOnly
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              isDisabled={currentPage >= totalPages}
              onPress={() => goToPage(currentPage + 1)}
              isIconOnly
              aria-label="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
