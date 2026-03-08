"use client";

import {
  useCallback,
  useEffect,
  useState
} from "react";
import {
  Button,
  Chip,
  Fieldset,
  Form,
  Input,
  Label,
  Modal,
  Skeleton,
  Spinner,
  Table,
  TextArea,
  TextField,
  Card,
} from "@heroui/react";
import {
  bulkGrantBadge,
  createBadge,
  createBadgeCategory,
  getBadges,
  grantBadge,
  revokeBadge,
  updateBadge,
  updateBadgeCategory,
} from "@/lib/api-admin";
import { getErrorMessage } from "@/lib/error-message";
import { useDisclosure } from "@/hooks/use-disclosure";
import { Award, Edit, Gift, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

type Badge = Record<string, unknown>;

type BadgeForm = {
  slug: string;
  name: string;
  description: string;
  icon_url: string;
  rarity: string;
  category_id: string;
  is_active: boolean;
};

const RARITY_COLORS: Record<string, "default"> = {
  common: "default",
  uncommon: "default",
  rare: "default",
  epic: "default",
  legendary: "default",
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
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const createModal = useDisclosure();
  const [editTarget, setEditTarget] = useState<Badge | null>(null);
  const [formData, setFormData] = useState<BadgeForm>(INITIAL_FORM);
  const [formLoading, setFormLoading] = useState(false);

  const grantModal = useDisclosure();
  const [grantTarget, setGrantTarget] = useState<Badge | null>(null);
  const [grantUserId, setGrantUserId] = useState("");
  const [grantReason, setGrantReason] = useState("");
  const [isBulk, setIsBulk] = useState(false);
  const [bulkUserIds, setBulkUserIds] = useState("");
  const [grantLoading, setGrantLoading] = useState(false);

  const revokeModal = useDisclosure();
  const [revokeTarget, setRevokeTarget] = useState<Badge | null>(null);
  const [revokeUserId, setRevokeUserId] = useState("");
  const [revokeReason, setRevokeReason] = useState("");
  const [revokeLoading, setRevokeLoading] = useState(false);

  const categoryModal = useDisclosure();
  const [catId, setCatId] = useState("");
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catIcon, setCatIcon] = useState("");
  const [catLoading, setCatLoading] = useState(false);

  const fetchBadges = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBadges();
      console.log("Badges response inside page:", res);
      setBadges((res.badges as Badge[]) || []);
    } catch (error: unknown) {
      console.error("Error al cargar badges:", error);
      toast.error(getErrorMessage(error, "Error al cargar badges"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

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
    createModal.onOpen();
  };

  const openEdit = (badge: Badge) => {
    setEditTarget(badge);
    setFormData({
      slug: String(badge.slug || ""),
      name: String(badge.name || ""),
      description: String(badge.description || ""),
      icon_url: String(badge.icon_url || ""),
      rarity: String(badge.rarity || "common"),
      category_id: String(badge.category_id || ""),
      is_active: Boolean(badge.is_active ?? true),
    });
    createModal.onOpen();
  };

  const handleSave = async () => {
    setFormLoading(true);
    try {
      if (editTarget?.id) {
        // PATCH: only send mutable fields, convert category_id to number
        const updatePayload: Record<string, unknown> = {
          name: formData.name,
          description: formData.description,
          icon_url: formData.icon_url,
          rarity: formData.rarity,
          is_active: formData.is_active,
        };
        if (formData.category_id) {
          updatePayload.category_id = Number(formData.category_id);
        }
        await updateBadge(String(editTarget.id), updatePayload);
        toast.success("Badge actualizado");
      } else {
        const createPayload = {
          ...formData,
          category_id: formData.category_id ? Number(formData.category_id) : undefined,
        };
        await createBadge(createPayload);
        toast.success("Badge creado");
      }
      createModal.onClose();
      fetchBadges();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setFormLoading(false);
    }
  };

  const openGrant = (badge: Badge, bulk = false) => {
    setGrantTarget(badge);
    setIsBulk(bulk);
    setGrantUserId("");
    setGrantReason("");
    setBulkUserIds("");
    grantModal.onOpen();
  };

  const handleGrant = async () => {
    if (!grantTarget?.id) return;

    setGrantLoading(true);
    try {
      if (isBulk) {
        const ids = bulkUserIds
          .split(/[\n,]+/)
          .map((value) => value.trim())
          .filter(Boolean);

        if (!ids.length) {
          toast.error("Ingresa al menos un User ID");
          return;
        }

        await bulkGrantBadge(String(grantTarget.id), { user_ids: ids });
        toast.success("Otorgamiento masivo ejecutado");
      } else {
        if (!grantUserId) {
          toast.error("Ingresa el User ID");
          return;
        }

        await grantBadge(String(grantTarget.id), {
          user_id: grantUserId,
          reason: grantReason || undefined,
        });
        toast.success("Badge otorgado");
      }

      grantModal.onClose();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setGrantLoading(false);
    }
  };

  const openRevoke = (badge: Badge) => {
    setRevokeTarget(badge);
    setRevokeUserId("");
    setRevokeReason("");
    revokeModal.onOpen();
  };

  const handleRevoke = async () => {
    if (!revokeTarget?.id || !revokeUserId) return;

    setRevokeLoading(true);
    try {
      await revokeBadge(String(revokeTarget.id), {
        user_id: revokeUserId,
        reason: revokeReason || undefined,
      });
      toast.success("Badge revocado");
      revokeModal.onClose();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setRevokeLoading(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!catName) return;

    setCatLoading(true);
    try {
      if (catId) {
        await updateBadgeCategory(catId, {
          name: catName,
          description: catDesc || undefined,
          icon: catIcon || undefined,
        });
        toast.success("Categoria actualizada");
      } else {
        await createBadgeCategory({
          name: catName,
          description: catDesc || undefined,
          icon: catIcon || undefined,
        });
        toast.success("Categoria creada");
      }

      categoryModal.onClose();
      setCatId("");
      setCatName("");
      setCatDesc("");
      setCatIcon("");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setCatLoading(false);
    }
  };

  const renderCell = (badge: Badge, columnKey: string) => {
    switch (columnKey) {
      case "badge":
        return (
          <div className="flex items-center gap-3">
            {badge.icon_url ? (
              <Image
                src={String(badge.icon_url)}
                alt={String(badge.name || "Badge")}
                width={32}
                height={32}
                unoptimized
                className="h-8 w-8 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--default)]">
                <Award className="h-4 w-4 text-[var(--foreground)]" />
              </div>
            )}
            <div>
              <p className="font-medium text-[var(--foreground)]">{String(badge.name || "-")}</p>
              <p className="text-xs text-[var(--muted)] line-clamp-1">{String(badge.description || "")}</p>
            </div>
          </div>
        );
      case "slug":
        return (
          <code className="text-xs text-[var(--muted)] bg-[var(--surface)] px-2 py-0.5 rounded">
            {String(badge.slug || "-")}
          </code>
        );
      case "rarity":
        return (
          <Chip
            size="sm"
            color={RARITY_COLORS[String(badge.rarity).toLowerCase()] || "default"}
            variant="soft"
          >
            {String(badge.rarity).charAt(0).toUpperCase() + String(badge.rarity).slice(1).toLowerCase()}
          </Chip>
        );
      case "status":
        return (
          <Chip size="sm" color="default" variant="soft">
            {badge.is_active ? "Activo" : "Inactivo"}
          </Chip>
        );
      case "actions":
        return (
          <div className="flex gap-1">
            <Button size="sm" variant="secondary" isIconOnly onPress={() => openEdit(badge)}>
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="secondary" isIconOnly onPress={() => openGrant(badge)}>
              <Gift className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="secondary" isIconOnly onPress={() => openGrant(badge, true)}>
              <Users className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="danger" isIconOnly onPress={() => openRevoke(badge)}>
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-purple-cyan">
            Badges
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">Crear, editar y otorgar insignias a usuarios</p>
        </div>
      </div>

      <Card className="bg-[var(--surface)] border border-[var(--border)]">
        <Card.Content className="px-5 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <TextField className="space-y-1 flex flex-col min-w-[200px] flex-1">
              <Label className="text-xs text-[var(--muted)]">Buscar insignia</Label>
              <Input
                placeholder="Nombre o slug..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setSearch(e.target.value)}
              />
            </TextField>
            <Button type="button" variant="secondary" size="sm" onPress={categoryModal.onOpen}>
              Categoria
            </Button>
            <Button type="button" variant="primary" size="sm" onPress={openCreate}>
              Nueva insignia
            </Button>
          </div>
          <p className="text-[11px] text-[var(--field-placeholder)] mt-2">
            Tip: En categorías, si ingresas un <code>category_id</code> actualizas una existente; si lo dejas vacío, creas una nueva.
          </p>
        </Card.Content>
      </Card>

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
          ) : (
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Badges table">
                  <Table.Header columns={TABLE_COLUMNS}>
                    {(column: { key: string; label: string }) => (
                      <Table.Column key={column.key} isRowHeader={column.key === TABLE_COLUMNS[0].key}>
                        {column.label}
                      </Table.Column>
                    )}
                  </Table.Header>
                  <Table.Body>
                    {filteredBadges.map((badge) => (
                      <Table.Row key={String(badge.id || badge.slug || "-")}>
                        {TABLE_COLUMNS.map((column: { key: string; label: string }) => (
                          <Table.Cell key={column.key}>
                            {renderCell(badge, column.key)}
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
      </Card>

      <Modal>
        <Modal.Backdrop
          isOpen={createModal.isOpen}
          onOpenChange={(isOpen: boolean) => !isOpen && createModal.onClose()}
        >
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header><Modal.Heading>{editTarget ? "Editar Badge" : "Crear Badge"}</Modal.Heading></Modal.Header>
              <Modal.Body className="gap-4">
                <Form className="w-full">
                  <Fieldset className="space-y-4 w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Nombre</Label>
                        <Input
                          value={formData.name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        />
                      </TextField>
                      <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Slug</Label>
                        <Input
                          value={formData.slug}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                          disabled={Boolean(editTarget)}
                        />
                      </TextField>
                    </div>

                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">Descripcion</Label>
                      <TextArea
                        value={formData.description}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      />
                    </TextField>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Icon URL</Label>
                        <Input
                          value={formData.icon_url}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData((prev) => ({ ...prev, icon_url: e.target.value }))}
                        />
                      </TextField>
                      <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Rareza</Label>
                        <Input
                          value={formData.rarity}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData((prev) => ({ ...prev, rarity: e.target.value }))}
                        />
                      </TextField>
                    </div>

                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">Category ID</Label>
                      <Input
                        value={formData.category_id}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData((prev) => ({ ...prev, category_id: e.target.value }))}
                      />
                    </TextField>
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

      <Modal>
        <Modal.Backdrop
          isOpen={grantModal.isOpen}
          onOpenChange={(isOpen: boolean) => !isOpen && grantModal.onClose()}
        >
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header><Modal.Heading>{isBulk ? "Otorgamiento masivo de badge" : "Otorgar badge"} - {String(grantTarget?.name || "")}</Modal.Heading></Modal.Header>
              <Modal.Body className="gap-4">
                <Form className="w-full">
                  <Fieldset className="space-y-4 w-full">
                    {isBulk ? (
                      <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">User IDs</Label>
                        <TextArea
                          value={bulkUserIds}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setBulkUserIds(e.target.value)}
                          rows={4}
                        />
                      </TextField>
                    ) : (
                      <>
                        <TextField className="space-y-1 flex flex-col">
                          <Label className="text-xs text-[var(--muted)]">User ID</Label>
                          <Input
                            value={grantUserId}
                            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setGrantUserId(e.target.value)}
                          />
                        </TextField>
                        <TextField className="space-y-1 flex flex-col">
                          <Label className="text-xs text-[var(--muted)]">Motivo</Label>
                          <Input
                            value={grantReason}
                            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setGrantReason(e.target.value)}
                          />
                        </TextField>
                      </>
                    )}
                  </Fieldset>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={grantModal.onClose}>
                  Cancelar
                </Button>
                <Button variant="primary" onPress={handleGrant} isPending={grantLoading}>
                  {isBulk ? "Otorgar masivo" : "Otorgar"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal>
        <Modal.Backdrop
          isOpen={revokeModal.isOpen}
          onOpenChange={(isOpen: boolean) => !isOpen && revokeModal.onClose()}
        >
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header className="text-[var(--foreground)]">Revocar Badge - {String(revokeTarget?.name || "")}</Modal.Header>
              <Modal.Body className="gap-4">
                <Form className="w-full">
                  <Fieldset className="space-y-4 w-full">
                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">User ID</Label>
                      <Input
                        value={revokeUserId}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setRevokeUserId(e.target.value)}
                      />
                    </TextField>
                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">Motivo</Label>
                      <Input
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

      <Modal>
        <Modal.Backdrop
          isOpen={categoryModal.isOpen}
          onOpenChange={(isOpen: boolean) => !isOpen && categoryModal.onClose()}
        >
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header><Modal.Heading>{catId ? "Actualizar Categoria de Badge" : "Crear Categoria de Badge"}</Modal.Heading></Modal.Header>
              <Modal.Body className="gap-4">
                <Form className="w-full">
                  <Fieldset className="space-y-4 w-full">
                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">Category ID</Label>
                      <Input
                        placeholder="opcional para update"
                        value={catId}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCatId(e.target.value)}
                      />
                    </TextField>
                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">Nombre</Label>
                      <Input
                        value={catName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCatName(e.target.value)}
                      />
                    </TextField>
                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">Descripcion</Label>
                      <Input
                        placeholder="opcional"
                        value={catDesc}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCatDesc(e.target.value)}
                      />
                    </TextField>
                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">Icon</Label>
                      <Input
                        placeholder="opcional"
                        value={catIcon}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCatIcon(e.target.value)}
                      />
                    </TextField>
                  </Fieldset>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={categoryModal.onClose}>
                  Cancelar
                </Button>
                <Button variant="primary" onPress={handleSaveCategory} isPending={catLoading}>
                  {catId ? "Actualizar" : "Crear"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}

