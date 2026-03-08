"use client";

import { useMemo, useState } from "react";
import {
  Button,
  Card,
  Chip,
  Input,
  Skeleton,
  toast,
} from "@heroui/react";
import { Save, Settings } from "lucide-react";
import {
  useMarketplaceConfig,
  useUpdateMarketplaceConfig,
} from "@/lib/hooks/use-marketplace";
import { getErrorMessage } from "@/lib/utils/error-message";
import type { ConfigEntry } from "@/lib/types/marketplace";

export default function MarketplaceConfigPage() {
  const { data: config, isLoading } = useMarketplaceConfig();
  const updateConfig = useUpdateMarketplaceConfig();

  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  const entries: ConfigEntry[] = useMemo(() => {
    if (!config) return [];
    return Object.values(config).sort((a, b) => a.key.localeCompare(b.key));
  }, [config]);

  const dirtyCount = Object.keys(editedValues).length;

  const getCurrentValue = (entry: ConfigEntry) =>
    editedValues[entry.key] ?? entry.value;

  const handleChange = (entry: ConfigEntry, newValue: string) => {
    setEditedValues((prev) => {
      const next = { ...prev };
      if (newValue === entry.value) {
        delete next[entry.key];
      } else {
        next[entry.key] = newValue;
      }
      return next;
    });
  };

  const handleSave = () => {
    if (dirtyCount === 0) return;

    updateConfig.mutate(
      { values: editedValues },
      {
        onSuccess: () => {
          toast.success("Configuracion actualizada correctamente");
          setEditedValues({});
        },
        onError: (error: unknown) => {
          toast.danger(getErrorMessage(error));
        },
      }
    );
  };

  const handleReset = () => setEditedValues({});

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-purple-cyan">
            Configuracion Marketplace
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Parametros clave-valor del marketplace
          </p>
        </div>

        {dirtyCount > 0 && (
          <div className="flex items-center gap-2">
            <Chip size="sm" variant="soft" color="default">
              {dirtyCount} {dirtyCount === 1 ? "cambio" : "cambios"}
            </Chip>
            <Button size="sm" variant="secondary" onPress={handleReset}>
              Descartar
            </Button>
            <Button
              size="sm"
              onPress={handleSave}
              isPending={updateConfig.isPending}
            >
              <Save className="h-4 w-4 mr-1" />
              Guardar cambios
            </Button>
          </div>
        )}
      </div>

      <Card className="bg-[var(--surface)] border border-[var(--border)]">
        <Card.Content className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-40 rounded" />
                  <Skeleton className="h-8 flex-1 rounded" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[var(--muted)]">
              <Settings className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">No hay configuraciones disponibles</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--muted)]">
                    <th className="px-4 py-3 font-medium">CLAVE</th>
                    <th className="px-4 py-3 font-medium">VALOR</th>
                    <th className="px-4 py-3 font-medium">TIPO</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">DESCRIPCION</th>
                    <th className="px-4 py-3 font-medium hidden lg:table-cell">ACTUALIZADO</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => {
                    const isDirty = entry.key in editedValues;
                    return (
                      <tr
                        key={entry.key}
                        className={`border-b border-[var(--border)] last:border-b-0 ${
                          isDirty ? "bg-[var(--surface)]/80" : ""
                        }`}
                      >
                        <td className="px-4 py-2.5">
                          <code className="text-xs font-mono text-[var(--foreground)]">
                            {entry.key}
                          </code>
                        </td>
                        <td className="px-4 py-2.5 min-w-[200px]">
                          <Input
                            value={getCurrentValue(entry)}
                            onChange={(
                              e: React.ChangeEvent<
                                HTMLInputElement | HTMLTextAreaElement
                              >
                            ) => handleChange(entry, e.target.value)}
                            className={isDirty ? "ring-1 ring-blue-500/40" : ""}
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <Chip size="sm" variant="soft" color="default">
                            {entry.value_type}
                          </Chip>
                        </td>
                        <td className="px-4 py-2.5 hidden md:table-cell">
                          <span className="text-xs text-[var(--muted)]">
                            {entry.description || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 hidden lg:table-cell">
                          <span className="text-xs text-[var(--muted)]">
                            {new Date(entry.updated_at).toLocaleDateString(
                              "es-CL"
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
