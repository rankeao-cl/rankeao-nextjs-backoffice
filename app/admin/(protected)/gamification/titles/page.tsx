"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, Edit, Gift, Trash2 } from "lucide-react";
import type { Title, CreateTitleRequest, UpdateTitleRequest, GrantRequest } from "@/lib/types/gamification";
import {
  useTitles,
  useCreateTitle,
  useUpdateTitle,
  useGrantTitle,
  useRevokeTitle,
} from "@/lib/hooks/use-gamification";
import { getErrorMessage } from "@/lib/utils/error-message";

type TitleForm = {
  slug: string;
  name: string;
  color: string;
  season_id: string;
  is_active: boolean;
};

const INITIAL_FORM: TitleForm = {
  slug: "",
  name: "",
  color: "#d4d4d8",
  season_id: "",
  is_active: true,
};

const TABLE_COLUMNS = [
  { key: "name", label: "NOMBRE" },
  { key: "slug", label: "SLUG" },
  { key: "seasonal", label: "ESTACIONAL" },
  { key: "season", label: "TEMPORADA" },
  { key: "holders", label: "PORTADORES" },
  { key: "created_at", label: "CREADO" },
  { key: "actions", label: "ACCIONES" },
] as const;

export default function TitlesPage() {
  const { data: titles = [], isLoading: loading } = useTitles();
  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Title | null>(null);
  const [formData, setFormData] = useState<TitleForm>(INITIAL_FORM);

  const [grantOpen, setGrantOpen] = useState(false);
  const [grantTarget, setGrantTarget] = useState<Title | null>(null);
  const [grantUserId, setGrantUserId] = useState("");
  const [grantReason, setGrantReason] = useState("");

  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<Title | null>(null);
  const [revokeUserId, setRevokeUserId] = useState("");
  const [revokeReason, setRevokeReason] = useState("");

  const createTitle = useCreateTitle();
  const updateTitle = useUpdateTitle();
  const grantTitle = useGrantTitle();
  const revokeTitle = useRevokeTitle();

  const filteredTitles = titles.filter((title) => {
    const q = search.toLowerCase();
    return (
      String(title.name || "").toLowerCase().includes(q) ||
      String(title.slug || "").toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    setEditTarget(null);
    setFormData(INITIAL_FORM);
    setCreateOpen(true);
  };

  const openEdit = (title: Title) => {
    setEditTarget(title);
    setFormData({
      slug: String(title.slug || ""),
      name: String(title.name || ""),
      color: String(title.color || "#d4d4d8"),
      season_id: String(title.season_id || ""),
      is_active: Boolean(title.is_active ?? true),
    });
    setCreateOpen(true);
  };

  const handleSave = () => {
    if (editTarget?.id) {
      const data: UpdateTitleRequest = {};
      if (formData.name) data.name = formData.name;
      if (formData.color) data.color = formData.color;
      if (formData.season_id) data.season_id = formData.season_id;
      data.is_active = formData.is_active;

      updateTitle.mutate(
        { id: String(editTarget.id), data },
        {
          onSuccess: () => {
            toast.success("Titulo actualizado");
            setCreateOpen(false);
          },
          onError: (err) => {
            toast.error(getErrorMessage(err));
          },
        },
      );
    } else {
      if (!formData.slug || !formData.name) {
        toast.error("Slug y nombre son requeridos");
        return;
      }

      const data: CreateTitleRequest = {
        slug: formData.slug,
        name: formData.name,
        color: formData.color || undefined,
        season_id: formData.season_id || undefined,
      };

      createTitle.mutate(data, {
        onSuccess: () => {
          toast.success("Titulo creado");
          setCreateOpen(false);
        },
        onError: (err) => {
          toast.error(getErrorMessage(err));
        },
      });
    }
  };

  const openGrant = (title: Title) => {
    setGrantTarget(title);
    setGrantUserId("");
    setGrantReason("");
    setGrantOpen(true);
  };

  const handleGrant = () => {
    if (!grantTarget?.id || !grantUserId) {
      toast.error("User ID es requerido");
      return;
    }

    const data: GrantRequest = {
      user_id: grantUserId,
      reason: grantReason || undefined,
    };

    grantTitle.mutate(
      { titleId: String(grantTarget.id), data },
      {
        onSuccess: () => {
          toast.success("Titulo otorgado");
          setGrantOpen(false);
        },
        onError: (err) => {
          toast.error(getErrorMessage(err));
        },
      },
    );
  };

  const openRevoke = (title: Title) => {
    setRevokeTarget(title);
    setRevokeUserId("");
    setRevokeReason("");
    setRevokeOpen(true);
  };

  const handleRevoke = () => {
    if (!revokeTarget?.id || !revokeUserId) {
      toast.error("User ID es requerido");
      return;
    }

    const data: GrantRequest = {
      user_id: revokeUserId,
      reason: revokeReason || undefined,
    };

    revokeTitle.mutate(
      { titleId: String(revokeTarget.id), data },
      {
        onSuccess: () => {
          toast.success("Titulo revocado");
          setRevokeOpen(false);
        },
        onError: (err) => {
          toast.error(getErrorMessage(err));
        },
      },
    );
  };

  const formLoading = createTitle.isPending || updateTitle.isPending;
  const grantLoading = grantTitle.isPending;
  const revokeLoading = revokeTitle.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-brand">
            Titulos
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Crear, editar y otorgar titulos a usuarios</p>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--c-gray-200)] bg-white">
        <div className="px-5 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1 flex flex-col min-w-[200px] flex-1">
              <Label className="text-xs text-[var(--muted-foreground)]">Buscar titulo</Label>
              <Input
                placeholder="Nombre o slug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="button" size="sm" onClick={openCreate}>
              Nuevo titulo
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--c-gray-200)] bg-white">
        <div className="p-0">
          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
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
                  {filteredTitles.map((title) => (
                    <tr key={String(title.id || title.slug || "-")} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface)]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-4 w-4 shrink-0 rounded-full border border-[var(--border)]"
                            style={{ backgroundColor: title.color || "#d4d4d8" }}
                          />
                          <span className="font-medium text-[var(--foreground)]">
                            {String(title.name || "-")}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs text-[var(--muted-foreground)] bg-[var(--surface)] px-2 py-0.5 rounded">
                          {String(title.slug || "-")}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="default">
                          {title.is_seasonal ? "Si" : "No"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[var(--foreground)]">
                          {title.season?.name || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[var(--foreground)]">
                          {title.total_holders ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {title.created_at
                            ? new Date(title.created_at).toLocaleDateString("es-CL")
                            : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" aria-label="Editar titulo" onClick={() => openEdit(title)}>
                            <Edit className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                          <Button size="icon" variant="ghost" aria-label="Otorgar titulo" onClick={() => openGrant(title)}>
                            <Gift className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                          <Button size="icon" variant="destructive" aria-label="Revocar titulo" onClick={() => openRevoke(title)}>
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                        </div>
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
              {editTarget ? "Editar Titulo" : "Crear Titulo"}
            </h2>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Nombre</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Slug</Label>
                  <Input
                    placeholder="season-1-champion"
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    disabled={Boolean(editTarget)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Color hex</Label>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-8 w-8 shrink-0 rounded border border-[var(--border)]"
                      style={{ backgroundColor: formData.color || "#d4d4d8" }}
                    />
                    <Input
                      placeholder="#d4d4d8"
                      value={formData.color}
                      onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Season ID</Label>
                  <Input
                    placeholder="opcional"
                    value={formData.season_id}
                    onChange={(e) => setFormData((prev) => ({ ...prev, season_id: e.target.value }))}
                  />
                </div>
              </div>

              {editTarget && (
                <div className="flex items-center gap-3">
                  <label className="text-xs text-[var(--muted-foreground)]">Activo</label>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formData.is_active}
                    onClick={() => setFormData((prev) => ({ ...prev, is_active: !prev.is_active }))}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${formData.is_active ? "bg-[var(--primary)]" : "bg-[var(--default)]"}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${formData.is_active ? "translate-x-5" : "translate-x-0"}`}
                    />
                  </button>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {formData.is_active ? "Activo" : "Inactivo"}
                  </span>
                </div>
              )}

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

      {/* Grant Modal */}
      {grantOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setGrantOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-white border border-[var(--c-gray-200)] shadow-elevated p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
              Otorgar titulo - {String(grantTarget?.name || "")}
            </h2>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleGrant(); }}>
              <div className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted-foreground)]">User ID</Label>
                <Input
                  value={grantUserId}
                  onChange={(e) => setGrantUserId(e.target.value)}
                />
              </div>
              <div className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted-foreground)]">Motivo</Label>
                <Textarea
                  placeholder="opcional"
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setGrantOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={grantLoading}>
                  {grantLoading && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--c-gray-200)] border-t-white mr-2" />
                  )}
                  Otorgar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revoke Modal */}
      {revokeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setRevokeOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-white border border-[var(--c-gray-200)] shadow-elevated p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
              Revocar titulo - {String(revokeTarget?.name || "")}
            </h2>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleRevoke(); }}>
              <div className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted-foreground)]">User ID</Label>
                <Input
                  value={revokeUserId}
                  onChange={(e) => setRevokeUserId(e.target.value)}
                />
              </div>
              <div className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted-foreground)]">Motivo</Label>
                <Textarea
                  placeholder="opcional"
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setRevokeOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="destructive" disabled={revokeLoading}>
                  {revokeLoading && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-white mr-2" />
                  )}
                  Revocar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
