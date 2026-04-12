"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Edit, Gift, Trash2, Users } from "lucide-react";
import Image from "next/image";
import type { Badge as BadgeType, CreateBadgeRequest, UpdateBadgeRequest, GrantRequest, BulkGrantRequest } from "@/lib/types/gamification";
import {
  useBadges,
  useCreateBadge,
  useUpdateBadge,
  useGrantBadge,
  useRevokeBadge,
  useBulkGrantBadge,
  useCreateBadgeCategory,
  useUpdateBadgeCategory,
} from "@/lib/hooks/use-gamification";

type BadgeForm = {
  slug: string;
  name: string;
  description: string;
  icon_url: string;
  rarity: string;
  category_id: string;
  is_active: boolean;
};

const INITIAL_FORM: BadgeForm = {
  slug: "",
  name: "",
  description: "",
  icon_url: "",
  rarity: "common",
  category_id: "",
  is_active: true,
};

const TABLE_COLUMNS = [
  { key: "badge", label: "BADGE" },
  { key: "slug", label: "SLUG" },
  { key: "rarity", label: "RAREZA" },
  { key: "status", label: "ESTADO" },
  { key: "actions", label: "ACCIONES" },
] as const;

export default function BadgesPage() {
  const { data: badges = [], isLoading: loading } = useBadges();
  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BadgeType | null>(null);
  const [formData, setFormData] = useState<BadgeForm>(INITIAL_FORM);

  const [grantOpen, setGrantOpen] = useState(false);
  const [grantTarget, setGrantTarget] = useState<BadgeType | null>(null);
  const [grantUserId, setGrantUserId] = useState("");
  const [grantReason, setGrantReason] = useState("");
  const [isBulk, setIsBulk] = useState(false);
  const [bulkUserIds, setBulkUserIds] = useState("");

  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<BadgeType | null>(null);
  const [revokeUserId, setRevokeUserId] = useState("");
  const [revokeReason, setRevokeReason] = useState("");

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [catId, setCatId] = useState("");
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catIcon, setCatIcon] = useState("");

  const createBadge = useCreateBadge();
  const updateBadge = useUpdateBadge();
  const grantBadge = useGrantBadge();
  const revokeBadge = useRevokeBadge();
  const bulkGrantBadge = useBulkGrantBadge();
  const createBadgeCategory = useCreateBadgeCategory();
  const updateBadgeCategory = useUpdateBadgeCategory();

  const filteredBadges = badges.filter((badge) => {
    const q = search.toLowerCase();
    return (
      String(badge.name || "").toLowerCase().includes(q) ||
      String(badge.slug || "").toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    setEditTarget(null);
    setFormData(INITIAL_FORM);
    setCreateOpen(true);
  };

  const openEdit = (badge: BadgeType) => {
    setEditTarget(badge);
    setFormData({
      slug: String(badge.slug || ""),
      name: String(badge.name || ""),
      description: String(badge.description || ""),
      icon_url: String(badge.icon || ""),
      rarity: String(badge.rarity || "common"),
      category_id: String(badge.category_id || ""),
      is_active: Boolean(badge.is_active ?? true),
    });
    setCreateOpen(true);
  };

  const handleSave = () => {
    if (editTarget?.id) {
      const data: UpdateBadgeRequest = {
        name: formData.name,
        description: formData.description,
        icon: formData.icon_url,
        rarity: formData.rarity,
        is_active: formData.is_active,
        ...(formData.category_id ? { category_id: String(Number(formData.category_id)) } : {}),
      };
      updateBadge.mutate(
        { id: String(editTarget.id), data },
        {
          onSuccess: () => {
            toast.success("Badge actualizado");
            setCreateOpen(false);
          },
          onError: (err) => {
            toast.error(err instanceof Error ? err.message : "Error al actualizar badge");
          },
        },
      );
    } else {
      const data: CreateBadgeRequest = {
        slug: formData.slug,
        name: formData.name,
        description: formData.description,
        icon: formData.icon_url,
        rarity: formData.rarity,
        ...(formData.category_id ? { category_id: String(Number(formData.category_id)) } : {}),
      };
      createBadge.mutate(data, {
        onSuccess: () => {
          toast.success("Badge creado");
          setCreateOpen(false);
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Error al crear badge");
        },
      });
    }
  };

  const openGrant = (badge: BadgeType, bulk = false) => {
    setGrantTarget(badge);
    setIsBulk(bulk);
    setGrantUserId("");
    setGrantReason("");
    setBulkUserIds("");
    setGrantOpen(true);
  };

  const handleGrant = () => {
    if (!grantTarget?.id) return;

    if (isBulk) {
      const ids = bulkUserIds
        .split(/[\n,]+/)
        .map((value) => value.trim())
        .filter(Boolean);

      if (!ids.length) {
        toast.error("Ingresa al menos un User ID");
        return;
      }

      const data: BulkGrantRequest = { user_ids: ids };
      bulkGrantBadge.mutate(
        { badgeId: String(grantTarget.id), data },
        {
          onSuccess: () => {
            toast.success("Otorgamiento masivo ejecutado");
            setGrantOpen(false);
          },
          onError: (err) => {
            toast.error(err instanceof Error ? err.message : "Error en otorgamiento masivo");
          },
        },
      );
    } else {
      if (!grantUserId) {
        toast.error("Ingresa el User ID");
        return;
      }

      const data: GrantRequest = {
        user_id: grantUserId,
        reason: grantReason || undefined,
      };
      grantBadge.mutate(
        { badgeId: String(grantTarget.id), data },
        {
          onSuccess: () => {
            toast.success("Badge otorgado");
            setGrantOpen(false);
          },
          onError: (err) => {
            toast.error(err instanceof Error ? err.message : "Error al otorgar badge");
          },
        },
      );
    }
  };

  const openRevoke = (badge: BadgeType) => {
    setRevokeTarget(badge);
    setRevokeUserId("");
    setRevokeReason("");
    setRevokeOpen(true);
  };

  const handleRevoke = () => {
    if (!revokeTarget?.id || !revokeUserId) return;

    const data: GrantRequest = {
      user_id: revokeUserId,
      reason: revokeReason || undefined,
    };
    revokeBadge.mutate(
      { badgeId: String(revokeTarget.id), data },
      {
        onSuccess: () => {
          toast.success("Badge revocado");
          setRevokeOpen(false);
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Error al revocar badge");
        },
      },
    );
  };

  const handleSaveCategory = () => {
    if (!catName) return;

    if (catId) {
      updateBadgeCategory.mutate(
        {
          id: catId,
          data: {
            name: catName,
            description: catDesc || undefined,
            icon: catIcon || undefined,
          },
        },
        {
          onSuccess: () => {
            toast.success("Categoria actualizada");
            setCategoryOpen(false);
            setCatId("");
            setCatName("");
            setCatDesc("");
            setCatIcon("");
          },
          onError: (err) => {
            toast.error(err instanceof Error ? err.message : "Error al actualizar categoria");
          },
        },
      );
    } else {
      createBadgeCategory.mutate(
        {
          name: catName,
          description: catDesc || undefined,
          icon: catIcon || undefined,
        },
        {
          onSuccess: () => {
            toast.success("Categoria creada");
            setCategoryOpen(false);
            setCatId("");
            setCatName("");
            setCatDesc("");
            setCatIcon("");
          },
          onError: (err) => {
            toast.error(err instanceof Error ? err.message : "Error al crear categoria");
          },
        },
      );
    }
  };

  const formLoading = createBadge.isPending || updateBadge.isPending;
  const grantLoading = grantBadge.isPending || bulkGrantBadge.isPending;
  const revokeLoading = revokeBadge.isPending;
  const catLoading = createBadgeCategory.isPending || updateBadgeCategory.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-brand">
            Badges
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Crear, editar y otorgar insignias a usuarios</p>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--c-gray-200)] bg-white">
        <div className="p-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1 flex flex-col min-w-[200px] flex-1">
              <Label className="text-xs text-[var(--muted-foreground)]">Buscar insignia</Label>
              <Input
                placeholder="Nombre o slug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setCategoryOpen(true)}>
              Categoria
            </Button>
            <Button type="button" size="sm" onClick={openCreate}>
              Nueva insignia
            </Button>
          </div>
          <p className="text-[11px] text-[var(--field-placeholder)] mt-2">
            Tip: En categorías, si ingresas un <code>category_id</code> actualizas una existente; si lo dejas vacío, creas una nueva.
          </p>
        </div>
      </div>

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
                  {filteredBadges.map((badge) => (
                    <tr key={String(badge.id || badge.slug || "-")} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface)]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {badge.icon ? (
                            <Image
                              src={String(badge.icon)}
                              alt={String(badge.name || "Badge")}
                              width={32}
                              height={32}
                              unoptimized
                              className="h-8 w-8 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--default)]">
                              <Award className="h-4 w-4 text-[var(--foreground)]" aria-hidden="true" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-[var(--foreground)]">{String(badge.name || "-")}</p>
                            <p className="text-xs text-[var(--muted-foreground)] line-clamp-1">{String(badge.description || "")}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs text-[var(--muted-foreground)] bg-[var(--surface)] px-2 py-0.5 rounded">
                          {String(badge.slug || "-")}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="default">
                          {String(badge.rarity).charAt(0).toUpperCase() + String(badge.rarity).slice(1).toLowerCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="default">
                          {badge.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" aria-label="Editar badge" onClick={() => openEdit(badge)}>
                            <Edit className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                          <Button size="icon" variant="ghost" aria-label="Otorgar badge" onClick={() => openGrant(badge)}>
                            <Gift className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                          <Button size="icon" variant="ghost" aria-label="Otorgamiento masivo" onClick={() => openGrant(badge, true)}>
                            <Users className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                          <Button size="icon" variant="destructive" aria-label="Revocar badge" onClick={() => openRevoke(badge)}>
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
              {editTarget ? "Editar Badge" : "Crear Badge"}
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
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    disabled={Boolean(editTarget)}
                  />
                </div>
              </div>

              <div className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted-foreground)]">Descripcion</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Icon URL</Label>
                  <Input
                    value={formData.icon_url}
                    onChange={(e) => setFormData((prev) => ({ ...prev, icon_url: e.target.value }))}
                  />
                </div>
                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Rareza</Label>
                  <Input
                    value={formData.rarity}
                    onChange={(e) => setFormData((prev) => ({ ...prev, rarity: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted-foreground)]">Category ID</Label>
                <Input
                  value={formData.category_id}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category_id: e.target.value }))}
                />
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

      {/* Grant Modal */}
      {grantOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setGrantOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-white border border-[var(--c-gray-200)] shadow-elevated p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
              {isBulk ? "Otorgamiento masivo de badge" : "Otorgar badge"} - {String(grantTarget?.name || "")}
            </h2>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleGrant(); }}>
              {isBulk ? (
                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">User IDs</Label>
                  <Textarea
                    value={bulkUserIds}
                    onChange={(e) => setBulkUserIds(e.target.value)}
                    rows={4}
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted-foreground)]">User ID</Label>
                    <Input
                      value={grantUserId}
                      onChange={(e) => setGrantUserId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted-foreground)]">Motivo</Label>
                    <Input
                      value={grantReason}
                      onChange={(e) => setGrantReason(e.target.value)}
                    />
                  </div>
                </>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setGrantOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={grantLoading}>
                  {grantLoading && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--c-gray-200)] border-t-white mr-2" />
                  )}
                  {isBulk ? "Otorgar masivo" : "Otorgar"}
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
              Revocar Badge - {String(revokeTarget?.name || "")}
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
                <Input
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

      {/* Category Modal */}
      {categoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setCategoryOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-white border border-[var(--c-gray-200)] shadow-elevated p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
              {catId ? "Actualizar Categoria de Badge" : "Crear Categoria de Badge"}
            </h2>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSaveCategory(); }}>
              <div className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted-foreground)]">Category ID</Label>
                <Input
                  placeholder="opcional para update"
                  value={catId}
                  onChange={(e) => setCatId(e.target.value)}
                />
              </div>
              <div className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted-foreground)]">Nombre</Label>
                <Input
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                />
              </div>
              <div className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted-foreground)]">Descripcion</Label>
                <Input
                  placeholder="opcional"
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                />
              </div>
              <div className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted-foreground)]">Icon</Label>
                <Input
                  placeholder="opcional"
                  value={catIcon}
                  onChange={(e) => setCatIcon(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setCategoryOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={catLoading}>
                  {catLoading && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--c-gray-200)] border-t-white mr-2" />
                  )}
                  {catId ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
