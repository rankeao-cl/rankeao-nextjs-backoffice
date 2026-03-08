"use client";

import {
  useState
} from "react";
import {
  Calendar,
  Card,
  Chip,
  DateField,
  DatePicker,
  Description,
  Fieldset,
  Form,
  Input,
  Label,
  Modal,
  TextField,
  Button,
  type DateValue,
  toast,
} from "@heroui/react";
import { getErrorMessage } from "@/lib/utils/error-message";
import { useDisclosure } from "@/lib/hooks/use-disclosure";
import { Eye, Lock, Trophy } from "lucide-react";
import {
  useCreateSeason,
  usePreviewSeasonClose,
  useCloseSeason,
} from "@/lib/hooks/use-gamification";
import type { CreateSeasonRequest } from "@/lib/types/gamification";

export default function SeasonsPage() {
  const createModal = useDisclosure();
  const previewModal = useDisclosure();
  const closeModal = useDisclosure();

  const [formData, setFormData] = useState({ name: "" });
  const [startsAtValue, setStartsAtValue] = useState<DateValue | null>(null);
  const [endsAtValue, setEndsAtValue] = useState<DateValue | null>(null);
  const [selectedSeasonId, setSelectedSeasonId] = useState("");
  const [previewData, setPreviewData] = useState<unknown>(null);

  const createSeasonMutation = useCreateSeason();
  const previewSeasonCloseMutation = usePreviewSeasonClose();
  const closeSeasonMutation = useCloseSeason();

  const dateValueToIso = (value: DateValue | null, endOfDay = false): string => {
    if (!value) {
      return "";
    }

    const dateString = value.toString();
    const time = endOfDay ? "23:59:59.999" : "00:00:00.000";
    return new Date(`${dateString}T${time}Z`).toISOString();
  };

  const handleCreate = () => {
    if (!formData.name || !startsAtValue || !endsAtValue) {
      toast.danger("Completa todos los campos");
      return;
    }

    const payload: CreateSeasonRequest = {
      name: formData.name,
      starts_at: dateValueToIso(startsAtValue),
      ends_at: dateValueToIso(endsAtValue, true),
    };

    createSeasonMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Season creada");
        createModal.onClose();
        setFormData({ name: "" });
        setStartsAtValue(null);
        setEndsAtValue(null);
      },
      onError: (error: unknown) => {
        toast.danger(getErrorMessage(error));
      },
    });
  };

  const handlePreview = () => {
    if (!selectedSeasonId) {
      toast.danger("Ingresa el Season ID");
      return;
    }

    previewSeasonCloseMutation.mutate(selectedSeasonId, {
      onSuccess: (data) => {
        setPreviewData(data);
        previewModal.onOpen();
      },
      onError: (error: unknown) => {
        toast.danger(getErrorMessage(error));
      },
    });
  };

  const handleClose = () => {
    if (!selectedSeasonId) return;

    closeSeasonMutation.mutate(selectedSeasonId, {
      onSuccess: () => {
        toast.success("Season cerrada exitosamente");
        closeModal.onClose();
      },
      onError: (error: unknown) => {
        toast.danger(getErrorMessage(error));
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-purple-cyan">
            Seasons
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">Temporadas competitivas de gamificacion</p>
        </div>
        <Button

          onPress={createModal.onOpen}
        >
          Nueva Season
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <Card className="bg-[var(--surface)] border border-[var(--border)]">
          <Card.Content className="p-5">
            <Form className="space-y-4">
              <Fieldset className="space-y-4">
                <Fieldset.Legend className="flex items-center gap-2 font-semibold text-[var(--foreground)]">
                  <Eye className="h-5 w-5 text-[var(--foreground)]" />
                  Preview cierre
                </Fieldset.Legend>
                <Description className="text-xs text-[var(--muted)]">
                  Previsualiza que pasaria al cerrar una season sin ejecutar cambios.
                </Description>
                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted)]">Season ID</Label>
                  <Input
                    value={selectedSeasonId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setSelectedSeasonId(e.target.value)}
                  />
                </TextField>
                <Fieldset.Actions>
                  <Button type="button" variant="primary" onPress={handlePreview} isPending={previewSeasonCloseMutation.isPending}>
                    Preview
                  </Button>
                </Fieldset.Actions>
              </Fieldset>
            </Form>
          </Card.Content>
        </Card>

        <Card className="bg-[var(--surface)] border border-[var(--border)]">
          <Card.Content className="p-5">
            <Form className="space-y-4">
              <Fieldset className="space-y-4">
                <Fieldset.Legend className="flex items-center gap-2 font-semibold text-[var(--foreground)]">
                  <Lock className="h-5 w-5 text-[var(--foreground)]" />
                  Cerrar season
                </Fieldset.Legend>
                <Description className="text-xs text-[var(--muted)]">
                  Cierra una season activa. Esto snapshot rankings y distribuye rewards.
                </Description>
                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted)]">Season ID</Label>
                  <Input
                    value={selectedSeasonId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setSelectedSeasonId(e.target.value)}
                  />
                </TextField>
                <Fieldset.Actions>
                  <Button type="button" onPress={closeModal.onOpen}>
                    Cerrar season
                  </Button>
                </Fieldset.Actions>
              </Fieldset>
            </Form>
          </Card.Content>
        </Card>
      </div>

      <Card className="bg-[var(--surface-secondary)] border border-[var(--border)]">
        <Card.Content className="flex flex-col items-center py-12 gap-4">
          <Trophy className="h-12 w-12 text-[var(--field-placeholder)]" />
          <p className="text-[var(--muted)]">Las seasons se gestionan por ID. Usa los controles de arriba.</p>
          <Chip variant="soft" size="sm">
            La API no provee un GET para listar seasons
          </Chip>
        </Card.Content>
      </Card>

      <Card className="bg-[var(--surface-secondary)] border border-[var(--border)]">
        <Card.Content className="p-5">
          <Form>
            <Fieldset className="space-y-4">
              <Fieldset.Legend className="font-semibold text-[var(--foreground)]">Calendario</Fieldset.Legend>
              <Description className="text-xs text-[var(--muted)]">
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
        </Card.Content>
      </Card>

      <Modal>
        <Modal.Backdrop isOpen={createModal.isOpen} onOpenChange={(isOpen: boolean) => !isOpen && createModal.onClose()}>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Crear Season</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="gap-4">
                <Form className="w-full space-y-4">
                  <TextField className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted)]">Nombre</Label>
                    <Input
                      value={formData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
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
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={createModal.onClose}>
                  Cancelar
                </Button>
                <Button onPress={handleCreate} isPending={createSeasonMutation.isPending}>
                  Crear
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal>
        <Modal.Backdrop isOpen={previewModal.isOpen} onOpenChange={(isOpen: boolean) => !isOpen && previewModal.onClose()}>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Preview - Cierre de Season</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <pre className="bg-[var(--surface)] rounded-lg p-4 text-xs text-[var(--muted)] overflow-auto max-h-96">
                  {JSON.stringify(previewData, null, 2)}
                </pre>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={previewModal.onClose}>
                  Cerrar
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal>
        <Modal.Backdrop isOpen={closeModal.isOpen} onOpenChange={(isOpen: boolean) => !isOpen && closeModal.onClose()}>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Cerrar Season</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className="text-[var(--muted)] text-sm">
                  Esta accion es irreversible. Se tomaran snapshots de rankings y se distribuiran rewards.
                  ¿Confirmar?
                </p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={closeModal.onClose}>
                  Cancelar
                </Button>
                <Button onPress={handleClose} isPending={closeSeasonMutation.isPending}>
                  Cerrar Season
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
