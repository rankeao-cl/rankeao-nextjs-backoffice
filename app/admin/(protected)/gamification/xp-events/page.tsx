"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useXPEvents,
  useCreateXPEvent,
  useUpdateXPEvent,
} from "@/lib/hooks/use-gamification";
import type {
  XPEvent,
  CreateXPEventRequest,
  UpdateXPEventRequest,
} from "@/lib/types/gamification";
import { getErrorMessage } from "@/lib/utils/error-message";
import { Edit, Zap } from "lucide-react";

type XPEventForm = {
  event_key: string;
  xp_amount: number;
  cooldown_minutes: number;
  max_per_day: number;
  is_active: boolean;
};

const INITIAL_FORM: XPEventForm = {
  event_key: "",
  xp_amount: 10,
  cooldown_minutes: 0,
  max_per_day: 0,
  is_active: true,
};

const TABLE_COLUMNS = [
  { key: "event", label: "EVENT KEY" },
  { key: "xp", label: "XP" },
  { key: "cooldown", label: "COOLDOWN" },
  { key: "max", label: "MAX/DIA" },
  { key: "status", label: "ESTADO" },
  { key: "actions", label: "ACCIONES" },
] as const;

export default function XPEventsPage() {
  const { data: events = [], isLoading } = useXPEvents();
  const createMutation = useCreateXPEvent();
  const updateMutation = useUpdateXPEvent();

  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<XPEvent | null>(null);
  const [formData, setFormData] = useState<XPEventForm>(INITIAL_FORM);

  const filtered = events.filter((event) =>
    event.event_key.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditTarget(null);
    setFormData(INITIAL_FORM);
    setCreateOpen(true);
  };

  const openEdit = (event: XPEvent) => {
    setEditTarget(event);
    setFormData({
      event_key: event.event_key,
      xp_amount: event.xp_amount,
      cooldown_minutes: event.cooldown_minutes ?? 0,
      max_per_day: event.max_per_day ?? 0,
      is_active: event.is_active,
    });
    setCreateOpen(true);
  };

  const handleSave = () => {
    if (editTarget) {
      const payload: UpdateXPEventRequest = {
        xp_amount: formData.xp_amount,
        cooldown_minutes: formData.cooldown_minutes,
        max_per_day: formData.max_per_day,
        is_active: formData.is_active,
      };
      updateMutation.mutate(
        { id: editTarget.id, data: payload },
        {
          onSuccess: () => {
            toast.success("XP Event actualizado");
            setCreateOpen(false);
          },
          onError: (error) => {
            toast.error(getErrorMessage(error));
          },
        }
      );
    } else {
      const payload: CreateXPEventRequest = {
        event_key: formData.event_key,
        xp_amount: formData.xp_amount,
        cooldown_minutes: formData.cooldown_minutes,
        max_per_day: formData.max_per_day,
      };
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("XP Event creado");
          setCreateOpen(false);
        },
        onError: (error) => {
          toast.error(getErrorMessage(error));
        },
      });
    }
  };

  const formLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-brand">
            Eventos XP
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Definiciones de eventos que otorgan XP</p>
        </div>
        <Button type="button" onClick={openCreate}>
          Nuevo evento XP
        </Button>
      </div>

      <div className="rounded-lg border border-[var(--c-gray-200)] bg-white">
        <div className="px-5 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1 flex flex-col min-w-[200px] flex-1">
              <Label className="text-xs text-[var(--muted-foreground)]">Buscar</Label>
              <Input
                placeholder="event_key..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--c-gray-200)] bg-white">
        <div className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-full rounded" />
                    <Skeleton className="h-3 w-4/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {TABLE_COLUMNS.map((col) => (
                      <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((event) => (
                    <tr key={event.id || event.event_key || "-"} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface)]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-[var(--foreground)]" aria-hidden="true" />
                          <code className="text-xs">{event.event_key || "-"}</code>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-[var(--foreground)]">+{event.xp_amount || 0}</span>
                      </td>
                      <td className="px-4 py-3">
                        {(event.cooldown_minutes ?? 0) > 0 ? `${event.cooldown_minutes} min` : "-"}
                      </td>
                      <td className="px-4 py-3">
                        {(event.max_per_day ?? 0) > 0 ? String(event.max_per_day) : "∞"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="default">
                          {event.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Button size="icon" variant="ghost" aria-label="Editar evento XP" onClick={() => openEdit(event)}>
                          <Edit className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setCreateOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-white border border-[var(--c-gray-200)] shadow-elevated p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
              {editTarget ? "Editar evento XP" : "Crear evento XP"}
            </h2>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted-foreground)]">Event key</Label>
                <Input
                  value={formData.event_key}
                  onChange={(e) => setFormData((prev) => ({ ...prev, event_key: e.target.value }))}
                  disabled={Boolean(editTarget)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">XP amount</Label>
                  <Input
                    type="number"
                    value={String(formData.xp_amount)}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, xp_amount: Number.parseInt(e.target.value, 10) || 0 }))
                    }
                  />
                </div>
                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Cooldown (min)</Label>
                  <Input
                    type="number"
                    value={String(formData.cooldown_minutes)}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        cooldown_minutes: Number.parseInt(e.target.value, 10) || 0,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Max por dia</Label>
                  <Input
                    type="number"
                    value={String(formData.max_per_day)}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, max_per_day: Number.parseInt(e.target.value, 10) || 0 }))
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--c-gray-200)] border-t-white mr-2" />
                  )}
                  {editTarget ? "Guardar" : "Crear"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
