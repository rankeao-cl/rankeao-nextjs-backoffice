"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/utils/error-message";
import {
  CalendarDays,
  Eye,
  Lock,
  Star,
  Trophy,
  Users,
  Swords,
  Gamepad2,
} from "lucide-react";
import {
  useSeasons,
  useCreateSeason,
  usePreviewSeasonClose,
  useCloseSeason,
} from "@/lib/hooks/use-gamification";
import type { Season, CreateSeasonRequest } from "@/lib/types/gamification";

const STATUS_BADGE_VARIANT: Record<string, "default" | "success" | "warning" | "danger" | "navy"> = {
  active: "success",
  upcoming: "navy",
  closed: "default",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Activa",
  upcoming: "Proxima",
  closed: "Cerrada",
};

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function SeasonsPage() {
  const { data: seasons = [], isLoading } = useSeasons();

  const [createOpen, setCreateOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);

  const [formData, setFormData] = useState({ name: "" });
  const [startsAtStr, setStartsAtStr] = useState("");
  const [endsAtStr, setEndsAtStr] = useState("");
  const [selectedSeasonId, setSelectedSeasonId] = useState("");
  const [selectedSeasonName, setSelectedSeasonName] = useState("");
  const [previewData, setPreviewData] = useState<unknown>(null);

  const createSeasonMutation = useCreateSeason();
  const previewSeasonCloseMutation = usePreviewSeasonClose();
  const closeSeasonMutation = useCloseSeason();

  const handleCreate = () => {
    if (!formData.name || !startsAtStr || !endsAtStr) {
      toast.error("Completa todos los campos");
      return;
    }

    const payload: CreateSeasonRequest = {
      name: formData.name,
      starts_at: new Date(`${startsAtStr}T00:00:00.000Z`).toISOString(),
      ends_at: new Date(`${endsAtStr}T23:59:59.999Z`).toISOString(),
    };

    createSeasonMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Season creada");
        setCreateOpen(false);
        setFormData({ name: "" });
        setStartsAtStr("");
        setEndsAtStr("");
      },
      onError: (error: unknown) => {
        toast.error(getErrorMessage(error));
      },
    });
  };

  const handlePreview = (seasonId: string) => {
    if (!seasonId) {
      toast.error("Season ID no disponible");
      return;
    }

    previewSeasonCloseMutation.mutate(seasonId, {
      onSuccess: (data) => {
        setPreviewData(data);
        setPreviewOpen(true);
      },
      onError: (error: unknown) => {
        toast.error(getErrorMessage(error));
      },
    });
  };

  const openCloseConfirmation = (season: Season) => {
    setSelectedSeasonId(season.id);
    setSelectedSeasonName(season.name);
    setCloseOpen(true);
  };

  const handleClose = () => {
    if (!selectedSeasonId) return;

    closeSeasonMutation.mutate(selectedSeasonId, {
      onSuccess: () => {
        toast.success("Season cerrada exitosamente");
        setCloseOpen(false);
        setSelectedSeasonId("");
        setSelectedSeasonName("");
      },
      onError: (error: unknown) => {
        toast.error(getErrorMessage(error));
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-brand">
            Temporadas
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Gestiona las temporadas competitivas de gamificacion
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>Nueva Season</Button>
      </div>

      {/* Seasons List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-[var(--border)] bg-[var(--card)]"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-40 rounded" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full rounded" />
                  <Skeleton className="h-3 w-3/4 rounded" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-28 rounded" />
                  <Skeleton className="h-8 w-28 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : seasons.length === 0 ? (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
          <div className="flex flex-col items-center py-12 gap-4">
            <Trophy className="h-12 w-12 text-[var(--field-placeholder)]" aria-hidden="true" />
            <p className="text-[var(--muted-foreground)]">
              No hay temporadas creadas aun.
            </p>
            <Button variant="ghost" onClick={() => setCreateOpen(true)}>
              Crear primera season
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {seasons.map((season) => {
            const status = season.status?.toLowerCase() ?? "closed";
            const startDate = season.start_date || season.starts_at;
            const endDate = season.end_date || season.ends_at;
            const isActive = status === "active";

            return (
              <div
                key={season.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--card)]"
              >
                <div className="p-5 space-y-4">
                  {/* Name + Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Trophy className="h-5 w-5 shrink-0 text-[var(--foreground)]" aria-hidden="true" />
                      <h3 className="font-semibold text-[var(--foreground)] truncate">
                        {season.name}
                      </h3>
                      {season.is_current_season && (
                        <Badge variant="navy">
                          <Star className="h-3 w-3 mr-1 inline" aria-hidden="true" />
                          Actual
                        </Badge>
                      )}
                    </div>
                    <Badge variant={STATUS_BADGE_VARIANT[status] ?? "default"}>
                      {STATUS_LABEL[status] ?? status}
                    </Badge>
                  </div>

                  {/* Dates */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--muted-foreground)]">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                      {formatDate(startDate)} &mdash; {formatDate(endDate)}
                    </span>
                    {season.days_remaining != null && (
                      <Badge variant="default">
                        {season.days_remaining} dias restantes
                      </Badge>
                    )}
                  </div>

                  {/* Stats */}
                  {season.stats && (
                    <div className="flex flex-wrap gap-3 text-xs text-[var(--muted-foreground)]">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" aria-hidden="true" />
                        {season.stats.total_players} jugadores
                      </span>
                      <span className="flex items-center gap-1">
                        <Swords className="h-3.5 w-3.5" aria-hidden="true" />
                        {season.stats.total_tournaments} torneos
                      </span>
                      <span className="flex items-center gap-1">
                        <Gamepad2 className="h-3.5 w-3.5" aria-hidden="true" />
                        {season.stats.total_matches} partidas
                      </span>
                      {season.stats.games_played &&
                        season.stats.games_played.length > 0 && (
                          <span className="text-[var(--field-placeholder)]">
                            Juegos: {season.stats.games_played.join(", ")}
                          </span>
                        )}
                    </div>
                  )}

                  {/* Slug / ID */}
                  <div className="flex items-center gap-2">
                    {season.slug && (
                      <code className="text-[10px] text-[var(--muted-foreground)] bg-[var(--surface-secondary)] px-2 py-0.5 rounded">
                        {season.slug}
                      </code>
                    )}
                    <code className="text-[10px] text-[var(--field-placeholder)] bg-[var(--surface-secondary)] px-2 py-0.5 rounded">
                      {season.id}
                    </code>
                  </div>

                  {/* Actions */}
                  {isActive && (
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handlePreview(season.id)}
                        disabled={previewSeasonCloseMutation.isPending}
                      >
                        {previewSeasonCloseMutation.isPending ? (
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--brand)] mr-1" />
                        ) : (
                          <Eye className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                        )}
                        Preview Cierre
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openCloseConfirmation(season)}
                      >
                        <Lock className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                        Cerrar Season
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setCreateOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-elevated p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Crear Season</h2>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
              <div className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted-foreground)]">Nombre</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted-foreground)]">Inicio</Label>
                <Input
                  type="date"
                  value={startsAtStr}
                  onChange={(e) => setStartsAtStr(e.target.value)}
                />
              </div>

              <div className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted-foreground)]">Fin</Label>
                <Input
                  type="date"
                  value={endsAtStr}
                  onChange={(e) => setEndsAtStr(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createSeasonMutation.isPending}>
                  {createSeasonMutation.isPending && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-white mr-2" />
                  )}
                  Crear
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setPreviewOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-elevated p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Preview - Cierre de Season</h2>
            <pre className="bg-[var(--surface)] rounded-lg p-4 text-xs text-[var(--muted-foreground)] overflow-auto max-h-96">
              {JSON.stringify(previewData, null, 2)}
            </pre>
            <div className="flex justify-end pt-4">
              <Button variant="ghost" onClick={() => setPreviewOpen(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Close Confirmation Modal */}
      {closeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setCloseOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-elevated p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Cerrar Season</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[var(--danger)]">
                <Lock className="h-5 w-5" aria-hidden="true" />
                <p className="font-semibold">Accion irreversible</p>
              </div>
              <p className="text-[var(--muted-foreground)] text-sm">
                Estas a punto de cerrar la season{" "}
                <strong className="text-[var(--foreground)]">
                  {selectedSeasonName}
                </strong>
                . Se tomaran snapshots de rankings y se distribuiran rewards.
                Esta accion no se puede deshacer.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={() => setCloseOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleClose}
                disabled={closeSeasonMutation.isPending}
              >
                {closeSeasonMutation.isPending && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-white mr-2" />
                )}
                Confirmar cierre
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
