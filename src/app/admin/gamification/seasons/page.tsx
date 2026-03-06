"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalDialog,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { closeSeason, createSeason, previewSeasonClose } from "@/lib/api-admin";
import { getErrorMessage } from "@/lib/error-message";
import { useDisclosure } from "@/hooks/use-disclosure";
import { Eye, Lock, Trophy } from "lucide-react";
import { toast } from "sonner";

export default function SeasonsPage() {
  const createModal = useDisclosure();
  const previewModal = useDisclosure();
  const closeModal = useDisclosure();

  const [formData, setFormData] = useState({ name: "", starts_at: "", ends_at: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [selectedSeasonId, setSelectedSeasonId] = useState("");
  const [previewData, setPreviewData] = useState<unknown>(null);
  const [closeLoading, setCloseLoading] = useState(false);

  const handleCreate = async () => {
    if (!formData.name || !formData.starts_at || !formData.ends_at) {
      toast.error("Completa todos los campos");
      return;
    }

    setFormLoading(true);
    try {
      await createSeason({
        name: formData.name,
        starts_at: new Date(formData.starts_at).toISOString(),
        ends_at: new Date(formData.ends_at).toISOString(),
      });
      toast.success("Season creada");
      createModal.onClose();
      setFormData({ name: "", starts_at: "", ends_at: "" });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setFormLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!selectedSeasonId) {
      toast.error("Ingresa el Season ID");
      return;
    }

    try {
      const data = await previewSeasonClose(selectedSeasonId);
      setPreviewData(data);
      previewModal.onOpen();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleClose = async () => {
    if (!selectedSeasonId) return;

    setCloseLoading(true);
    try {
      await closeSeason(selectedSeasonId, true);
      toast.success("Season cerrada exitosamente");
      closeModal.onClose();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setCloseLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-purple-cyan">
            Seasons
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Temporadas competitivas de gamificacion</p>
        </div>
        <Button
         
          onPress={createModal.onOpen}
          className="bg-gradient-to-r from-zinc-700 to-black shadow-lg shadow-white/10"
        >
          Nueva Season
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-[#0f1017] border border-[#2a2f4b]/40">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-zinc-200" />
              <h3 className="font-semibold text-zinc-200">Preview Close</h3>
            </div>
            <p className="text-xs text-zinc-500">
              Previsualiza que pasaria al cerrar una season sin ejecutar cambios.
            </p>
            <Input
             
              value={selectedSeasonId}
              onChange={(e) => setSelectedSeasonId(e.target.value)}
            />
            <Button variant="ghost" onPress={handlePreview}>
              Preview
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-[#0f1017] border border-white/20">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-zinc-100" />
              <h3 className="font-semibold text-zinc-200">Cerrar Season</h3>
            </div>
            <p className="text-xs text-zinc-500">
              Cierra una season activa. Esto snapshot rankings y distribuye rewards.
            </p>
            <Input
             
              value={selectedSeasonId}
              onChange={(e) => setSelectedSeasonId(e.target.value)}
            />
            <Button onPress={closeModal.onOpen}>
              Cerrar Season
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#0f1017]/60 border border-[#2a2f4b]/30">
        <CardContent className="flex flex-col items-center py-12 gap-4">
          <Trophy className="h-12 w-12 text-zinc-600" />
          <p className="text-zinc-500">Las seasons se gestionan por ID. Usa los controles de arriba.</p>
          <Chip variant="soft" size="sm">
            La API no provee un GET para listar seasons
          </Chip>
        </CardContent>
      </Card>

      <Modal
        isOpen={createModal.isOpen}
        onOpenChange={(isOpen) => !isOpen && createModal.onClose()}
      >
        <ModalDialog>
          <ModalHeader>Crear Season</ModalHeader>
          <ModalBody className="gap-4">
            <Input
             
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
             
            />
            <Input
             
              type="datetime-local"
              value={formData.starts_at}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  starts_at: e.target.value,
                }))
              }
             
            />
            <Input
             
              type="datetime-local"
              value={formData.ends_at}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  ends_at: e.target.value,
                }))
              }
             
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onPress={createModal.onClose}>
              Cancelar
            </Button>
            <Button onPress={handleCreate} isPending={formLoading}>
              Crear
            </Button>
          </ModalFooter>
        </ModalDialog>
      </Modal>

      <Modal
        isOpen={previewModal.isOpen}
        onOpenChange={(isOpen) => !isOpen && previewModal.onClose()}
      >
        <ModalDialog>
          <ModalHeader>Preview - Cierre de Season</ModalHeader>
          <ModalBody>
            <pre className="bg-[#0a0b12] rounded-lg p-4 text-xs text-zinc-400 overflow-auto max-h-96">
              {JSON.stringify(previewData, null, 2)}
            </pre>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onPress={previewModal.onClose}>
              Cerrar
            </Button>
          </ModalFooter>
        </ModalDialog>
      </Modal>

      <Modal
        isOpen={closeModal.isOpen}
        onOpenChange={(isOpen) => !isOpen && closeModal.onClose()}
      >
        <ModalDialog>
          <ModalHeader className="text-zinc-100">Cerrar Season</ModalHeader>
          <ModalBody>
            <p className="text-zinc-400 text-sm">
              Esta accion es irreversible. Se tomaran snapshots de rankings y se distribuiran rewards.
              ¿Confirmar?
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onPress={closeModal.onClose}>
              Cancelar
            </Button>
            <Button onPress={handleClose} isPending={closeLoading}>
              Cerrar Season
            </Button>
          </ModalFooter>
        </ModalDialog>
      </Modal>
    </div>
  );
}
