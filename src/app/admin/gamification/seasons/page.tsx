"use client";

import { useState } from "react";
import {
  Button,
  Calendar,
  Card,
  CardContent,
  Chip,
  Description,
  DateField,
  DatePicker,
  Fieldset,
  Form,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalDialog,
  ModalFooter,
  ModalHeader,
  TextField,
  type DateValue,
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

  const [formData, setFormData] = useState({ name: "" });
  const [startsAtValue, setStartsAtValue] = useState<DateValue | null>(null);
  const [endsAtValue, setEndsAtValue] = useState<DateValue | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedSeasonId, setSelectedSeasonId] = useState("");
  const [previewData, setPreviewData] = useState<unknown>(null);
  const [closeLoading, setCloseLoading] = useState(false);

  const dateValueToIso = (value: DateValue | null, endOfDay = false): string => {
    if (!value) {
      return "";
    }

    const dateString = value.toString();
    const time = endOfDay ? "23:59:59.999" : "00:00:00.000";
    return new Date(`${dateString}T${time}Z`).toISOString();
  };

  const handleCreate = async () => {
    if (!formData.name || !startsAtValue || !endsAtValue) {
      toast.error("Completa todos los campos");
      return;
    }

    setFormLoading(true);
    try {
      await createSeason({
        name: formData.name,
        starts_at: dateValueToIso(startsAtValue),
        ends_at: dateValueToIso(endsAtValue, true),
      });
      toast.success("Season creada");
      createModal.onClose();
      setFormData({ name: "" });
      setStartsAtValue(null);
      setEndsAtValue(null);
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
          <CardContent className="p-5">
            <Form className="space-y-4">
              <Fieldset className="space-y-4">
                <Fieldset.Legend className="flex items-center gap-2 font-semibold text-zinc-200">
                  <Eye className="h-5 w-5 text-zinc-200" />
                  Preview cierre
                </Fieldset.Legend>
                <Description className="text-xs text-zinc-500">
                  Previsualiza que pasaria al cerrar una season sin ejecutar cambios.
                </Description>
                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-zinc-400">Season ID</Label>
                  <Input
                    value={selectedSeasonId}
                    onChange={(e) => setSelectedSeasonId(e.target.value)}
                  />
                </TextField>
                <Fieldset.Actions>
                  <Button type="button" variant="ghost" onPress={handlePreview}>
                    Preview
                  </Button>
                </Fieldset.Actions>
              </Fieldset>
            </Form>
          </CardContent>
        </Card>

        <Card className="bg-[#0f1017] border border-white/20">
          <CardContent className="p-5">
            <Form className="space-y-4">
              <Fieldset className="space-y-4">
                <Fieldset.Legend className="flex items-center gap-2 font-semibold text-zinc-200">
                  <Lock className="h-5 w-5 text-zinc-100" />
                  Cerrar season
                </Fieldset.Legend>
                <Description className="text-xs text-zinc-500">
                  Cierra una season activa. Esto snapshot rankings y distribuye rewards.
                </Description>
                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-zinc-400">Season ID</Label>
                  <Input
                    value={selectedSeasonId}
                    onChange={(e) => setSelectedSeasonId(e.target.value)}
                  />
                </TextField>
                <Fieldset.Actions>
                  <Button type="button" onPress={closeModal.onOpen}>
                    Cerrar season
                  </Button>
                </Fieldset.Actions>
              </Fieldset>
            </Form>
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

      <Card className="bg-[#0f1017]/70 border border-[#2a2f4b]/35">
        <CardContent className="p-5">
          <Form>
            <Fieldset className="space-y-4">
              <Fieldset.Legend className="font-semibold text-zinc-200">Calendario</Fieldset.Legend>
              <Description className="text-xs text-zinc-500">
                Vista de referencia para planificar ventanas de temporada.
              </Description>
              <Calendar aria-label="Calendario de temporadas" className="w-full max-w-md">
                <Calendar.Header>
                  <Calendar.YearPickerTrigger>
                    <Calendar.YearPickerTriggerHeading />
                    <Calendar.YearPickerTriggerIndicator />
                  </Calendar.YearPickerTrigger>
                  <Calendar.NavButton slot="previous" />
                  <Calendar.NavButton slot="next" />
                </Calendar.Header>
                <Calendar.Grid>
                  <Calendar.GridHeader>
                    {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                  </Calendar.GridHeader>
                  <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
                </Calendar.Grid>
                <Calendar.YearPickerGrid>
                  <Calendar.YearPickerGridBody>
                    {({ year }) => <Calendar.YearPickerCell year={year} />}
                  </Calendar.YearPickerGridBody>
                </Calendar.YearPickerGrid>
              </Calendar>
            </Fieldset>
          </Form>
        </CardContent>
      </Card>

      <Modal
        isOpen={createModal.isOpen}
        onOpenChange={(isOpen) => !isOpen && createModal.onClose()}
      >
        <ModalDialog>
          <ModalHeader>Crear Season</ModalHeader>
          <ModalBody className="gap-4">
            <Form className="w-full space-y-4">
              <TextField className="space-y-1 flex flex-col">
                <Label className="text-xs text-zinc-400">Nombre</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                />
              </TextField>

              <DatePicker className="w-full" name="starts-at" value={startsAtValue} onChange={setStartsAtValue}>
                <Label>Inicio</Label>
                <DateField.Group fullWidth>
                  <DateField.Input>
                    {(segment) => <DateField.Segment segment={segment} />}
                  </DateField.Input>
                  <DateField.Suffix>
                    <DatePicker.Trigger>
                      <DatePicker.TriggerIndicator />
                    </DatePicker.Trigger>
                  </DateField.Suffix>
                </DateField.Group>
                <DatePicker.Popover>
                  <Calendar aria-label="Fecha de inicio">
                    <Calendar.Header>
                      <Calendar.YearPickerTrigger>
                        <Calendar.YearPickerTriggerHeading />
                        <Calendar.YearPickerTriggerIndicator />
                      </Calendar.YearPickerTrigger>
                      <Calendar.NavButton slot="previous" />
                      <Calendar.NavButton slot="next" />
                    </Calendar.Header>
                    <Calendar.Grid>
                      <Calendar.GridHeader>
                        {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                      </Calendar.GridHeader>
                      <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
                    </Calendar.Grid>
                  </Calendar>
                </DatePicker.Popover>
              </DatePicker>

              <DatePicker className="w-full" name="ends-at" value={endsAtValue} onChange={setEndsAtValue}>
                <Label>Fin</Label>
                <DateField.Group fullWidth>
                  <DateField.Input>
                    {(segment) => <DateField.Segment segment={segment} />}
                  </DateField.Input>
                  <DateField.Suffix>
                    <DatePicker.Trigger>
                      <DatePicker.TriggerIndicator />
                    </DatePicker.Trigger>
                  </DateField.Suffix>
                </DateField.Group>
                <DatePicker.Popover>
                  <Calendar aria-label="Fecha de cierre">
                    <Calendar.Header>
                      <Calendar.YearPickerTrigger>
                        <Calendar.YearPickerTriggerHeading />
                        <Calendar.YearPickerTriggerIndicator />
                      </Calendar.YearPickerTrigger>
                      <Calendar.NavButton slot="previous" />
                      <Calendar.NavButton slot="next" />
                    </Calendar.Header>
                    <Calendar.Grid>
                      <Calendar.GridHeader>
                        {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                      </Calendar.GridHeader>
                      <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
                    </Calendar.Grid>
                  </Calendar>
                </DatePicker.Popover>
              </DatePicker>
            </Form>
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
