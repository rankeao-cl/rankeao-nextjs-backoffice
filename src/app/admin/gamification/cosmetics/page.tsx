"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  Input,
  Modal,
  ModalBody,
  ModalDialog,
  ModalFooter,
  ModalHeader,
  TextArea,
} from "@heroui/react";
import { createCosmetic, grantCosmetic, revokeCosmetic, updateCosmetic } from "@/lib/api-admin";
import { useDisclosure } from "@/hooks/use-disclosure";
import { Edit, Gift, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Cosmetic = Record<string, any>;

const COSMETIC_TYPES = ["AVATAR_FRAME", "NAME_EFFECT", "CARD_BACK"];

export default function CosmeticsPage() {
  const [cosmetics] = useState<Cosmetic[]>([]);

  const createModal = useDisclosure();
  const [editTarget, setEditTarget] = useState<Cosmetic | null>(null);
  const [formData, setFormData] = useState({
    slug: "",
    name: "",
    type: "AVATAR_FRAME",
    asset_url: "",
    rarity: "common",
  });
  const [formLoading, setFormLoading] = useState(false);

  const grantModal = useDisclosure();
  const [grantTarget, setGrantTarget] = useState<Cosmetic | null>(null);
  const [grantUserId, setGrantUserId] = useState("");
  const [grantReason, setGrantReason] = useState("");
  const [grantLoading, setGrantLoading] = useState(false);

  const revokeModal = useDisclosure();
  const [revokeTarget, setRevokeTarget] = useState<Cosmetic | null>(null);
  const [revokeUserId, setRevokeUserId] = useState("");
  const [revokeReason, setRevokeReason] = useState("");
  const [revokeLoading, setRevokeLoading] = useState(false);

  const openCreate = () => {
    setEditTarget(null);
    setFormData({ slug: "", name: "", type: "AVATAR_FRAME", asset_url: "", rarity: "common" });
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
    });
    createModal.onOpen();
  };

  const handleSave = async () => {
    setFormLoading(true);
    try {
      if (editTarget?.id) {
        await updateCosmetic(String(editTarget.id), formData);
        toast.success("Cosmetico actualizado");
      } else {
        await createCosmetic(formData);
        toast.success("Cosmetico creado");
      }
      createModal.onClose();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Error");
    } finally {
      setFormLoading(false);
    }
  };

  const openGrant = (cosmetic: Cosmetic) => {
    setGrantTarget(cosmetic);
    setGrantUserId("");
    setGrantReason("");
    grantModal.onOpen();
  };

  const handleGrant = async () => {
    if (!grantTarget?.id || !grantUserId) return;

    setGrantLoading(true);
    try {
      await grantCosmetic(String(grantTarget.id), {
        user_id: grantUserId,
        reason: grantReason || undefined,
      });
      toast.success("Cosmetico otorgado");
      grantModal.onClose();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Error");
    } finally {
      setGrantLoading(false);
    }
  };

  const openRevoke = (cosmetic: Cosmetic) => {
    setRevokeTarget(cosmetic);
    setRevokeUserId("");
    setRevokeReason("");
    revokeModal.onOpen();
  };

  const handleRevoke = async () => {
    if (!revokeTarget?.id || !revokeUserId) return;

    setRevokeLoading(true);
    try {
      await revokeCosmetic(String(revokeTarget.id), {
        user_id: revokeUserId,
        reason: revokeReason || undefined,
      });
      toast.success("Cosmetico revocado");
      revokeModal.onClose();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Error");
    } finally {
      setRevokeLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-purple-cyan">
            Cosmetics
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Avatar frames, name effects y card backs</p>
        </div>
        <Button
         
          onPress={openCreate}
          className="bg-gradient-to-r from-zinc-700 to-black shadow-lg shadow-white/10"
        >
          Nuevo Cosmetico
        </Button>
      </div>

      {cosmetics.length === 0 ? (
        <Card className="bg-[#0f1017]/60 border border-[#2a2f4b]/30">
          <CardContent className="flex flex-col items-center py-16 gap-4">
            <Sparkles className="h-12 w-12 text-zinc-600" />
            <p className="text-zinc-500">No hay cosmeticos cargados. Usa el boton "Nuevo Cosmetico".</p>
            <p className="text-xs text-zinc-600">
              La API no tiene endpoint GET para listar todos los cosmeticos de admin.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cosmetics.map((cosmetic) => (
            <Card
              key={String(cosmetic.id)}
              className="bg-[#0f1017] border border-[#2a2f4b]/40 hover:border-white/20 transition-all"
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                    <Sparkles className="h-5 w-5 text-zinc-200" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-200">{String(cosmetic.name || "-")}</p>
                    <p className="text-xs text-zinc-500">{String(cosmetic.type || "-")}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" isIconOnly onPress={() => openEdit(cosmetic)}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" isIconOnly onPress={() => openGrant(cosmetic)}>
                    <Gift className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" isIconOnly onPress={() => openRevoke(cosmetic)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={createModal.isOpen}
        onOpenChange={(isOpen) => !isOpen && createModal.onClose()}
      >
        <ModalDialog>
          <ModalHeader>{editTarget ? "Editar Cosmetico" : "Crear Cosmetico"}</ModalHeader>
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
            <div className="grid grid-cols-2 gap-4">
              <Input
               
                value={formData.type}
                onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
              />
              <Input
               
                value={formData.rarity}
                onChange={(e) => setFormData((prev) => ({ ...prev, rarity: e.target.value }))}
              />
            </div>
            <Input
             
              value={formData.asset_url}
              onChange={(e) => setFormData((prev) => ({ ...prev, asset_url: e.target.value }))}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onPress={createModal.onClose}>
              Cancelar
            </Button>
            <Button onPress={handleSave} isPending={formLoading}>
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
          <ModalHeader>Grant Cosmetico - {String(grantTarget?.name || "")}</ModalHeader>
          <ModalBody className="gap-4">
            <Input
             
              value={grantUserId}
              onChange={(e) => setGrantUserId(e.target.value)}
             
            />
            <TextArea
             
              value={grantReason}
              onChange={(e) => setGrantReason(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onPress={grantModal.onClose}>
              Cancelar
            </Button>
            <Button onPress={handleGrant} isPending={grantLoading}>
              Grant
            </Button>
          </ModalFooter>
        </ModalDialog>
      </Modal>

      <Modal
        isOpen={revokeModal.isOpen}
        onOpenChange={(isOpen) => !isOpen && revokeModal.onClose()}
      >
        <ModalDialog>
          <ModalHeader className="text-zinc-100">Revocar Cosmetico - {String(revokeTarget?.name || "")}</ModalHeader>
          <ModalBody className="gap-4">
            <Input
             
              value={revokeUserId}
              onChange={(e) => setRevokeUserId(e.target.value)}
             
            />
            <TextArea
             
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
    </div>
  );
}
