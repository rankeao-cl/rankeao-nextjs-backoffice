"use client";

import { useMemo, useState } from "react";
import {
  Button,
  Card,
  Chip,
  Modal,
  Skeleton,
  Table,
  TextArea,
  TextField,
  Label,
  Form,
  Fieldset,
  toast,
} from "@heroui/react";
import { ClipboardCheck, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { useDisclosure } from "@/lib/hooks/use-disclosure";
import {
  usePendingTournaments,
  useApproveTournament,
  useRejectTournament,
} from "@/lib/hooks/use-tournaments";
import { getErrorMessage } from "@/lib/utils/error-message";
import type { TournamentListItem } from "@/lib/types/tournament";

const TABLE_COLUMNS = [
  { key: "name", label: "TORNEO" },
  { key: "modality", label: "MODALIDAD" },
  { key: "tier", label: "TIER" },
  { key: "players", label: "JUGADORES" },
  { key: "starts_at", label: "INICIO" },
  { key: "actions", label: "ACCIONES" },
] as const;

const EMPTY_META = { page: 1, per_page: 20, total: 0, total_pages: 1 };

export default function TournamentApprovalsPage() {
  const [page, setPage] = useState(1);
  const perPage = 20;

  const approveModal = useDisclosure();
  const rejectModal = useDisclosure();

  const [selected, setSelected] = useState<TournamentListItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading } = usePendingTournaments({ page, per_page: perPage });
  const tournaments = data?.tournaments ?? [];
  const meta = data?.meta ?? EMPTY_META;

  const approveMutation = useApproveTournament();
  const rejectMutation = useRejectTournament();

  const handleApprove = () => {
    if (!selected) return;
    approveMutation.mutate(selected.id, {
      onSuccess: () => {
        toast.success(`Torneo "${selected.name}" aprobado`);
        approveModal.onClose();
        setSelected(null);
      },
      onError: (err: unknown) => {
        toast.danger(getErrorMessage(err, "Error al aprobar torneo"));
      },
    });
  };

  const handleReject = () => {
    if (!selected || !rejectReason.trim()) return;
    rejectMutation.mutate(
      { publicId: selected.id, reason: rejectReason.trim() },
      {
        onSuccess: () => {
          toast.success(`Torneo "${selected.name}" rechazado`);
          rejectModal.onClose();
          setSelected(null);
          setRejectReason("");
        },
        onError: (err: unknown) => {
          toast.danger(getErrorMessage(err, "Error al rechazar torneo"));
        },
      }
    );
  };

  const renderCell = (t: TournamentListItem, columnKey: string) => {
    switch (columnKey) {
      case "name":
        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-sm text-[var(--foreground)]">{t.name}</span>
            <span className="text-xs text-[var(--muted)]">{t.slug}</span>
            {t.city && (
              <span className="text-xs text-[var(--muted)]">{t.city}{t.region ? `, ${t.region}` : ""}</span>
            )}
          </div>
        );
      case "modality":
        return (
          <Chip size="sm" color="default" variant="soft">
            {t.modality}
          </Chip>
        );
      case "tier":
        return (
          <Chip size="sm" color="default" variant="soft">
            {t.tier}
          </Chip>
        );
      case "players":
        return (
          <span className="text-sm text-[var(--muted)]">
            {t.current_players}{t.max_players ? `/${t.max_players}` : ""}
          </span>
        );
      case "starts_at":
        return (
          <span className="text-xs text-[var(--muted)]">
            {new Date(t.starts_at).toLocaleDateString("es-CL", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        );
      case "actions":
        return (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="secondary"
              onPress={() => {
                setSelected(t);
                approveModal.onOpen();
              }}
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
              Aprobar
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onPress={() => {
                setSelected(t);
                setRejectReason("");
                rejectModal.onOpen();
              }}
            >
              <XCircle className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
              Rechazar
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  const canPrev = page > 1;
  const canNext = page < Math.max(1, meta.total_pages);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-purple-cyan">
          Aprobaciones de Torneos
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Torneos en estado PENDING_APPROVAL esperando revisión.
        </p>
      </div>

      <Card className="bg-[var(--surface)] border border-[var(--border)]">
        <Card.Content className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-full rounded" />
                    <Skeleton className="h-3 w-2/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : tournaments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--muted)]">
              <ClipboardCheck className="h-10 w-10 opacity-40" aria-hidden="true" />
              <p className="text-sm">No hay torneos pendientes de aprobación.</p>
            </div>
          ) : (
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Torneos pendientes">
                  <Table.Header columns={TABLE_COLUMNS}>
                    {(column: { key: string; label: string }) => (
                      <Table.Column key={column.key} isRowHeader={column.key === "name"}>
                        {column.label}
                      </Table.Column>
                    )}
                  </Table.Header>
                  <Table.Body>
                    {tournaments.map((t: TournamentListItem) => (
                      <Table.Row key={t.id}>
                        {TABLE_COLUMNS.map((col) => (
                          <Table.Cell key={col.key}>{renderCell(t, col.key)}</Table.Cell>
                        ))}
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          )}

          {tournaments.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--muted)] px-5 py-3 border-t border-[var(--border)]">
              <span>
                Pagina {meta.page} de {meta.total_pages} | Total: {meta.total}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  isDisabled={!canPrev}
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  isDisabled={!canNext}
                  onPress={() => setPage((p) => p + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Modal: Aprobar */}
      <Modal>
        <Modal.Backdrop
          isOpen={approveModal.isOpen}
          onOpenChange={(isOpen: boolean) => !isOpen && approveModal.onClose()}
        >
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-[var(--foreground)]" aria-hidden="true" />
                    Aprobar Torneo
                  </div>
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body className="gap-3">
                <p className="text-sm text-[var(--muted)]">
                  El torneo pasará a estado <strong className="text-[var(--foreground)]">OPEN</strong> y será visible para todos los jugadores.
                </p>
                {selected && (
                  <div className="rounded-md border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 space-y-1">
                    <p className="font-semibold text-sm text-[var(--foreground)]">{selected.name}</p>
                    <p className="text-xs text-[var(--muted)]">{selected.slug}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {selected.modality} · {selected.tier} · {selected.city ?? "Online"}
                    </p>
                  </div>
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={approveModal.onClose}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onPress={handleApprove}
                  isPending={approveMutation.isPending}
                >
                  Confirmar aprobación
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* Modal: Rechazar */}
      <Modal>
        <Modal.Backdrop
          isOpen={rejectModal.isOpen}
          onOpenChange={(isOpen: boolean) => !isOpen && rejectModal.onClose()}
        >
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-[var(--foreground)]" aria-hidden="true" />
                    Rechazar Torneo
                  </div>
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body className="gap-4">
                <p className="text-sm text-[var(--muted)]">
                  El torneo pasará a estado <strong className="text-[var(--foreground)]">REJECTED</strong>. El motivo quedará registrado en los metadatos.
                </p>
                {selected && (
                  <div className="rounded-md border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 space-y-1">
                    <p className="font-semibold text-sm text-[var(--foreground)]">{selected.name}</p>
                    <p className="text-xs text-[var(--muted)]">{selected.slug}</p>
                  </div>
                )}
                <Form className="w-full">
                  <Fieldset className="space-y-2 w-full">
                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">Motivo del rechazo <span className="text-red-400">*</span></Label>
                      <TextArea
                        placeholder="ej: El torneo no cumple con los requisitos mínimos de jugadores o el premio no está verificado."
                        value={rejectReason}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                          setRejectReason(e.target.value)
                        }
                        rows={3}
                      />
                    </TextField>
                  </Fieldset>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={rejectModal.onClose}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onPress={handleReject}
                  isPending={rejectMutation.isPending}
                  isDisabled={!rejectReason.trim()}
                >
                  Confirmar rechazo
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
