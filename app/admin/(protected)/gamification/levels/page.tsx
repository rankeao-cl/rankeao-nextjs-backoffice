"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Layers } from "lucide-react";
import { useBatchUpdateLevels } from "@/lib/hooks/use-gamification";

const EXAMPLE_LEVELS = `[
  {
    "level": 1,
    "xp_required": 0,
    "title": "Rookie"
  },
  {
    "level": 2,
    "xp_required": 150,
    "title": "Challenger"
  }
]`;

export default function LevelsPage() {
  const [payloadText, setPayloadText] = useState(EXAMPLE_LEVELS);
  const batchUpdate = useBatchUpdateLevels();

  const handleBatchUpdate = () => {
    let parsed: unknown;

    try {
      parsed = JSON.parse(payloadText);
    } catch {
      toast.error("El payload no es JSON valido");
      return;
    }

    const payload = Array.isArray(parsed) ? { levels: parsed } : parsed;

    batchUpdate.mutate(payload, {
      onSuccess: () => {
        toast.success("Niveles actualizados correctamente");
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Error");
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-brand">
          Levels
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Reemplaza en bloque la configuracion de niveles de gamificacion.
        </p>
      </div>

      <div className="rounded-lg border border-[var(--c-gray-200)] bg-white">
        <div className="p-5">
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleBatchUpdate(); }}>
            <div>
              <div className="flex items-center gap-2 font-semibold text-[var(--foreground)] mb-1">
                <Layers className="h-5 w-5 text-[var(--foreground)]" aria-hidden="true" />
                Batch update payload
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mb-3">
                Puedes enviar un array de niveles (se envuelve como <code>{'{"levels": [...]}'}</code>) o un objeto JSON completo.
              </p>
            </div>

            <div className="space-y-1 flex flex-col">
              <Label className="text-xs text-[var(--muted-foreground)]">JSON de niveles</Label>
              <Textarea
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
                rows={16}
                className="font-mono text-xs"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={batchUpdate.isPending}>
                {batchUpdate.isPending && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--c-gray-200)] border-t-white mr-2" />
                )}
                Aplicar cambios
              </Button>
              <Button type="button" variant="ghost" onClick={() => setPayloadText(EXAMPLE_LEVELS)}>
                Restaurar ejemplo
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
