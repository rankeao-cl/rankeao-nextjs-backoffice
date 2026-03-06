"use client";

import { useState } from "react";
import { Button, Card, CardContent, TextArea } from "@heroui/react";
import { batchUpdateLevels } from "@/lib/api-admin";
import { getErrorMessage } from "@/lib/error-message";
import { Layers } from "lucide-react";
import { toast } from "sonner";

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
  const [loading, setLoading] = useState(false);

  const handleBatchUpdate = async () => {
    let parsed: unknown;

    try {
      parsed = JSON.parse(payloadText);
    } catch {
      toast.error("El payload no es JSON valido");
      return;
    }

    const payload = Array.isArray(parsed) ? { levels: parsed } : parsed;

    setLoading(true);
    try {
      await batchUpdateLevels(payload as Record<string, unknown>);
      toast.success("Niveles actualizados correctamente");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-purple-cyan">
          Levels
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Reemplaza en bloque la configuracion de niveles de gamificacion.
        </p>
      </div>

      <Card className="bg-[#0f1017] border border-[#2a2f4b]/40">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-zinc-200" />
            <h2 className="font-semibold text-zinc-200">Batch update payload</h2>
          </div>

          <p className="text-xs text-zinc-500">
            Puedes enviar un array de niveles (se envuelve como <code>{'{"levels": [...]}'} </code>) o un objeto JSON completo.
          </p>

          <TextArea
            value={payloadText}
            onChange={(e) => setPayloadText(e.target.value)}
            rows={16}
            className="font-mono text-xs"
          />

          <div className="flex gap-2">
            <Button onPress={handleBatchUpdate} isPending={loading}>
              Aplicar cambios
            </Button>
            <Button variant="ghost" onPress={() => setPayloadText(EXAMPLE_LEVELS)}>
              Restaurar ejemplo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
