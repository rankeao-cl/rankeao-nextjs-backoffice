"use client";

import { useState } from "react";
import {
  Button,
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
  Skeleton,
  TextField,
  toast,
  type DateValue,
} from "@heroui/react";
import { getErrorMessage } from "@/lib/utils/error-message";
import { useDisclosure } from "@/lib/hooks/use-disclosure";
import {
  CalendarDays,
  Eye,
  Lock,
  Star,
  Trophy,
  Users,
  Swords,
  Gamepad2,
} from "lucide-react";
import {
  useSeasons,
  useCreateSeason,
  usePreviewSeasonClose,
  useCloseSeason,
} from "@/lib/hooks/use-gamification";
import type { Season, CreateSeasonRequest } from "@/lib/types/gamification";

const STATUS_COLOR: Record<string, "success" | "warning" | "default"> = {
  active: "success",
  upcoming: "warning",
  closed: "default",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Activa",
  upcoming: "Proxima",
  closed: "Cerrada",
};

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function SeasonsPage() {
  const { data: seasons = [], isLoading } = useSeasons();

  const createModal = useDisclosure();
  const previewModal = useDisclosure();
  const closeModal = useDisclosure();

  const [formData, setFormData] = useState({ name: "" });
  const [startsAtValue, setStartsAtValue] = useState<DateValue | null>(null);
  const [endsAtValue, setEndsAtValue] = useState<DateValue | null>(null);
  const [selectedSeasonId, setSelectedSeasonId] = useState("");
  const [selectedSeasonName, setSelectedSeasonName] = useState("");
  const [previewData, setPreviewData] = useState<unknown>(null);

  const createSeasonMutation = useCreateSeason();
  const previewSeasonCloseMutation = usePreviewSeasonClose();
  const closeSeasonMutation = useCloseSeason();

  const dateValueToIso = (
    value: DateValue | null,
    endOfDay = false,
  ): string => {
    if (!value) return "";
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

  const handlePreview = (seasonId: string) => {
    if (!seasonId) {
      toast.danger("Season ID no disponible");
      return;
    }

    previewSeasonCloseMutation.mutate(seasonId, {
      onSuccess: (data) => {
        setPreviewData(data);
        previewModal.onOpen();
      },
      onError: (error: unknown) => {
        toast.danger(getErrorMessage(error));
      },
    });
  };

  const openCloseConfirmation = (season: Season) => {
    setSelectedSeasonId(season.id);
    setSelectedSeasonName(season.name);
    closeModal.onOpen();
  };

  const handleClose = () => {
    if (!selectedSeasonId) return;

    closeSeasonMutation.mutate(selectedSeasonId, {
      onSuccess: () => {
        toast.success("Season cerrada exitosamente");
        closeModal.onClose();
        setSelectedSeasonId("");
        setSelectedSeasonName("");
      },
      onError: (error: unknown) => {
        toast.danger(getErrorMessage(error));
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-purple-cyan">
            Temporadas
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Gestiona las temporadas competitivas de gamificacion
          </p>
        </div>
        <Button onPress={createModal.onOpen}>Nueva Season</Button>
      </div>

      {/* Seasons List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card
              key={i}
              className="bg-[var(--surface)] border border-[var(--border)]"
            >
              <Card.Content className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-40 rounded" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full rounded" />
                  <Skeleton className="h-3 w-3/4 rounded" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-28 rounded" />
                  <Skeleton className="h-8 w-28 rounded" />
                </div>
              </Card.Content>
            </Card>
          ))}
        </div>
      ) : seasons.length === 0 ? (
        <Card className="bg-[var(--surface-secondary)] border border-[var(--border)]">
          <Card.Content className="flex flex-col items-center py-12 gap-4">
            <Trophy className="h-12 w-12 text-[var(--field-placeholder)]" />
            <p className="text-[var(--muted)]">
              No hay temporadas creadas aun.
            </p>
            <Button variant="secondary" onPress={createModal.onOpen}>
              Crear primera season
            </Button>
          </Card.Content>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {seasons.map((season) => {
            const status = season.status?.toLowerCase() ?? "closed";
            const startDate =
              season.start_date || season.starts_at;
            const endDate = season.end_date || season.ends_at;
            const isActive = status === "active";

            return (
              <Card
                key={season.id}
                className="bg-[var(--surface)] border border-[var(--border)]"
              >
                <Card.Content className="p-5 space-y-4">
                  {/* Name + Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Trophy className="h-5 w-5 shrink-0 text-[var(--foreground)]" />
                      <h3 className="font-semibold text-[var(--foreground)] truncate">
                        {season.name}
                      </h3>
                      {season.is_current_season && (
                        <Chip size="sm" color="accent" variant="soft">
                          <Star className="h-3 w-3 mr-1 inline" />
                          Actual
                        </Chip>
                      )}
                    </div>
                    <Chip
                      size="sm"
                      color={STATUS_COLOR[status] ?? "default"}
                      variant="soft"
                    >
                      {STATUS_LABEL[status] ?? status}
                    </Chip>
                  </div>

                  {/* Dates */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDate(startDate)} &mdash; {formatDate(endDate)}
                    </span>
                    {season.days_remaining != null && (
                      <Chip size="sm" variant="soft" color="default">
                        {season.days_remaining} dias restantes
                      </Chip>
                    )}
                  </div>

                  {/* Stats */}
                  {season.stats && (
                    <div className="flex flex-wrap gap-3 text-xs text-[var(--muted)]">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {season.stats.total_players} jugadores
                      </span>
                      <span className="flex items-center gap-1">
                        <Swords className="h-3.5 w-3.5" />
                        {season.stats.total_tournaments} torneos
                      </span>
                      <span className="flex items-center gap-1">
                        <Gamepad2 className="h-3.5 w-3.5" />
                        {season.stats.total_matches} partidas
                      </span>
                      {season.stats.games_played &&
                        season.stats.games_played.length > 0 && (
                          <span className="text-[var(--field-placeholder)]">
                            Juegos: {season.stats.games_played.join(", ")}
                          </span>
                        )}
                    </div>
                  )}

                  {/* Slug / ID */}
                  <div className="flex items-center gap-2">
                    {season.slug && (
                      <code className="text-[10px] text-[var(--muted)] bg-[var(--surface-secondary)] px-2 py-0.5 rounded">
                        {season.slug}
                      </code>
                    )}
                    <code className="text-[10px] text-[var(--field-placeholder)] bg-[var(--surface-secondary)] px-2 py-0.5 rounded">
                      {season.id}
                    </code>
                  </div>

                  {/* Actions */}
                  {isActive && (
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        onPress={() => handlePreview(season.id)}
                        isPending={
                          previewSeasonCloseMutation.isPending
                        }
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Preview Cierre
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onPress={() => openCloseConfirmation(season)}
                      >
                        <Lock className="h-3.5 w-3.5 mr-1" />
                        Cerrar Season
                      </Button>
                    </div>
                  )}
                </Card.Content>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal>
        <Modal.Backdrop
          isOpen={createModal.isOpen}
          onOpenChange={(isOpen: boolean) => !isOpen && createModal.onClose()}
        >
          <Modal.Container>
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Crear Season</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="gap-4">
                <Form className="w-full space-y-4">
                  <TextField className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted)]">
                      Nombre
                    </Label>
                    <Input
                      value={formData.name}
                      onChange={(
                        e: React.ChangeEvent<
                          HTMLInputElement | HTMLTextAreaElement
                        >,
                      ) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                    />
                  </TextField>

                  <DatePicker
                    className="w-full"
                    name="starts-at"
                    value={startsAtValue}
                    onChange={setStartsAtValue}
                  >
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
                            {(day) => (
                              <Calendar.HeaderCell>{day}</Calendar.HeaderCell>
                            )}
                          </Calendar.GridHeader>
                          <Calendar.GridBody>
                            {(date) => <Calendar.Cell date={date} />}
                          </Calendar.GridBody>
                        </Calendar.Grid>
                      </Calendar>
                    </DatePicker.Popover>
                  </DatePicker>

                  <DatePicker
                    className="w-full"
                    name="ends-at"
                    value={endsAtValue}
                    onChange={setEndsAtValue}
                  >
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
                            {(day) => (
                              <Calendar.HeaderCell>{day}</Calendar.HeaderCell>
                            )}
                          </Calendar.GridHeader>
                          <Calendar.GridBody>
                            {(date) => <Calendar.Cell date={date} />}
                          </Calendar.GridBody>
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
                <Button
                  onPress={handleCreate}
                  isPending={createSeasonMutation.isPending}
                >
                  Crear
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* Preview Modal */}
      <Modal>
        <Modal.Backdrop
          isOpen={previewModal.isOpen}
          onOpenChange={(isOpen: boolean) => !isOpen && previewModal.onClose()}
        >
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

      {/* Close Confirmation Modal */}
      <Modal>
        <Modal.Backdrop
          isOpen={closeModal.isOpen}
          onOpenChange={(isOpen: boolean) => !isOpen && closeModal.onClose()}
        >
          <Modal.Container>
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Cerrar Season</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="space-y-3">
                <div className="flex items-center gap-2 text-[var(--danger)]">
                  <Lock className="h-5 w-5" />
                  <p className="font-semibold">Accion irreversible</p>
                </div>
                <p className="text-[var(--muted)] text-sm">
                  Estas a punto de cerrar la season{" "}
                  <strong className="text-[var(--foreground)]">
                    {selectedSeasonName}
                  </strong>
                  . Se tomaran snapshots de rankings y se distribuiran rewards.
                  Esta accion no se puede deshacer.
                </p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={closeModal.onClose}>
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  onPress={handleClose}
                  isPending={closeSeasonMutation.isPending}
                >
                  Confirmar cierre
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
