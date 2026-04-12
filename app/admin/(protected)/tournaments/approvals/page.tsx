"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ClipboardCheck, CheckCircle, XCircle } from "lucide-react";
import {
  usePendingTournaments,
  useApproveTournament,
  useRejectTournament,
} from "@/lib/hooks/use-tournaments";
import { getErrorMessage } from "@/lib/utils/error-message";
import type { TournamentListItem } from "@/lib/types/tournament";

const TABLE_COLUMNS = [
  { key: "name", label: "TORNEO" },
  { key: "modality", label: "MODALIDAD" },
  { key: "tier", label: "TIER" },
  { key: "players", label: "JUGADORES" },
  { key: "starts_at", label: "INICIO" },
  { key: "actions", label: "ACCIONES" },
] as const;

const EMPTY_META = { page: 1, per_page: 20, total: 0, total_pages: 1 };

export default function TournamentApprovalsPage() {
  const [page, setPage] = useState(1);
  const perPage = 20;

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const [selected, setSelected] = useState<TournamentListItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading } = usePendingTournaments({ page, per_page: perPage });
  const tournaments = data?.tournaments ?? [];
  const meta = data?.meta ?? EMPTY_META;

  const approveMutation = useApproveTournament();
  const rejectMutation = useRejectTournament();

  const handleApprove = () => {
    if (!selected) return;
    approveMutation.mutate(selected.id, {
      onSuccess: () => {
        toast.success(`Torneo "${selected.name}" aprobado`);
        setApproveOpen(false);
        setSelected(null);
      },
      onError: (err: unknown) => {
        toast.error(getErrorMessage(err, "Error al aprobar torneo"));
      },
    });
  };

  const handleReject = () => {
    if (!selected || !rejectReason.trim()) return;
    rejectMutation.mutate(
      { publicId: selected.id, reason: rejectReason.trim() },
      {
        onSuccess: () => {
          toast.success(`Torneo "${selected.name}" rechazado`);
          setRejectOpen(false);
          setSelected(null);
          setRejectReason("");
        },
        onError: (err: unknown) => {
          toast.error(getErrorMessage(err, "Error al rechazar torneo"));
        },
      }
    );
  };

  const renderCell = (t: TournamentListItem, columnKey: string) => {
    switch (columnKey) {
      case "name":
        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-sm text-[var(--foreground)]">{t.name}</span>
            <span className="text-xs text-[var(--muted-foreground)]">{t.slug}</span>
            {t.city && (
              <span className="text-xs text-[var(--muted-foreground)]">{t.city}{t.region ? `, ${t.region}` : ""}</span>
            )}
          </div>
        );
      case "modality":
        return (
          <span className="inline-flex items-center rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-xs font-medium text-[var(--foreground)]">
            {t.modality}
          </span>
        );
      case "tier":
        return (
          <span className="inline-flex items-center rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-xs font-medium text-[var(--foreground)]">
            {t.tier}
          </span>
        );
      case "players":
        return (
          <span className="text-sm text-[var(--muted-foreground)]">
            {t.current_players}{t.max_players ? `/${t.max_players}` : ""}
          </span>
        );
      case "starts_at":
        return (
          <span className="text-xs text-[var(--muted-foreground)]">
            {new Date(t.starts_at).toLocaleDateString("es-CL", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        );
      case "actions":
        return (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelected(t);
                setApproveOpen(true);
              }}
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
              Aprobar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelected(t);
                setRejectReason("");
                setRejectOpen(true);
              }}
            >
              <XCircle className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
              Rechazar
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
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-brand">
          Aprobaciones de Torneos
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Torneos en estado PENDING_APPROVAL esperando revisión.
        </p>
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
                    <Skeleton className="h-3 w-2/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : tournaments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--muted-foreground)]">
              <ClipboardCheck className="h-10 w-10 opacity-40" aria-hidden="true" />
              <p className="text-sm">No hay torneos pendientes de aprobación.</p>
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
                  {tournaments.map((t: TournamentListItem) => (
                    <tr key={t.id} className="border-b border-[var(--border)] last:border-b-0">
                      {TABLE_COLUMNS.map((col) => (
                        <td key={col.key} className="px-4 py-3">
                          {renderCell(t, col.key)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tournaments.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--muted-foreground)] px-5 py-3 border-t border-[var(--border)]">
              <span>
                Pagina {meta.page} de {meta.total_pages} | Total: {meta.total}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={!canPrev}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={!canNext}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Aprobar */}
      {approveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setApproveOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-elevated p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-5 w-5 text-[var(--foreground)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Aprobar Torneo</h2>
            </div>
            <div className="space-y-3 mb-6">
              <p className="text-sm text-[var(--muted-foreground)]">
                El torneo pasará a estado <strong className="text-[var(--foreground)]">OPEN</strong> y será visible para todos los jugadores.
              </p>
              {selected && (
                <div className="rounded-md border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 space-y-1">
                  <p className="font-semibold text-sm text-[var(--foreground)]">{selected.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{selected.slug}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {selected.modality} · {selected.tier} · {selected.city ?? "Online"}
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setApproveOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleApprove}
                disabled={approveMutation.isPending}
              >
                Confirmar aprobación
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Rechazar */}
      {rejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setRejectOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-elevated p-6">
            <div className="flex items-center gap-2 mb-4">
              <XCircle className="h-5 w-5 text-[var(--foreground)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Rechazar Torneo</h2>
            </div>
            <div className="space-y-3 mb-4">
              <p className="text-sm text-[var(--muted-foreground)]">
                El torneo pasará a estado <strong className="text-[var(--foreground)]">REJECTED</strong>. El motivo quedará registrado en los metadatos.
              </p>
              {selected && (
                <div className="rounded-md border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 space-y-1">
                  <p className="font-semibold text-sm text-[var(--foreground)]">{selected.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{selected.slug}</p>
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-xs text-[var(--muted-foreground)]">Motivo del rechazo <span className="text-red-400">*</span></Label>
                <Textarea
                  placeholder="ej: El torneo no cumple con los requisitos mínimos de jugadores o el premio no está verificado."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRejectOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleReject}
                disabled={rejectMutation.isPending || !rejectReason.trim()}
              >
                Confirmar rechazo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
