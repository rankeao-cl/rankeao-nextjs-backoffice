"use client";

import { useState } from "react";
import {
  Button,
  Card,
  Chip,
  Description,
  Fieldset,
  Form,
  Input,
  Label,
  TextArea,
  TextField,
  toast,
} from "@heroui/react";
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
      toast.danger("Ingresa un ID de torneo valido");
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
          toast.danger(getErrorMessage(err, "Error al recalcular ratings"));
          setResult(null);
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-purple-cyan">
          Ratings de Torneos
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Recalcula los ratings Glicko-2 de un torneo.
        </p>
      </div>

      <Card className="bg-[var(--surface)] border border-[var(--border)]">
        <Card.Content className="p-5">
          <Form className="space-y-4">
            <Fieldset className="space-y-4">
              <Fieldset.Legend className="flex items-center gap-2 font-semibold text-[var(--foreground)]">
                <BarChart3 className="h-5 w-5 text-[var(--foreground)]" />
                Recalcular Ratings
              </Fieldset.Legend>
              <Description className="text-xs text-[var(--muted)]">
                Recalcula los ratings Glicko-2 para todos los partidos confirmados del torneo indicado.
              </Description>

              <div className="flex items-start gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/5 p-3">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-yellow-500" />
                <p className="text-xs text-yellow-500">
                  Esta accion recalcula los ratings Glicko-2 de todos los partidos confirmados en el torneo. Utilizar con precaucion.
                </p>
              </div>

              <TextField className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted)]">ID del Torneo</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="ej: 42"
                  value={tournamentId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                    setTournamentId(e.target.value)
                  }
                />
              </TextField>

              <TextField className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted)]">Razon (opcional)</Label>
                <TextArea
                  placeholder="ej: Correccion de resultados en ronda 3"
                  value={reason}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                    setReason(e.target.value)
                  }
                  rows={3}
                />
              </TextField>

              <Fieldset.Actions className="pt-1">
                <Button
                  type="button"
                  onPress={handleSubmit}
                  isPending={recalculateMutation.isPending}
                >
                  Recalcular Ratings
                </Button>
              </Fieldset.Actions>

              {result && (
                <div className="flex gap-2 pt-2">
                  <Chip size="sm" color="default" variant="soft">
                    Torneo: {result.tournament_id}
                  </Chip>
                  <Chip size="sm" color="default" variant="soft">
                    Estado: {result.status}
                  </Chip>
                </div>
              )}
            </Fieldset>
          </Form>
        </Card.Content>
      </Card>
    </div>
  );
}
