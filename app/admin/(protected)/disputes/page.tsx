"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDisputes,
  useAssignDispute,
  useResolveDispute,
  useDisputedDuels,
  useAdminResolveDuel,
  useDisputedMatches,
  useAdminResolveMatch,
} from "@/lib/hooks/use-disputes";
import { getErrorMessage } from "@/lib/utils/error-message";
import type { Dispute, DuelDispute, MatchDispute } from "@/lib/types/dispute";
import { Scale } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabKey = "marketplace" | "duelos" | "matches";

type ResolutionForm = {
  outcome: string;
  refund_amount: number;
  notes: string;
  sanction: string;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MARKETPLACE_COLUMNS = [
  { key: "id", label: "ID" },
  { key: "reason", label: "RAZON" },
  { key: "status", label: "ESTADO" },
  { key: "moderator", label: "MODERADOR" },
  { key: "actions", label: "ACCIONES" },
] as const;

const DUEL_COLUMNS = [
  { key: "duel", label: "DUELO" },
  { key: "game", label: "JUEGO" },
  { key: "score", label: "MARCADOR" },
  { key: "created_at", label: "FECHA" },
  { key: "actions", label: "ACCIONES" },
] as const;

const MATCH_COLUMNS = [
  { key: "tournament", label: "TORNEO" },
  { key: "round", label: "RONDA" },
  { key: "players", label: "JUGADORES" },
  { key: "score", label: "MARCADOR" },
  { key: "disputed_at", label: "DISPUTADO" },
  { key: "actions", label: "ACCIONES" },
] as const;

const EMPTY_META = {
  page: 1,
  per_page: 20,
  total: 0,
  total_pages: 1,
};

// ---------------------------------------------------------------------------
// Marketplace tab
// ---------------------------------------------------------------------------

function MarketplaceDisputesTab() {
  const [idSearch, setIdSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [reasonFilter, setReasonFilter] = useState("");
  const [assignedModeratorFilter, setAssignedModeratorFilter] = useState("");
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [perPageInput, setPerPageInput] = useState("20");

  const [assignOpen, setAssignOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);

  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [moderatorId, setModeratorId] = useState("");

  const [resolution, setResolution] = useState<ResolutionForm>({
    outcome: "FULL_REFUND",
    refund_amount: 0,
    notes: "",
    sanction: "",
  });

  const perPage = Math.max(1, Number.parseInt(perPageInput, 10) || 20);

  const filters = useMemo(
    () => ({
      status: statusFilter || undefined,
      reason: reasonFilter || undefined,
      assigned_moderator_id: assignedModeratorFilter || undefined,
      unassigned: unassignedOnly ? true : undefined,
      page,
      per_page: perPage,
    }),
    [statusFilter, reasonFilter, assignedModeratorFilter, unassignedOnly, page, perPage]
  );

  const { data, isLoading } = useDisputes(filters);
  const disputes = data?.disputes ?? [];
  const meta = data?.meta ?? EMPTY_META;

  const assignMutation = useAssignDispute();
  const resolveMutation = useResolveDispute();

  const filteredDisputes = useMemo(() => {
    const q = idSearch.toLowerCase();
    if (!q) return disputes;
    return disputes.filter((dispute) => String(dispute.id || "").toLowerCase().includes(q));
  }, [disputes, idSearch]);

  const applyFilters = () => {
    if (page !== 1) setPage(1);
  };

  const clearFilters = () => {
    setStatusFilter("");
    setReasonFilter("");
    setAssignedModeratorFilter("");
    setUnassignedOnly(false);
    setIdSearch("");
    setPerPageInput("20");
    setPage(1);
  };

  const handleAssign = () => {
    if (!selectedDispute || !moderatorId) return;
    assignMutation.mutate(
      { disputeId: String(selectedDispute.id), data: { moderator_id: moderatorId } },
      {
        onSuccess: () => {
          toast.success("Moderador asignado");
          setAssignOpen(false);
        },
        onError: (error: unknown) => {
          toast.error(getErrorMessage(error));
        },
      }
    );
  };

  const handleResolve = () => {
    if (!selectedDispute) return;
    resolveMutation.mutate(
      {
        disputeId: String(selectedDispute.id),
        data: {
          outcome: resolution.outcome,
          refund_amount: resolution.refund_amount || undefined,
          notes: resolution.notes || undefined,
          sanction: resolution.sanction || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success("Disputa resuelta");
          setResolveOpen(false);
        },
        onError: (error: unknown) => {
          toast.error(getErrorMessage(error));
        },
      }
    );
  };

  const renderCell = (dispute: Dispute, columnKey: string) => {
    switch (columnKey) {
      case "id":
        return <code className="text-xs text-[var(--muted-foreground)]">{String(dispute.id).slice(0, 8)}...</code>;
      case "reason":
        return <span className="text-sm">{String(dispute.reason || "-")}</span>;
      case "status":
        return (
          <span className="inline-flex items-center rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-xs font-medium text-[var(--foreground)]">
            {String(dispute.status || "-")}
          </span>
        );
      case "moderator":
        return (
          <span className="text-xs text-[var(--muted-foreground)]">
            {dispute.moderator_id ? `${String(dispute.moderator_id).slice(0, 8)}...` : "Sin asignar"}
          </span>
        );
      case "actions":
        return (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedDispute(dispute);
                setModeratorId("");
                setAssignOpen(true);
              }}
            >
              Asignar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedDispute(dispute);
                setResolution({ outcome: "FULL_REFUND", refund_amount: 0, notes: "", sanction: "" });
                setResolveOpen(true);
              }}
            >
              Resolver
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
    <>
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
        <div className="px-5 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1 flex flex-col min-w-[140px] flex-1">
              <Label className="text-xs text-[var(--muted-foreground)]">ID (local)</Label>
              <Input value={idSearch} onChange={(e) => setIdSearch(e.target.value)} />
            </div>
            <div className="space-y-1 flex flex-col min-w-[140px] flex-1">
              <Label className="text-xs text-[var(--muted-foreground)]">Estado</Label>
              <Input placeholder="OPEN, RESOLVED..." value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
            </div>
            <div className="space-y-1 flex flex-col min-w-[140px] flex-1">
              <Label className="text-xs text-[var(--muted-foreground)]">Razon</Label>
              <Input value={reasonFilter} onChange={(e) => setReasonFilter(e.target.value)} />
            </div>
            <div className="space-y-1 flex flex-col min-w-[140px] flex-1">
              <Label className="text-xs text-[var(--muted-foreground)]">Moderador ID</Label>
              <Input value={assignedModeratorFilter} onChange={(e) => setAssignedModeratorFilter(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Input
              className="w-28"
              type="number"
              min={1}
              value={perPageInput}
              onChange={(e) => setPerPageInput(e.target.value)}
              placeholder="per_page"
            />
            <Button
              type="button"
              size="sm"
              variant={unassignedOnly ? "default" : "ghost"}
              onClick={() => setUnassignedOnly((prev) => !prev)}
            >
              Solo sin asignar
            </Button>
            <Button type="button" size="sm" onClick={applyFilters}>
              Aplicar filtros
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={clearFilters}>
              Limpiar
            </Button>
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
                    {MARKETPLACE_COLUMNS.map((col) => (
                      <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)]">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredDisputes.length === 0 ? (
                    <tr>
                      <td colSpan={MARKETPLACE_COLUMNS.length} className="px-4 py-3">
                        <p className="text-center text-sm text-[var(--muted-foreground)] py-6">
                          No hay disputas de marketplace actualmente
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredDisputes.map((dispute) => (
                      <tr key={String(dispute.id)} className="border-b border-[var(--border)] last:border-b-0">
                        {MARKETPLACE_COLUMNS.map((column) => (
                          <td key={column.key} className="px-4 py-3">
                            {renderCell(dispute, column.key)}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
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

      {/* Modal: Asignar Moderador */}
      {assignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setAssignOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-elevated p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Asignar Moderador</h2>
            <div className="space-y-4 mb-6">
              <p className="text-xs text-[var(--muted-foreground)]">Disputa: {String(selectedDispute?.id || "")}</p>
              <div className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted-foreground)]">Moderador ID</Label>
                <Input value={moderatorId} onChange={(e) => setModeratorId(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setAssignOpen(false)}>Cancelar</Button>
              <Button onClick={handleAssign} disabled={assignMutation.isPending}>Asignar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Resolver Disputa */}
      {resolveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setResolveOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-elevated p-6">
            <div className="flex items-center gap-2 mb-4">
              <Scale className="h-5 w-5 text-[var(--foreground)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Resolver Disputa</h2>
            </div>
            <div className="space-y-4 mb-6">
              <div className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted-foreground)]">Outcome</Label>
                <Input
                  value={resolution.outcome}
                  onChange={(e) => setResolution((prev) => ({ ...prev, outcome: e.target.value }))}
                />
              </div>
              <div className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted-foreground)]">Refund amount</Label>
                <Input
                  type="number"
                  value={String(resolution.refund_amount)}
                  onChange={(e) =>
                    setResolution((prev) => ({ ...prev, refund_amount: Number.parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
              <div className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted-foreground)]">Notas</Label>
                <Textarea
                  value={resolution.notes}
                  onChange={(e) => setResolution((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              <div className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted-foreground)]">Sancion</Label>
                <Input
                  value={resolution.sanction}
                  onChange={(e) => setResolution((prev) => ({ ...prev, sanction: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setResolveOpen(false)}>Cancelar</Button>
              <Button onClick={handleResolve} disabled={resolveMutation.isPending}>Resolver</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Duelos tab
// ---------------------------------------------------------------------------

function DuelosDisputesTab() {
  const [page, setPage] = useState(1);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [selectedDuel, setSelectedDuel] = useState<DuelDispute | null>(null);
  const [winnerId, setWinnerId] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const filters = useMemo(() => ({ page, per_page: 20 }), [page]);

  const { data, isLoading } = useDisputedDuels(filters);
  const duels = data?.duels ?? [];
  const meta = data?.meta ?? EMPTY_META;

  const resolveMutation = useAdminResolveDuel();

  const handleResolve = () => {
    if (!selectedDuel || adminNotes.trim().length < 5) return;
    resolveMutation.mutate(
      {
        duelId: selectedDuel.id,
        data: {
          winner_id: winnerId.trim() || null,
          admin_notes: adminNotes.trim(),
        },
      },
      {
        onSuccess: () => {
          toast.success("Duelo resuelto");
          setResolveOpen(false);
          setWinnerId("");
          setAdminNotes("");
        },
        onError: (error: unknown) => {
          toast.error(getErrorMessage(error));
        },
      }
    );
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  const renderCell = (duel: DuelDispute, columnKey: string) => {
    switch (columnKey) {
      case "duel":
        return (
          <span className="text-sm font-medium">
            {duel.challenger_username} <span className="text-[var(--muted-foreground)]">vs</span> {duel.challenged_username}
          </span>
        );
      case "game":
        return <span className="text-sm">{duel.game_name}</span>;
      case "score":
        return (
          <span className="text-sm font-mono">
            {duel.score_challenger} - {duel.score_challenged}
          </span>
        );
      case "created_at":
        return <span className="text-xs text-[var(--muted-foreground)]">{formatDate(duel.created_at)}</span>;
      case "actions":
        return (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSelectedDuel(duel);
              setWinnerId("");
              setAdminNotes("");
              setResolveOpen(true);
            }}
          >
            Resolver
          </Button>
        );
      default:
        return null;
    }
  };

  const canPrev = page > 1;
  const canNext = page < Math.max(1, meta.total_pages);

  return (
    <>
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
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
                <thead className="bg-[var(--surface)]">
                  <tr>
                    {DUEL_COLUMNS.map((col) => (
                      <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)]">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {duels.length === 0 ? (
                    <tr>
                      <td colSpan={DUEL_COLUMNS.length} className="px-4 py-3">
                        <p className="text-center text-sm text-[var(--muted-foreground)] py-6">
                          No hay duelos disputados actualmente
                        </p>
                      </td>
                    </tr>
                  ) : (
                    duels.map((duel) => (
                      <tr key={duel.id} className="border-b border-[var(--border)] last:border-b-0">
                        {DUEL_COLUMNS.map((column) => (
                          <td key={column.key} className="px-4 py-3">
                            {renderCell(duel, column.key)}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--muted-foreground)] px-5 py-3 border-t border-[var(--border)]">
            <span>
              Pagina {meta.page} de {meta.total_pages} | Total: {meta.total}
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

      {resolveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setResolveOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-elevated p-6">
            <div className="flex items-center gap-2 mb-4">
              <Scale className="h-5 w-5 text-[var(--foreground)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Resolver Duelo</h2>
            </div>
            <div className="space-y-4 mb-6">
              {selectedDuel && (
                <p className="text-xs text-[var(--muted-foreground)]">
                  {selectedDuel.challenger_username} vs {selectedDuel.challenged_username} — {selectedDuel.game_name}
                </p>
              )}
              <div className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted-foreground)]">UUID del ganador (dejar vacío para empate)</Label>
                <Input
                  value={winnerId}
                  placeholder="UUID del ganador, o vacío para empate"
                  onChange={(e) => setWinnerId(e.target.value)}
                />
              </div>
              <div className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted-foreground)]">Notas del admin (mínimo 5 caracteres) *</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setResolveOpen(false)}>Cancelar</Button>
              <Button
                onClick={handleResolve}
                disabled={resolveMutation.isPending || adminNotes.trim().length < 5}
              >
                Resolver
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Matches torneos tab
// ---------------------------------------------------------------------------

function MatchesDisputesTab() {
  const [page, setPage] = useState(1);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchDispute | null>(null);
  const [p1Wins, setP1Wins] = useState("0");
  const [p2Wins, setP2Wins] = useState("0");
  const [draws, setDraws] = useState("0");
  const [notes, setNotes] = useState("");

  const filters = useMemo(() => ({ page, per_page: 20 }), [page]);

  const { data, isLoading } = useDisputedMatches(filters);
  const matches = data?.matches ?? [];
  const meta = data?.meta ?? EMPTY_META;

  const resolveMutation = useAdminResolveMatch();

  const handleResolve = () => {
    if (!selectedMatch || notes.trim().length < 5) return;
    resolveMutation.mutate(
      {
        matchId: selectedMatch.id,
        data: {
          player1_wins: Number.parseInt(p1Wins, 10) || 0,
          player2_wins: Number.parseInt(p2Wins, 10) || 0,
          draws: Number.parseInt(draws, 10) || 0,
          notes: notes.trim(),
        },
      },
      {
        onSuccess: () => {
          toast.success("Match resuelto");
          setResolveOpen(false);
          setP1Wins("0");
          setP2Wins("0");
          setDraws("0");
          setNotes("");
        },
        onError: (error: unknown) => {
          toast.error(getErrorMessage(error));
        },
      }
    );
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  const renderCell = (match: MatchDispute, columnKey: string) => {
    switch (columnKey) {
      case "tournament":
        return <span className="text-sm font-medium">{match.tournament_name}</span>;
      case "round":
        return <span className="text-sm">Ronda {match.round_number}</span>;
      case "players":
        return (
          <span className="text-sm">
            {match.player1?.username ?? "BYE"} <span className="text-[var(--muted-foreground)]">vs</span> {match.player2?.username ?? "BYE"}
          </span>
        );
      case "score":
        return (
          <span className="text-sm font-mono">
            {match.player1_wins} - {match.player2_wins}
            {match.draws > 0 && <span className="text-[var(--muted-foreground)]"> ({match.draws}E)</span>}
          </span>
        );
      case "disputed_at":
        return <span className="text-xs text-[var(--muted-foreground)]">{formatDate(match.disputed_at)}</span>;
      case "actions":
        return (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSelectedMatch(match);
              setP1Wins(String(match.player1_wins));
              setP2Wins(String(match.player2_wins));
              setDraws(String(match.draws));
              setNotes("");
              setResolveOpen(true);
            }}
          >
            Resolver
          </Button>
        );
      default:
        return null;
    }
  };

  const canPrev = page > 1;
  const canNext = page < Math.max(1, meta.total_pages);

  return (
    <>
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
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
                <thead className="bg-[var(--surface)]">
                  <tr>
                    {MATCH_COLUMNS.map((col) => (
                      <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)]">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matches.length === 0 ? (
                    <tr>
                      <td colSpan={MATCH_COLUMNS.length} className="px-4 py-3">
                        <p className="text-center text-sm text-[var(--muted-foreground)] py-6">
                          No hay matches disputados actualmente
                        </p>
                      </td>
                    </tr>
                  ) : (
                    matches.map((match) => (
                      <tr key={match.id} className="border-b border-[var(--border)] last:border-b-0">
                        {MATCH_COLUMNS.map((column) => (
                          <td key={column.key} className="px-4 py-3">
                            {renderCell(match, column.key)}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--muted-foreground)] px-5 py-3 border-t border-[var(--border)]">
            <span>
              Pagina {meta.page} de {meta.total_pages} | Total: {meta.total}
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

      {resolveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setResolveOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-elevated p-6">
            <div className="flex items-center gap-2 mb-4">
              <Scale className="h-5 w-5 text-[var(--foreground)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Resolver Match</h2>
            </div>
            <div className="space-y-4 mb-6">
              {selectedMatch && (
                <p className="text-xs text-[var(--muted-foreground)]">
                  {selectedMatch.tournament_name} — Ronda {selectedMatch.round_number}:{" "}
                  {selectedMatch.player1?.username ?? "BYE"} vs {selectedMatch.player2?.username ?? "BYE"}
                </p>
              )}
              <div className="flex gap-3">
                <div className="space-y-1 flex flex-col flex-1">
                  <Label className="text-xs text-[var(--muted-foreground)]">Victorias J1</Label>
                  <Input
                    type="number"
                    min={0}
                    value={p1Wins}
                    onChange={(e) => setP1Wins(e.target.value)}
                  />
                </div>
                <div className="space-y-1 flex flex-col flex-1">
                  <Label className="text-xs text-[var(--muted-foreground)]">Victorias J2</Label>
                  <Input
                    type="number"
                    min={0}
                    value={p2Wins}
                    onChange={(e) => setP2Wins(e.target.value)}
                  />
                </div>
                <div className="space-y-1 flex flex-col flex-1">
                  <Label className="text-xs text-[var(--muted-foreground)]">Empates</Label>
                  <Input
                    type="number"
                    min={0}
                    value={draws}
                    onChange={(e) => setDraws(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted-foreground)]">Notas (mínimo 5 caracteres) *</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setResolveOpen(false)}>Cancelar</Button>
              <Button
                onClick={handleResolve}
                disabled={resolveMutation.isPending || notes.trim().length < 5}
              >
                Resolver
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const TAB_LABELS: Record<TabKey, string> = {
  marketplace: "Marketplace",
  duelos: "Duelos",
  matches: "Matches Torneos",
};

export default function DisputesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("marketplace");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-brand">
          Disputas
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">Panel unificado de disputas</p>
      </div>

      <div className="flex gap-2 border-b border-[var(--border)] pb-0">
        {(["marketplace", "duelos", "matches"] as TabKey[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-[var(--primary)] text-[var(--foreground)]"
                : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {activeTab === "marketplace" && <MarketplaceDisputesTab />}
      {activeTab === "duelos" && <DuelosDisputesTab />}
      {activeTab === "matches" && <MatchesDisputesTab />}
    </div>
  );
}
