"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/utils/error-message";
import { Edit, Gift, Plus, Sparkles, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import type {
  Cosmetic,
  CreateCosmeticRequest,
  UpdateCosmeticRequest,
  GrantRequest,
} from "@/lib/types/gamification";
import {
  useCosmetics,
  useCreateCosmetic,
  useUpdateCosmetic,
  useGrantCosmetic,
  useRevokeCosmetic,
} from "@/lib/hooks/use-gamification";

// ── Constants ──

const COSMETIC_TYPES = ["AVATAR_FRAME", "NAME_EFFECT", "CARD_BACK"] as const;

const RARITY_OPTIONS = ["common", "uncommon", "rare", "epic", "legendary"] as const;

type CosmeticForm = {
  slug: string;
  name: string;
  type: string;
  asset_url: string;
  rarity: string;
  is_active: boolean;
};

const INITIAL_FORM: CosmeticForm = {
  slug: "",
  name: "",
  type: "AVATAR_FRAME",
  asset_url: "",
  rarity: "common",
  is_active: true,
};

const TABLE_COLUMNS = [
  { key: "name", label: "NOMBRE" },
  { key: "slug", label: "SLUG" },
  { key: "type", label: "TIPO" },
  { key: "rarity", label: "RAREZA" },
  { key: "total_owners", label: "OWNERS" },
  { key: "status", label: "ESTADO" },
  { key: "created_at", label: "CREADO" },
  { key: "actions", label: "ACCIONES" },
] as const;

export default function CosmeticsPage() {
  // ── Filters & pagination ──
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterRarity, setFilterRarity] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;

  // ── Data ──
  const { data, isLoading: loading } = useCosmetics({
    type: filterType || undefined,
    rarity: filterRarity || undefined,
    page,
    per_page: perPage,
  });

  const cosmetics = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, page_size: perPage, total: 0, total_pages: 1 };

  // ── Create / Edit modal ──
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Cosmetic | null>(null);
  const [formData, setFormData] = useState<CosmeticForm>(INITIAL_FORM);

  // ── Grant modal ──
  const [grantOpen, setGrantOpen] = useState(false);
  const [grantTarget, setGrantTarget] = useState<Cosmetic | null>(null);
  const [grantUserId, setGrantUserId] = useState("");
  const [grantReason, setGrantReason] = useState("");

  // ── Revoke modal ──
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<Cosmetic | null>(null);
  const [revokeUserId, setRevokeUserId] = useState("");
  const [revokeReason, setRevokeReason] = useState("");

  // ── Mutations ──
  const createCosmetic = useCreateCosmetic();
  const updateCosmetic = useUpdateCosmetic();
  const grantCosmetic = useGrantCosmetic();
  const revokeCosmetic = useRevokeCosmetic();

  // ── Filtered list (client-side search on top of server filters) ──
  const filteredCosmetics = cosmetics.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      String(c.name || "").toLowerCase().includes(q) ||
      String(c.slug || "").toLowerCase().includes(q)
    );
  });

  // ── Handlers ──

  const openCreate = () => {
    setEditTarget(null);
    setFormData(INITIAL_FORM);
    setCreateOpen(true);
  };

  const openEdit = (cosmetic: Cosmetic) => {
    setEditTarget(cosmetic);
    setFormData({
      slug: String(cosmetic.slug || ""),
      name: String(cosmetic.name || ""),
      type: String(cosmetic.type || "AVATAR_FRAME"),
      asset_url: String(cosmetic.asset_url || ""),
      rarity: String(cosmetic.rarity || "common"),
      is_active: Boolean(cosmetic.is_active ?? true),
    });
    setCreateOpen(true);
  };

  const handleSave = async () => {
    if (editTarget?.id) {
      const data: UpdateCosmeticRequest = {};
      if (formData.name) data.name = formData.name;
      if (formData.type) data.type = formData.type;
      if (formData.asset_url) data.asset_url = formData.asset_url;
      if (formData.rarity) data.rarity = formData.rarity;
      data.is_active = formData.is_active;

      try {
        await updateCosmetic.mutateAsync({ id: String(editTarget.id), data });
        toast.success("Cosmetico actualizado");
        setCreateOpen(false);
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Error al actualizar cosmetico"));
      }
    } else {
      if (!formData.slug || !formData.name || !formData.type) {
        toast.error("Slug, nombre y tipo son requeridos");
        return;
      }

      const data: CreateCosmeticRequest = {
        slug: formData.slug,
        name: formData.name,
        type: formData.type,
        asset_url: formData.asset_url || undefined,
        rarity: formData.rarity || undefined,
      };

      try {
        await createCosmetic.mutateAsync(data);
        toast.success("Cosmetico creado");
        setCreateOpen(false);
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Error al crear cosmetico"));
      }
    }
  };

  const openGrant = (cosmetic: Cosmetic) => {
    setGrantTarget(cosmetic);
    setGrantUserId("");
    setGrantReason("");
    setGrantOpen(true);
  };

  const handleGrant = async () => {
    if (!grantTarget?.id || !grantUserId) {
      toast.error("User ID es requerido");
      return;
    }

    const data: GrantRequest = {
      user_id: grantUserId,
      reason: grantReason || undefined,
    };

    try {
      await grantCosmetic.mutateAsync({ cosmeticId: String(grantTarget.id), data });
      toast.success("Cosmetico otorgado");
      setGrantOpen(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Error al otorgar cosmetico"));
    }
  };

  const openRevoke = (cosmetic: Cosmetic) => {
    setRevokeTarget(cosmetic);
    setRevokeUserId("");
    setRevokeReason("");
    setRevokeOpen(true);
  };

  const handleRevoke = async () => {
    if (!revokeTarget?.id || !revokeUserId) {
      toast.error("User ID es requerido");
      return;
    }

    const data: GrantRequest = {
      user_id: revokeUserId,
      reason: revokeReason || undefined,
    };

    try {
      await revokeCosmetic.mutateAsync({ cosmeticId: String(revokeTarget.id), data });
      toast.success("Cosmetico revocado");
      setRevokeOpen(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Error al revocar cosmetico"));
    }
  };

  // ── Loading flags ──
  const formLoading = createCosmetic.isPending || updateCosmetic.isPending;
  const grantLoading = grantCosmetic.isPending;
  const revokeLoading = revokeCosmetic.isPending;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-brand">
            Cosmeticos
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Crear, editar y otorgar cosmeticos a usuarios
          </p>
        </div>
      </div>

      {/* ── Toolbar: search + filters + create button ── */}
      <div className="rounded-lg border border-[var(--c-gray-200)] bg-white">
        <div className="px-5 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1 flex flex-col min-w-[200px] flex-1">
              <Label className="text-xs text-[var(--muted-foreground)]">Buscar cosmetico</Label>
              <Input
                placeholder="Nombre o slug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="space-y-1 flex flex-col min-w-[160px]">
              <Label className="text-xs text-[var(--muted-foreground)]">Tipo</Label>
              <select
                className="h-9 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--ring)]"
                value={filterType}
                onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
              >
                <option value="">Todos</option>
                {COSMETIC_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1 flex flex-col min-w-[140px]">
              <Label className="text-xs text-[var(--muted-foreground)]">Rareza</Label>
              <select
                className="h-9 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--ring)]"
                value={filterRarity}
                onChange={(e) => { setFilterRarity(e.target.value); setPage(1); }}
              >
                <option value="">Todas</option>
                {RARITY_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
            </div>

            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
              Nuevo cosmetico
            </Button>
          </div>
        </div>
      </div>

      {/* ── Data table ── */}
      <div className="rounded-lg border border-[var(--c-gray-200)] bg-white">
        <div className="p-0">
          {loading ? (
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
          ) : filteredCosmetics.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[var(--muted-foreground)]">
              <Sparkles className="h-10 w-10 mb-3 opacity-40" aria-hidden="true" />
              <p className="text-sm">No se encontraron cosmeticos</p>
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
                  {filteredCosmetics.map((cosmetic) => {
                    const rarity = String(cosmetic.rarity || "common").toLowerCase();
                    return (
                      <tr key={String(cosmetic.id || cosmetic.slug || "-")} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface)]">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--default)]">
                              <Sparkles className="h-4 w-4 text-[var(--foreground)]" aria-hidden="true" />
                            </div>
                            <div>
                              <p className="font-medium text-[var(--foreground)]">{String(cosmetic.name || "-")}</p>
                              {cosmetic.description && (
                                <p className="text-xs text-[var(--muted-foreground)] line-clamp-1">{String(cosmetic.description)}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <code className="text-xs text-[var(--muted-foreground)] bg-[var(--surface)] px-2 py-0.5 rounded">
                            {String(cosmetic.slug || "-")}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="default">{String(cosmetic.type || "-")}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="default">
                            {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-[var(--foreground)]">
                            {cosmetic.total_owners ?? 0}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={cosmetic.is_active ? "default" : "default"}>
                            {cosmetic.is_active ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-[var(--muted-foreground)]">
                            {cosmetic.created_at
                              ? new Date(cosmetic.created_at).toLocaleDateString("es-CL")
                              : "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" aria-label="Editar cosmetico" onClick={() => openEdit(cosmetic)}>
                              <Edit className="h-3.5 w-3.5" aria-hidden="true" />
                            </Button>
                            <Button size="icon" variant="ghost" aria-label="Otorgar cosmetico" onClick={() => openGrant(cosmetic)}>
                              <Gift className="h-3.5 w-3.5" aria-hidden="true" />
                            </Button>
                            <Button size="icon" variant="destructive" aria-label="Revocar cosmetico" onClick={() => openRevoke(cosmetic)}>
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
        {meta.total_pages > 1 && (
          <div className="px-5 py-3 border-t border-[var(--border)]">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[var(--muted-foreground)]">
                Pagina {meta.page} de {meta.total_pages} ({meta.total} resultados)
              </p>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Pagina anterior"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Pagina siguiente"
                  disabled={page >= meta.total_pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setCreateOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-white border border-[var(--c-gray-200)] shadow-elevated p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
              {editTarget ? "Editar Cosmetico" : "Crear Cosmetico"}
            </h2>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Nombre</Label>
                  <Input
                    placeholder="Golden Frame"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Slug</Label>
                  <Input
                    placeholder="golden-frame"
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    disabled={Boolean(editTarget)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Tipo</Label>
                  <select
                    className="h-9 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    value={formData.type}
                    onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                  >
                    {COSMETIC_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Rareza</Label>
                  <select
                    className="h-9 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    value={formData.rarity}
                    onChange={(e) => setFormData((prev) => ({ ...prev, rarity: e.target.value }))}
                  >
                    {RARITY_OPTIONS.map((r) => (
                      <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted-foreground)]">Asset URL</Label>
                <Input
                  placeholder="https://cdn.example.com/frame.png"
                  value={formData.asset_url}
                  onChange={(e) => setFormData((prev) => ({ ...prev, asset_url: e.target.value }))}
                />
              </div>

              {editTarget && (
                <div className="flex items-center gap-3">
                  <label className="text-xs text-[var(--muted-foreground)]">Activo</label>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formData.is_active}
                    onClick={() => setFormData((prev) => ({ ...prev, is_active: !prev.is_active }))}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      formData.is_active ? "bg-[var(--primary)]" : "bg-[var(--default)]"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                        formData.is_active ? "translate-x-4" : "translate-x-0"
                      }`}
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

      {/* ── Grant Modal ── */}
      {grantOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setGrantOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-white border border-[var(--c-gray-200)] shadow-elevated p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
              Otorgar cosmetico - {String(grantTarget?.name || "")}
            </h2>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleGrant(); }}>
              <div className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted-foreground)]">User ID</Label>
                <Input
                  placeholder="ID del usuario"
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

      {/* ── Revoke Modal ── */}
      {revokeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setRevokeOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-white border border-[var(--c-gray-200)] shadow-elevated p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
              Revocar cosmetico - {String(revokeTarget?.name || "")}
            </h2>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleRevoke(); }}>
              <div className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted-foreground)]">User ID</Label>
                <Input
                  placeholder="ID del usuario"
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
