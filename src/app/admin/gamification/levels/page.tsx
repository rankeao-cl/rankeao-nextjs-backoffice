"use client";

import {
  useState
} from "react";
import {
  Card,
  Description,
  Fieldset,
  Form,
  Label,
  TextArea,
  TextField,
  Button,
} from "@heroui/react";
import { batchUpdateLevels } from "@/lib/api-admin";
import { getErrorMessage } from "@/lib/error-message";
import { Layers } from "lucide-react";
import { toast } from "@heroui/react";

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
      toast.danger("El payload no es JSON valido");
      return;
    }

    const payload = Array.isArray(parsed) ? { levels: parsed } : parsed;

    setLoading(true);
    try {
      await batchUpdateLevels(payload as Record<string, unknown>);
      toast.success("Niveles actualizados correctamente");
    } catch (error: unknown) {
      toast.danger(getErrorMessage(error));
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
        <p className="text-sm text-[var(--muted)] mt-1">
          Reemplaza en bloque la configuracion de niveles de gamificacion.
        </p>
      </div>

      <Card className="bg-[var(--surface)] border border-[var(--border)]">
        <Card.Content className="p-5">
          <Form className="space-y-4">
            <Fieldset className="space-y-4">
              <Fieldset.Legend className="flex items-center gap-2 font-semibold text-[var(--foreground)]">
                <Layers className="h-5 w-5 text-[var(--foreground)]" />
                Batch update payload
              </Fieldset.Legend>
              <Description className="text-xs text-[var(--muted)]">
                Puedes enviar un array de niveles (se envuelve como <code>{'{"levels": [...]}'} </code>) o un objeto JSON completo.
              </Description>

              <TextField className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted)]">JSON de niveles</Label>
                <TextArea
                  value={payloadText}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setPayloadText(e.target.value)}
                  rows={16}
                  className="font-mono text-xs"
                />
              </TextField>

              <Fieldset.Actions className="flex gap-2 pt-1">
                <Button type="button" onPress={handleBatchUpdate} isPending={loading}>
                  Aplicar cambios
                </Button>
                <Button type="button" variant="secondary" onPress={() => setPayloadText(EXAMPLE_LEVELS)}>
                  Restaurar ejemplo
                </Button>
              </Fieldset.Actions>
            </Fieldset>
          </Form>
        </Card.Content>
      </Card>
    </div>
  );
}

