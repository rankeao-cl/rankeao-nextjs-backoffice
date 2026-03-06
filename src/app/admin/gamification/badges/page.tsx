"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalDialog,
  ModalFooter,
  ModalHeader,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  TextArea,
} from "@heroui/react";
import {
  bulkGrantBadge,
  createBadge,
  createBadgeCategory,
  getBadges,
  grantBadge,
  revokeBadge,
  updateBadge,
} from "@/lib/api-admin";
import { getTableColumnKey } from "@/lib/table-column-key";
import { useDisclosure } from "@/hooks/use-disclosure";
import { Award, Edit, Gift, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

type Badge = Record<string, any>;

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
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catIcon, setCatIcon] = useState("");
  const [catLoading, setCatLoading] = useState(false);

  const fetchBadges = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBadges();
      const payload = res as Record<string, unknown>;
      const list =
        (payload.badges as Badge[]) ||
        (payload.data as Badge[]) ||
        (Array.isArray(res) ? (res as Badge[]) : []);
      setBadges(list);
    } catch {
      toast.error("Error al cargar badges");
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
        await updateBadge(String(editTarget.id), formData);
        toast.success("Badge actualizado");
      } else {
        await createBadge(formData);
        toast.success("Badge creado");
      }
      createModal.onClose();
      fetchBadges();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Error");
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
        toast.success("Bulk grant ejecutado");
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
      toast.error(error instanceof Error ? error.message : "Error");
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
      toast.error(error instanceof Error ? error.message : "Error");
    } finally {
      setRevokeLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!catName) return;

    setCatLoading(true);
    try {
      await createBadgeCategory({
        name: catName,
        description: catDesc || undefined,
        icon: catIcon || undefined,
      });
      toast.success("Categoria creada");
      categoryModal.onClose();
      setCatName("");
      setCatDesc("");
      setCatIcon("");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Error");
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
              <img
                src={String(badge.icon_url)}
                alt={String(badge.name || "Badge")}
                className="h-8 w-8 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                <Award className="h-4 w-4 text-zinc-200" />
              </div>
            )}
            <div>
              <p className="font-medium text-zinc-200">{String(badge.name || "-")}</p>
              <p className="text-xs text-zinc-500 line-clamp-1">{String(badge.description || "")}</p>
            </div>
          </div>
        );
      case "slug":
        return (
          <code className="text-xs text-zinc-500 bg-[#0f1017] px-2 py-0.5 rounded">
            {String(badge.slug || "-")}
          </code>
        );
      case "rarity":
        return (
          <Chip
            size="sm"
            color={RARITY_COLORS[String(badge.rarity)] || "default"}
            variant="soft"
          >
            {String(badge.rarity || "-")}
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
            <Button size="sm" variant="ghost" isIconOnly onPress={() => openEdit(badge)}>
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" isIconOnly onPress={() => openGrant(badge)}>
              <Gift className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" isIconOnly onPress={() => openGrant(badge, true)}>
              <Users className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" isIconOnly onPress={() => openRevoke(badge)}>
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
          <p className="text-sm text-zinc-500 mt-1">Crear, editar y otorgar badges a usuarios</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onPress={categoryModal.onOpen} size="sm">
            Categoria
          </Button>
          <Button
           
            onPress={openCreate}
            className="bg-gradient-to-r from-zinc-700 to-black shadow-lg shadow-white/10"
          >
            Nuevo Badge
          </Button>
        </div>
      </div>

      <div className="space-y-6 pt-4">
        <div className="space-y-4">
          <Input
            placeholder="Buscar badge..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />

          {loading ? (
            <div className="flex justify-center py-20">
              <Spinner size="lg" color="current" />
            </div>
          ) : (
            <Table>
              <Table.Content aria-label="Badges table">
                <TableHeader columns={TABLE_COLUMNS}>
                  {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
                </TableHeader>
                <TableBody items={filteredBadges}>
                  {(badge) => (
                    <TableRow key={String(badge.id || badge.slug || "-")}>
                      {(column) => <TableCell>{renderCell(badge, getTableColumnKey(column))}</TableCell>}
                    </TableRow>
                  )}
                </TableBody>
              </Table.Content>
            </Table>
          )}
        </div>

        <div>
          <p className="text-zinc-500 text-sm">
            Las categorias agrupan badges por tematica. Crea nuevas con el boton
            "Categoria".
          </p>
        </div>
      </div>

      <Modal
        isOpen={createModal.isOpen}
        onOpenChange={(isOpen) => !isOpen && createModal.onClose()}
      >
        <ModalDialog>
          <ModalHeader>{editTarget ? "Editar Badge" : "Crear Badge"}</ModalHeader>
          <ModalBody className="gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
               
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
              <Input
               
                value={formData.slug}
                onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                disabled={Boolean(editTarget)}
              />
            </div>

            <TextArea
             
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
               
                value={formData.icon_url}
                onChange={(e) => setFormData((prev) => ({ ...prev, icon_url: e.target.value }))}
              />
              <Input
               
                value={formData.rarity}
                onChange={(e) => setFormData((prev) => ({ ...prev, rarity: e.target.value }))}
               
              />
            </div>

            <Input
             
              value={formData.category_id}
              onChange={(e) => setFormData((prev) => ({ ...prev, category_id: e.target.value }))}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onPress={createModal.onClose}>
              Cancelar
            </Button>
            <Button
             
              onPress={handleSave}
              isPending={formLoading}
              className="bg-gradient-to-r from-zinc-700 to-black"
            >
              {editTarget ? "Guardar" : "Crear"}
            </Button>
          </ModalFooter>
        </ModalDialog>
      </Modal>

      <Modal
        isOpen={grantModal.isOpen}
        onOpenChange={(isOpen) => !isOpen && grantModal.onClose()}
      >
        <ModalDialog>
          <ModalHeader>{isBulk ? "Bulk Grant Badge" : "Grant Badge"} - {String(grantTarget?.name || "")}</ModalHeader>
          <ModalBody className="gap-4">
            {isBulk ? (
              <TextArea
               
                value={bulkUserIds}
                onChange={(e) => setBulkUserIds(e.target.value)}
                rows={4}
              />
            ) : (
              <>
                <Input
                 
                  value={grantUserId}
                  onChange={(e) => setGrantUserId(e.target.value)}
                 
                />
                <Input
                 
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                />
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onPress={grantModal.onClose}>
              Cancelar
            </Button>
            <Button onPress={handleGrant} isPending={grantLoading}>
              {isBulk ? "Bulk Grant" : "Grant"}
            </Button>
          </ModalFooter>
        </ModalDialog>
      </Modal>

      <Modal
        isOpen={revokeModal.isOpen}
        onOpenChange={(isOpen) => !isOpen && revokeModal.onClose()}
      >
        <ModalDialog>
          <ModalHeader className="text-zinc-100">Revocar Badge - {String(revokeTarget?.name || "")}</ModalHeader>
          <ModalBody className="gap-4">
            <Input
             
              value={revokeUserId}
              onChange={(e) => setRevokeUserId(e.target.value)}
             
            />
            <Input
             
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onPress={revokeModal.onClose}>
              Cancelar
            </Button>
            <Button onPress={handleRevoke} isPending={revokeLoading}>
              Revocar
            </Button>
          </ModalFooter>
        </ModalDialog>
      </Modal>

      <Modal
        isOpen={categoryModal.isOpen}
        onOpenChange={(isOpen) => !isOpen && categoryModal.onClose()}
      >
        <ModalDialog>
          <ModalHeader>Crear Categoria de Badge</ModalHeader>
          <ModalBody className="gap-4">
            <Input
             
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
             
            />
            <Input
             
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
            />
            <Input
             
              value={catIcon}
              onChange={(e) => setCatIcon(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onPress={categoryModal.onClose}>
              Cancelar
            </Button>
            <Button onPress={handleCreateCategory} isPending={catLoading}>
              Crear
            </Button>
          </ModalFooter>
        </ModalDialog>
      </Modal>
    </div>
  );
}
