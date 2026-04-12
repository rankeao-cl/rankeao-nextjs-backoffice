"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
          toast.error(getErrorMessage(error));
        },
      }
    );
  };

  const handleReset = () => setEditedValues({});

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-brand">
            Configuracion Marketplace
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Parametros clave-valor del marketplace
          </p>
        </div>

        {dirtyCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-xs font-medium text-[var(--foreground)]">
              {dirtyCount} {dirtyCount === 1 ? "cambio" : "cambios"}
            </span>
            <Button size="sm" variant="ghost" onClick={handleReset}>
              Descartar
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateConfig.isPending}
            >
              <Save className="h-4 w-4 mr-1" aria-hidden="true" />
              Guardar cambios
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
        <div className="p-5">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-40 rounded" />
                  <Skeleton className="h-8 flex-1 rounded" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[var(--muted-foreground)]">
              <Settings className="h-10 w-10 mb-3 opacity-40" aria-hidden="true" />
              <p className="text-sm">No hay configuraciones disponibles</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[var(--surface)]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)]">CLAVE</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)]">VALOR</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)]">TIPO</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] hidden md:table-cell">DESCRIPCION</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] hidden lg:table-cell">ACTUALIZADO</th>
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
                            onChange={(e) => handleChange(entry, e.target.value)}
                            className={isDirty ? "ring-1 ring-blue-500/40" : ""}
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-xs font-medium text-[var(--foreground)]">
                            {entry.value_type}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 hidden md:table-cell">
                          <span className="text-xs text-[var(--muted-foreground)]">
                            {entry.description || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 hidden lg:table-cell">
                          <span className="text-xs text-[var(--muted-foreground)]">
                            {new Date(entry.updated_at).toLocaleDateString("es-CL")}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
