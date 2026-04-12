"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BarChart3, AlertTriangle } from "lucide-react";
import { useRecalculateRatings } from "@/lib/hooks/use-tournaments";
import type { RecalculateRatingsResponse } from "@/lib/types/tournament";
import { getErrorMessage } from "@/lib/utils/error-message";

export default function TournamentRatingsPage() {
  const [tournamentId, setTournamentId] = useState("");
  const [reason, setReason] = useState("");
  const [result, setResult] = useState<RecalculateRatingsResponse | null>(null);

  const recalculateMutation = useRecalculateRatings();

  const handleSubmit = () => {
    const id = Number.parseInt(tournamentId, 10);
    if (!tournamentId || Number.isNaN(id) || id <= 0) {
      toast.error("Ingresa un ID de torneo valido");
      return;
    }

    recalculateMutation.mutate(
      {
        tournament_id: id,
        reason: reason.trim() || undefined,
      },
      {
        onSuccess: (data: RecalculateRatingsResponse) => {
          toast.success("Ratings recalculados correctamente");
          setResult(data);
        },
        onError: (err: unknown) => {
          toast.error(getErrorMessage(err, "Error al recalcular ratings"));
          setResult(null);
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-brand">
          Ratings de Torneos
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Recalcula los ratings Glicko-2 de un torneo.
        </p>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
        <div className="p-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-semibold text-[var(--foreground)]">
              <BarChart3 className="h-5 w-5 text-[var(--foreground)]" aria-hidden="true" />
              Recalcular Ratings
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">
              Recalcula los ratings Glicko-2 para todos los partidos confirmados del torneo indicado.
            </p>

            <div className="flex items-start gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/5 p-3">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-yellow-500" aria-hidden="true" />
              <p className="text-xs text-yellow-500">
                Esta accion recalcula los ratings Glicko-2 de todos los partidos confirmados en el torneo. Utilizar con precaucion.
              </p>
            </div>

            <div className="space-y-1 flex flex-col">
              <Label className="text-xs text-[var(--muted-foreground)]">ID del Torneo</Label>
              <Input
                type="number"
                min={1}
                placeholder="ej: 42"
                value={tournamentId}
                onChange={(e) => setTournamentId(e.target.value)}
              />
            </div>

            <div className="space-y-1 flex flex-col">
              <Label className="text-xs text-[var(--muted-foreground)]">Razon (opcional)</Label>
              <Textarea
                placeholder="ej: Correccion de resultados en ronda 3"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>

            <div className="pt-1">
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={recalculateMutation.isPending}
              >
                Recalcular Ratings
              </Button>
            </div>

            {result && (
              <div className="flex gap-2 pt-2">
                <span className="inline-flex items-center rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-xs font-medium text-[var(--foreground)]">
                  Torneo: {result.tournament_id}
                </span>
                <span className="inline-flex items-center rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-xs font-medium text-[var(--foreground)]">
                  Estado: {result.status}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
