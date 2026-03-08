"use client";

import { useState } from "react";
import {
  Button,
  Card,
  Chip,
  Fieldset,
  Form,
  Input,
  Label,
  Modal,
  Skeleton,
  Table,
  TextArea,
  TextField,
} from "@heroui/react";
import { toast } from "@heroui/react";
import { useDisclosure } from "@/lib/hooks/use-disclosure";
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

const RARITY_CHIP_COLORS: Record<string, "default" | "accent" | "success" | "warning" | "danger"> = {
  common: "default",
  uncommon: "success",
  rare: "accent",
  epic: "warning",
  legendary: "danger",
};

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
  const createModal = useDisclosure();
  const [editTarget, setEditTarget] = useState<Cosmetic | null>(null);
  const [formData, setFormData] = useState<CosmeticForm>(INITIAL_FORM);

  // ── Grant modal ──
  const grantModal = useDisclosure();
  const [grantTarget, setGrantTarget] = useState<Cosmetic | null>(null);
  const [grantUserId, setGrantUserId] = useState("");
  const [grantReason, setGrantReason] = useState("");

  // ── Revoke modal ──
  const revokeModal = useDisclosure();
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
    createModal.onOpen();
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
    createModal.onOpen();
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
        createModal.onClose();
      } catch (error: unknown) {
        toast.danger(getErrorMessage(error, "Error al actualizar cosmetico"));
      }
    } else {
      if (!formData.slug || !formData.name || !formData.type) {
        toast.danger("Slug, nombre y tipo son requeridos");
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
        createModal.onClose();
      } catch (error: unknown) {
        toast.danger(getErrorMessage(error, "Error al crear cosmetico"));
      }
    }
  };

  const openGrant = (cosmetic: Cosmetic) => {
    setGrantTarget(cosmetic);
    setGrantUserId("");
    setGrantReason("");
    grantModal.onOpen();
  };

  const handleGrant = async () => {
    if (!grantTarget?.id || !grantUserId) {
      toast.danger("User ID es requerido");
      return;
    }

    const data: GrantRequest = {
      user_id: grantUserId,
      reason: grantReason || undefined,
    };

    try {
      await grantCosmetic.mutateAsync({ cosmeticId: String(grantTarget.id), data });
      toast.success("Cosmetico otorgado");
      grantModal.onClose();
    } catch (error: unknown) {
      toast.danger(getErrorMessage(error, "Error al otorgar cosmetico"));
    }
  };

  const openRevoke = (cosmetic: Cosmetic) => {
    setRevokeTarget(cosmetic);
    setRevokeUserId("");
    setRevokeReason("");
    revokeModal.onOpen();
  };

  const handleRevoke = async () => {
    if (!revokeTarget?.id || !revokeUserId) {
      toast.danger("User ID es requerido");
      return;
    }

    const data: GrantRequest = {
      user_id: revokeUserId,
      reason: revokeReason || undefined,
    };

    try {
      await revokeCosmetic.mutateAsync({ cosmeticId: String(revokeTarget.id), data });
      toast.success("Cosmetico revocado");
      revokeModal.onClose();
    } catch (error: unknown) {
      toast.danger(getErrorMessage(error, "Error al revocar cosmetico"));
    }
  };

  // ── Loading flags ──
  const formLoading = createCosmetic.isPending || updateCosmetic.isPending;
  const grantLoading = grantCosmetic.isPending;
  const revokeLoading = revokeCosmetic.isPending;

  // ── Table cell renderer ──

  const renderCell = (cosmetic: Cosmetic, columnKey: string) => {
    switch (columnKey) {
      case "name":
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--default)]">
              <Sparkles className="h-4 w-4 text-[var(--foreground)]" />
            </div>
            <div>
              <p className="font-medium text-[var(--foreground)]">{String(cosmetic.name || "-")}</p>
              {cosmetic.description && (
                <p className="text-xs text-[var(--muted)] line-clamp-1">{String(cosmetic.description)}</p>
              )}
            </div>
          </div>
        );
      case "slug":
        return (
          <code className="text-xs text-[var(--muted)] bg-[var(--surface)] px-2 py-0.5 rounded">
            {String(cosmetic.slug || "-")}
          </code>
        );
      case "type":
        return (
          <Chip size="sm" color="accent" variant="soft">
            {String(cosmetic.type || "-")}
          </Chip>
        );
      case "rarity": {
        const rarity = String(cosmetic.rarity || "common").toLowerCase();
        return (
          <Chip
            size="sm"
            color={RARITY_CHIP_COLORS[rarity] || "default"}
            variant="soft"
          >
            {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
          </Chip>
        );
      }
      case "total_owners":
        return (
          <span className="text-sm text-[var(--foreground)]">
            {cosmetic.total_owners ?? 0}
          </span>
        );
      case "status":
        return (
          <Chip size="sm" color={cosmetic.is_active ? "success" : "default"} variant="soft">
            {cosmetic.is_active ? "Activo" : "Inactivo"}
          </Chip>
        );
      case "created_at":
        return (
          <span className="text-xs text-[var(--muted)]">
            {cosmetic.created_at
              ? new Date(cosmetic.created_at).toLocaleDateString("es-CL")
              : "-"}
          </span>
        );
      case "actions":
        return (
          <div className="flex gap-1">
            <Button size="sm" variant="secondary" isIconOnly onPress={() => openEdit(cosmetic)}>
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="secondary" isIconOnly onPress={() => openGrant(cosmetic)}>
              <Gift className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="danger" isIconOnly onPress={() => openRevoke(cosmetic)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-purple-cyan">
            Cosmeticos
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Crear, editar y otorgar cosmeticos a usuarios
          </p>
        </div>
      </div>

      {/* ── Toolbar: search + filters + create button ── */}
      <Card className="bg-[var(--surface)] border border-[var(--border)]">
        <Card.Content className="px-5 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <TextField className="space-y-1 flex flex-col min-w-[200px] flex-1">
              <Label className="text-xs text-[var(--muted)]">Buscar cosmetico</Label>
              <Input
                placeholder="Nombre o slug..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setSearch(e.target.value)}
              />
            </TextField>

            <TextField className="space-y-1 flex flex-col min-w-[160px]">
              <Label className="text-xs text-[var(--muted)]">Tipo</Label>
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
            </TextField>

            <TextField className="space-y-1 flex flex-col min-w-[140px]">
              <Label className="text-xs text-[var(--muted)]">Rareza</Label>
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
            </TextField>

            <Button type="button" variant="primary" size="sm" onPress={openCreate}>
              <Plus className="h-4 w-4 mr-1" />
              Nuevo cosmetico
            </Button>
          </div>
        </Card.Content>
      </Card>

      {/* ── Data table ── */}
      <Card className="bg-[var(--surface)] border border-[var(--border)]">
        <Card.Content className="p-0">
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
            <div className="flex flex-col items-center justify-center py-16 text-[var(--muted)]">
              <Sparkles className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">No se encontraron cosmeticos</p>
            </div>
          ) : (
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Cosmetics table">
                  <Table.Header columns={TABLE_COLUMNS}>
                    {(column: { key: string; label: string }) => (
                      <Table.Column key={column.key} isRowHeader={column.key === TABLE_COLUMNS[0].key}>
                        {column.label}
                      </Table.Column>
                    )}
                  </Table.Header>
                  <Table.Body>
                    {filteredCosmetics.map((cosmetic) => (
                      <Table.Row key={String(cosmetic.id || cosmetic.slug || "-")}>
                        {TABLE_COLUMNS.map((column: { key: string; label: string }) => (
                          <Table.Cell key={column.key}>
                            {renderCell(cosmetic, column.key)}
                          </Table.Cell>
                        ))}
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          )}
        </Card.Content>

        {/* ── Pagination ── */}
        {meta.total_pages > 1 && (
          <Card.Content className="px-5 py-3 border-t border-[var(--border)]">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[var(--muted)]">
                Pagina {meta.page} de {meta.total_pages} ({meta.total} resultados)
              </p>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="secondary"
                  isIconOnly
                  isDisabled={page <= 1}
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  isIconOnly
                  isDisabled={page >= meta.total_pages}
                  onPress={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card.Content>
        )}
      </Card>

      {/* ── Create / Edit Modal ── */}
      <Modal>
        <Modal.Backdrop
          isOpen={createModal.isOpen}
          onOpenChange={(isOpen: boolean) => !isOpen && createModal.onClose()}
        >
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>{editTarget ? "Editar Cosmetico" : "Crear Cosmetico"}</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="gap-4">
                <Form className="w-full">
                  <Fieldset className="space-y-4 w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Nombre</Label>
                        <Input
                          placeholder="Golden Frame"
                          value={formData.name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                            setFormData((prev) => ({ ...prev, name: e.target.value }))
                          }
                        />
                      </TextField>
                      <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Slug</Label>
                        <Input
                          placeholder="golden-frame"
                          value={formData.slug}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                            setFormData((prev) => ({ ...prev, slug: e.target.value }))
                          }
                          disabled={Boolean(editTarget)}
                        />
                      </TextField>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Tipo</Label>
                        <select
                          className="h-9 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--ring)]"
                          value={formData.type}
                          onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                        >
                          {COSMETIC_TYPES.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </TextField>
                      <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Rareza</Label>
                        <select
                          className="h-9 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--ring)]"
                          value={formData.rarity}
                          onChange={(e) => setFormData((prev) => ({ ...prev, rarity: e.target.value }))}
                        >
                          {RARITY_OPTIONS.map((r) => (
                            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                          ))}
                        </select>
                      </TextField>
                    </div>

                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">Asset URL</Label>
                      <Input
                        placeholder="https://cdn.example.com/frame.png"
                        value={formData.asset_url}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                          setFormData((prev) => ({ ...prev, asset_url: e.target.value }))
                        }
                      />
                    </TextField>

                    {editTarget && (
                      <div className="flex items-center gap-3">
                        <label className="text-xs text-[var(--muted)]">Activo</label>
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
                        <span className="text-xs text-[var(--muted)]">
                          {formData.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    )}
                  </Fieldset>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={createModal.onClose}>
                  Cancelar
                </Button>
                <Button
                  onPress={handleSave}
                  isPending={formLoading}
                  variant="primary"
                >
                  {editTarget ? "Guardar" : "Crear"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* ── Grant Modal ── */}
      <Modal>
        <Modal.Backdrop
          isOpen={grantModal.isOpen}
          onOpenChange={(isOpen: boolean) => !isOpen && grantModal.onClose()}
        >
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Otorgar cosmetico - {String(grantTarget?.name || "")}</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="gap-4">
                <Form className="w-full">
                  <Fieldset className="space-y-4 w-full">
                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">User ID</Label>
                      <Input
                        placeholder="ID del usuario"
                        value={grantUserId}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setGrantUserId(e.target.value)}
                      />
                    </TextField>
                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">Motivo</Label>
                      <TextArea
                        placeholder="opcional"
                        value={grantReason}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setGrantReason(e.target.value)}
                      />
                    </TextField>
                  </Fieldset>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={grantModal.onClose}>
                  Cancelar
                </Button>
                <Button variant="primary" onPress={handleGrant} isPending={grantLoading}>
                  Otorgar
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* ── Revoke Modal ── */}
      <Modal>
        <Modal.Backdrop
          isOpen={revokeModal.isOpen}
          onOpenChange={(isOpen: boolean) => !isOpen && revokeModal.onClose()}
        >
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Revocar cosmetico - {String(revokeTarget?.name || "")}</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="gap-4">
                <Form className="w-full">
                  <Fieldset className="space-y-4 w-full">
                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">User ID</Label>
                      <Input
                        placeholder="ID del usuario"
                        value={revokeUserId}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setRevokeUserId(e.target.value)}
                      />
                    </TextField>
                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">Motivo</Label>
                      <TextArea
                        placeholder="opcional"
                        value={revokeReason}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setRevokeReason(e.target.value)}
                      />
                    </TextField>
                  </Fieldset>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={revokeModal.onClose}>
                  Cancelar
                </Button>
                <Button variant="danger" onPress={handleRevoke} isPending={revokeLoading}>
                  Revocar
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
