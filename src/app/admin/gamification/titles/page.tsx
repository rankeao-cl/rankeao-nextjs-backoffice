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
import { createTitle, grantTitle, revokeTitle, updateTitle } from "@/lib/api-admin";
import { useDisclosure } from "@/hooks/use-disclosure";
import { Crown, Edit, Gift, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Title = Record<string, string | boolean | number | undefined>;

export default function TitlesPage() {
  const [titles] = useState<Title[]>([]);

  const createModal = useDisclosure();
  const [editTarget, setEditTarget] = useState<Title | null>(null);
  const [formData, setFormData] = useState({
    slug: "",
    name: "",
    color: "#7c3aed",
    season_id: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  const grantModal = useDisclosure();
  const [grantTarget, setGrantTarget] = useState<Title | null>(null);
  const [grantUserId, setGrantUserId] = useState("");
  const [grantReason, setGrantReason] = useState("");
  const [grantLoading, setGrantLoading] = useState(false);

  const revokeModal = useDisclosure();
  const [revokeTarget, setRevokeTarget] = useState<Title | null>(null);
  const [revokeUserId, setRevokeUserId] = useState("");
  const [revokeReason, setRevokeReason] = useState("");
  const [revokeLoading, setRevokeLoading] = useState(false);

  const openCreate = () => {
    setEditTarget(null);
    setFormData({ slug: "", name: "", color: "#7c3aed", season_id: "" });
    createModal.onOpen();
  };

  const openEdit = (title: Title) => {
    setEditTarget(title);
    setFormData({
      slug: String(title.slug || ""),
      name: String(title.name || ""),
      color: String(title.color || "#7c3aed"),
      season_id: String(title.season_id || ""),
    });
    createModal.onOpen();
  };

  const handleSave = async () => {
    setFormLoading(true);
    try {
      const payload = { ...formData, season_id: formData.season_id || undefined };

      if (editTarget?.id) {
        await updateTitle(String(editTarget.id), payload);
        toast.success("Titulo actualizado");
      } else {
        await createTitle(payload);
        toast.success("Titulo creado");
      }

      createModal.onClose();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleGrant = async () => {
    if (!grantTarget?.id || !grantUserId) return;

    setGrantLoading(true);
    try {
      await grantTitle(String(grantTarget.id), {
        user_id: grantUserId,
        reason: grantReason || undefined,
      });
      toast.success("Titulo otorgado");
      grantModal.onClose();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Error");
    } finally {
      setGrantLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget?.id || !revokeUserId) return;

    setRevokeLoading(true);
    try {
      await revokeTitle(String(revokeTarget.id), {
        user_id: revokeUserId,
        reason: revokeReason || undefined,
      });
      toast.success("Titulo revocado");
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
            Titles
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Administrar titulos de usuario</p>
        </div>
        <Button
         
          onPress={openCreate}
          className="bg-gradient-to-r from-zinc-700 to-black shadow-lg shadow-white/10"
        >
          Nuevo Titulo
        </Button>
      </div>

      {titles.length === 0 ? (
        <Card className="bg-[#0f1017]/60 border border-[#2a2f4b]/30">
          <CardContent className="flex flex-col items-center py-16 gap-4">
            <Crown className="h-12 w-12 text-zinc-600" />
            <p className="text-zinc-500">No hay titulos cargados. Crea nuevos con el boton de arriba.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {titles.map((title) => (
            <Card key={String(title.id)} className="bg-[#0f1017] border border-[#2a2f4b]/40">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${String(title.color || "#7c3aed")}33` }}
                  >
                    <Crown className="h-5 w-5" style={{ color: String(title.color || "#7c3aed") }} />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-200">{String(title.name || "-")}</p>
                    <p className="text-xs text-zinc-500">{String(title.slug || "-")}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" isIconOnly onPress={() => openEdit(title)}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                   
                    isIconOnly
                    onPress={() => {
                      setGrantTarget(title);
                      setGrantUserId("");
                      setGrantReason("");
                      grantModal.onOpen();
                    }}
                  >
                    <Gift className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                   
                    isIconOnly
                    onPress={() => {
                      setRevokeTarget(title);
                      setRevokeUserId("");
                      setRevokeReason("");
                      revokeModal.onOpen();
                    }}
                  >
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
          <ModalHeader>{editTarget ? "Editar Titulo" : "Crear Titulo"}</ModalHeader>
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
               
                value={formData.color}
                onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                type="color"
              />
              <Input
               
                value={formData.season_id}
                onChange={(e) => setFormData((prev) => ({ ...prev, season_id: e.target.value }))}
              />
            </div>
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
          <ModalHeader>Grant Titulo - {String(grantTarget?.name || "")}</ModalHeader>
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
          <ModalHeader className="text-zinc-100">Revocar Titulo - {String(revokeTarget?.name || "")}</ModalHeader>
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
