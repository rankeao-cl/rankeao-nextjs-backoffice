"use client";

import { useMemo, useState } from "react";
import {
  Card,
  Chip,
  Description,
  Fieldset,
  Form,
  Input,
  Label,
  Modal,
  Skeleton,
  Table,
  TextArea,
  TextField,
  Button,
  toast,
} from "@heroui/react";
import { useDisclosure } from "@/lib/hooks/use-disclosure";
import {
  useDisputes,
  useAssignDispute,
  useResolveDispute,
  useDisputedDuels,
  useAdminResolveDuel,
  useDisputedMatches,
  useAdminResolveMatch,
} from "@/lib/hooks/use-disputes";
import { getErrorMessage } from "@/lib/utils/error-message";
import type { Dispute, DuelDispute, MatchDispute } from "@/lib/types/dispute";
import { Scale } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabKey = "marketplace" | "duelos" | "matches";

type ResolutionForm = {
  outcome: string;
  refund_amount: number;
  notes: string;
  sanction: string;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_COLOR: Record<string, "default"> = {
  OPEN: "default",
  IN_PROGRESS: "default",
  RESOLVED: "default",
  CLOSED: "default",
  ESCALATED: "default",
};

const MARKETPLACE_COLUMNS = [
  { key: "id", label: "ID" },
  { key: "reason", label: "RAZON" },
  { key: "status", label: "ESTADO" },
  { key: "moderator", label: "MODERADOR" },
  { key: "actions", label: "ACCIONES" },
] as const;

const DUEL_COLUMNS = [
  { key: "duel", label: "DUELO" },
  { key: "game", label: "JUEGO" },
  { key: "score", label: "MARCADOR" },
  { key: "created_at", label: "FECHA" },
  { key: "actions", label: "ACCIONES" },
] as const;

const MATCH_COLUMNS = [
  { key: "tournament", label: "TORNEO" },
  { key: "round", label: "RONDA" },
  { key: "players", label: "JUGADORES" },
  { key: "score", label: "MARCADOR" },
  { key: "disputed_at", label: "DISPUTADO" },
  { key: "actions", label: "ACCIONES" },
] as const;

const EMPTY_META = {
  page: 1,
  per_page: 20,
  total: 0,
  total_pages: 1,
};

// ---------------------------------------------------------------------------
// Marketplace tab (existing logic, extracted as sub-component)
// ---------------------------------------------------------------------------

function MarketplaceDisputesTab() {
  const [idSearch, setIdSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [reasonFilter, setReasonFilter] = useState("");
  const [assignedModeratorFilter, setAssignedModeratorFilter] = useState("");
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [perPageInput, setPerPageInput] = useState("20");

  const assignModal = useDisclosure();
  const resolveModal = useDisclosure();

  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [moderatorId, setModeratorId] = useState("");

  const [resolution, setResolution] = useState<ResolutionForm>({
    outcome: "FULL_REFUND",
    refund_amount: 0,
    notes: "",
    sanction: "",
  });

  const perPage = Math.max(1, Number.parseInt(perPageInput, 10) || 20);

  const filters = useMemo(
    () => ({
      status: statusFilter || undefined,
      reason: reasonFilter || undefined,
      assigned_moderator_id: assignedModeratorFilter || undefined,
      unassigned: unassignedOnly ? true : undefined,
      page,
      per_page: perPage,
    }),
    [statusFilter, reasonFilter, assignedModeratorFilter, unassignedOnly, page, perPage]
  );

  const { data, isLoading } = useDisputes(filters);
  const disputes = data?.disputes ?? [];
  const meta = data?.meta ?? EMPTY_META;

  const assignMutation = useAssignDispute();
  const resolveMutation = useResolveDispute();

  const filteredDisputes = useMemo(() => {
    const q = idSearch.toLowerCase();
    if (!q) return disputes;
    return disputes.filter((dispute) => String(dispute.id || "").toLowerCase().includes(q));
  }, [disputes, idSearch]);

  const applyFilters = () => {
    if (page !== 1) setPage(1);
  };

  const clearFilters = () => {
    setStatusFilter("");
    setReasonFilter("");
    setAssignedModeratorFilter("");
    setUnassignedOnly(false);
    setIdSearch("");
    setPerPageInput("20");
    setPage(1);
  };

  const handleAssign = () => {
    if (!selectedDispute || !moderatorId) return;
    assignMutation.mutate(
      { disputeId: String(selectedDispute.id), data: { moderator_id: moderatorId } },
      {
        onSuccess: () => {
          toast.success("Moderador asignado");
          assignModal.onClose();
        },
        onError: (error: unknown) => {
          toast.danger(getErrorMessage(error));
        },
      }
    );
  };

  const handleResolve = () => {
    if (!selectedDispute) return;
    resolveMutation.mutate(
      {
        disputeId: String(selectedDispute.id),
        data: {
          outcome: resolution.outcome,
          refund_amount: resolution.refund_amount || undefined,
          notes: resolution.notes || undefined,
          sanction: resolution.sanction || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success("Disputa resuelta");
          resolveModal.onClose();
        },
        onError: (error: unknown) => {
          toast.danger(getErrorMessage(error));
        },
      }
    );
  };

  const renderCell = (dispute: Dispute, columnKey: string) => {
    switch (columnKey) {
      case "id":
        return <code className="text-xs text-[var(--muted)]">{String(dispute.id).slice(0, 8)}...</code>;
      case "reason":
        return <span className="text-sm">{String(dispute.reason || "-")}</span>;
      case "status":
        return (
          <Chip size="sm" color={STATUS_COLOR[String(dispute.status)] || "default"} variant="soft">
            {String(dispute.status || "-")}
          </Chip>
        );
      case "moderator":
        return (
          <span className="text-xs text-[var(--muted)]">
            {dispute.moderator_id ? `${String(dispute.moderator_id).slice(0, 8)}...` : "Sin asignar"}
          </span>
        );
      case "actions":
        return (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="secondary"
              onPress={() => {
                setSelectedDispute(dispute);
                setModeratorId("");
                assignModal.onOpen();
              }}
            >
              Asignar
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onPress={() => {
                setSelectedDispute(dispute);
                setResolution({ outcome: "FULL_REFUND", refund_amount: 0, notes: "", sanction: "" });
                resolveModal.onOpen();
              }}
            >
              Resolver
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
    <>
      <Card className="bg-[var(--surface)] border border-[var(--border)]">
        <Card.Content className="px-5 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <TextField className="space-y-1 flex flex-col min-w-[140px] flex-1">
              <Label className="text-xs text-[var(--muted)]">ID (local)</Label>
              <Input value={idSearch} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setIdSearch(e.target.value)} />
            </TextField>
            <TextField className="space-y-1 flex flex-col min-w-[140px] flex-1">
              <Label className="text-xs text-[var(--muted)]">Estado</Label>
              <Input placeholder="OPEN, RESOLVED..." value={statusFilter} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setStatusFilter(e.target.value)} />
            </TextField>
            <TextField className="space-y-1 flex flex-col min-w-[140px] flex-1">
              <Label className="text-xs text-[var(--muted)]">Razon</Label>
              <Input value={reasonFilter} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setReasonFilter(e.target.value)} />
            </TextField>
            <TextField className="space-y-1 flex flex-col min-w-[140px] flex-1">
              <Label className="text-xs text-[var(--muted)]">Moderador ID</Label>
              <Input value={assignedModeratorFilter} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setAssignedModeratorFilter(e.target.value)} />
            </TextField>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Input
              className="w-28"
              type="number"
              min={1}
              value={perPageInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setPerPageInput(e.target.value)}
              placeholder="per_page"
            />
            <Button
              type="button"
              size="sm"
              variant={unassignedOnly ? "primary" : "secondary"}
              onPress={() => setUnassignedOnly((prev) => !prev)}
            >
              Solo sin asignar
            </Button>
            <Button type="button" size="sm" variant="primary" onPress={applyFilters}>
              Aplicar filtros
            </Button>
            <Button type="button" size="sm" variant="tertiary" onPress={clearFilters}>
              Limpiar
            </Button>
          </div>
        </Card.Content>
      </Card>

      <Card className="bg-[var(--surface)] border border-[var(--border)]">
        <Card.Content className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-full rounded" />
                    <Skeleton className="h-3 w-3/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Disputas marketplace">
                  <Table.Header columns={MARKETPLACE_COLUMNS}>
                    {(column: { key: string; label: string }) => (
                      <Table.Column key={column.key} isRowHeader={column.key === MARKETPLACE_COLUMNS[0].key}>
                        {column.label}
                      </Table.Column>
                    )}
                  </Table.Header>
                  <Table.Body>
                    {filteredDisputes.length === 0 ? (
                      <Table.Row>
                        <Table.Cell colSpan={MARKETPLACE_COLUMNS.length}>
                          <p className="text-center text-sm text-[var(--muted)] py-6">
                            No hay disputas de marketplace actualmente
                          </p>
                        </Table.Cell>
                      </Table.Row>
                    ) : (
                      filteredDisputes.map((dispute) => (
                        <Table.Row key={String(dispute.id)}>
                          {MARKETPLACE_COLUMNS.map((column: { key: string; label: string }) => (
                            <Table.Cell key={column.key}>
                              {renderCell(dispute, column.key)}
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))
                    )}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--muted)] px-5 py-3 border-t border-[var(--border)]">
            <span>
              Pagina {meta.page} de {meta.total_pages} | Total aproximado: {meta.total}
            </span>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="secondary" isDisabled={!canPrev} onPress={() => setPage((prev) => Math.max(1, prev - 1))}>
                Anterior
              </Button>
              <Button type="button" size="sm" variant="secondary" isDisabled={!canNext} onPress={() => setPage((prev) => prev + 1)}>
                Siguiente
              </Button>
            </div>
          </div>
        </Card.Content>
      </Card>

      <Modal>
        <Modal.Backdrop isOpen={assignModal.isOpen} onOpenChange={(isOpen: boolean) => !isOpen && assignModal.onClose()}>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header><Modal.Heading>Asignar Moderador</Modal.Heading></Modal.Header>
              <Modal.Body className="gap-4">
                <Form className="w-full">
                  <Fieldset className="space-y-4 w-full">
                    <Description className="text-xs text-[var(--muted)]">Disputa: {String(selectedDispute?.id || "")}</Description>
                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">Moderador ID</Label>
                      <Input value={moderatorId} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setModeratorId(e.target.value)} />
                    </TextField>
                  </Fieldset>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={assignModal.onClose}>Cancelar</Button>
                <Button variant="primary" onPress={handleAssign} isPending={assignMutation.isPending}>Asignar</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal>
        <Modal.Backdrop isOpen={resolveModal.isOpen} onOpenChange={(isOpen: boolean) => !isOpen && resolveModal.onClose()}>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>
                  <div className="flex items-center gap-2">
                    <Scale className="h-5 w-5 text-[var(--foreground)]" aria-hidden="true" />
                    Resolver Disputa
                  </div>
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body className="gap-4">
                <Form className="w-full">
                  <Fieldset className="space-y-4 w-full">
                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">Outcome</Label>
                      <Input
                        value={resolution.outcome}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setResolution((prev) => ({ ...prev, outcome: e.target.value }))}
                      />
                    </TextField>
                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">Refund amount</Label>
                      <Input
                        type="number"
                        value={String(resolution.refund_amount)}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                          setResolution((prev) => ({ ...prev, refund_amount: Number.parseFloat(e.target.value) || 0 }))
                        }
                      />
                    </TextField>
                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">Notas</Label>
                      <TextArea
                        value={resolution.notes}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setResolution((prev) => ({ ...prev, notes: e.target.value }))}
                      />
                    </TextField>
                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">Sancion</Label>
                      <Input
                        value={resolution.sanction}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setResolution((prev) => ({ ...prev, sanction: e.target.value }))}
                      />
                    </TextField>
                  </Fieldset>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={resolveModal.onClose}>Cancelar</Button>
                <Button variant="primary" onPress={handleResolve} isPending={resolveMutation.isPending}>Resolver</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}

// ---------------------------------------------------------------------------
// Duelos tab
// ---------------------------------------------------------------------------

function DuelosDisputesTab() {
  const [page, setPage] = useState(1);
  const resolveModal = useDisclosure();
  const [selectedDuel, setSelectedDuel] = useState<DuelDispute | null>(null);
  const [winnerId, setWinnerId] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const filters = useMemo(() => ({ page, per_page: 20 }), [page]);

  const { data, isLoading } = useDisputedDuels(filters);
  const duels = data?.duels ?? [];
  const meta = data?.meta ?? EMPTY_META;

  const resolveMutation = useAdminResolveDuel();

  const handleResolve = () => {
    if (!selectedDuel || adminNotes.trim().length < 5) return;
    resolveMutation.mutate(
      {
        duelId: selectedDuel.id,
        data: {
          winner_id: winnerId.trim() || null,
          admin_notes: adminNotes.trim(),
        },
      },
      {
        onSuccess: () => {
          toast.success("Duelo resuelto");
          resolveModal.onClose();
          setWinnerId("");
          setAdminNotes("");
        },
        onError: (error: unknown) => {
          toast.danger(getErrorMessage(error));
        },
      }
    );
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  const renderCell = (duel: DuelDispute, columnKey: string) => {
    switch (columnKey) {
      case "duel":
        return (
          <span className="text-sm font-medium">
            {duel.challenger_username} <span className="text-[var(--muted)]">vs</span> {duel.challenged_username}
          </span>
        );
      case "game":
        return <span className="text-sm">{duel.game_name}</span>;
      case "score":
        return (
          <span className="text-sm font-mono">
            {duel.score_challenger} - {duel.score_challenged}
          </span>
        );
      case "created_at":
        return <span className="text-xs text-[var(--muted)]">{formatDate(duel.created_at)}</span>;
      case "actions":
        return (
          <Button
            size="sm"
            variant="secondary"
            onPress={() => {
              setSelectedDuel(duel);
              setWinnerId("");
              setAdminNotes("");
              resolveModal.onOpen();
            }}
          >
            Resolver
          </Button>
        );
      default:
        return null;
    }
  };

  const canPrev = page > 1;
  const canNext = page < Math.max(1, meta.total_pages);

  return (
    <>
      <Card className="bg-[var(--surface)] border border-[var(--border)]">
        <Card.Content className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-full rounded" />
                    <Skeleton className="h-3 w-3/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Duelos disputados">
                  <Table.Header columns={DUEL_COLUMNS}>
                    {(column: { key: string; label: string }) => (
                      <Table.Column key={column.key} isRowHeader={column.key === DUEL_COLUMNS[0].key}>
                        {column.label}
                      </Table.Column>
                    )}
                  </Table.Header>
                  <Table.Body>
                    {duels.length === 0 ? (
                      <Table.Row>
                        <Table.Cell colSpan={DUEL_COLUMNS.length}>
                          <p className="text-center text-sm text-[var(--muted)] py-6">
                            No hay duelos disputados actualmente
                          </p>
                        </Table.Cell>
                      </Table.Row>
                    ) : (
                      duels.map((duel) => (
                        <Table.Row key={duel.id}>
                          {DUEL_COLUMNS.map((column: { key: string; label: string }) => (
                            <Table.Cell key={column.key}>
                              {renderCell(duel, column.key)}
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))
                    )}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--muted)] px-5 py-3 border-t border-[var(--border)]">
            <span>
              Pagina {meta.page} de {meta.total_pages} | Total: {meta.total}
            </span>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="secondary" isDisabled={!canPrev} onPress={() => setPage((prev) => Math.max(1, prev - 1))}>
                Anterior
              </Button>
              <Button type="button" size="sm" variant="secondary" isDisabled={!canNext} onPress={() => setPage((prev) => prev + 1)}>
                Siguiente
              </Button>
            </div>
          </div>
        </Card.Content>
      </Card>

      <Modal>
        <Modal.Backdrop isOpen={resolveModal.isOpen} onOpenChange={(isOpen: boolean) => !isOpen && resolveModal.onClose()}>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>
                  <div className="flex items-center gap-2">
                    <Scale className="h-5 w-5 text-[var(--foreground)]" aria-hidden="true" />
                    Resolver Duelo
                  </div>
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body className="gap-4">
                <Form className="w-full">
                  <Fieldset className="space-y-4 w-full">
                    {selectedDuel && (
                      <Description className="text-xs text-[var(--muted)]">
                        {selectedDuel.challenger_username} vs {selectedDuel.challenged_username} — {selectedDuel.game_name}
                      </Description>
                    )}
                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">UUID del ganador (dejar vacío para empate)</Label>
                      <Input
                        value={winnerId}
                        placeholder="UUID del ganador, o vacío para empate"
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setWinnerId(e.target.value)}
                      />
                    </TextField>
                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">Notas del admin (mínimo 5 caracteres) *</Label>
                      <TextArea
                        value={adminNotes}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setAdminNotes(e.target.value)}
                      />
                    </TextField>
                  </Fieldset>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={resolveModal.onClose}>Cancelar</Button>
                <Button
                  variant="primary"
                  onPress={handleResolve}
                  isPending={resolveMutation.isPending}
                  isDisabled={adminNotes.trim().length < 5}
                >
                  Resolver
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}

// ---------------------------------------------------------------------------
// Matches torneos tab
// ---------------------------------------------------------------------------

function MatchesDisputesTab() {
  const [page, setPage] = useState(1);
  const resolveModal = useDisclosure();
  const [selectedMatch, setSelectedMatch] = useState<MatchDispute | null>(null);
  const [p1Wins, setP1Wins] = useState("0");
  const [p2Wins, setP2Wins] = useState("0");
  const [draws, setDraws] = useState("0");
  const [notes, setNotes] = useState("");

  const filters = useMemo(() => ({ page, per_page: 20 }), [page]);

  const { data, isLoading } = useDisputedMatches(filters);
  const matches = data?.matches ?? [];
  const meta = data?.meta ?? EMPTY_META;

  const resolveMutation = useAdminResolveMatch();

  const handleResolve = () => {
    if (!selectedMatch || notes.trim().length < 5) return;
    resolveMutation.mutate(
      {
        matchId: selectedMatch.id,
        data: {
          player1_wins: Number.parseInt(p1Wins, 10) || 0,
          player2_wins: Number.parseInt(p2Wins, 10) || 0,
          draws: Number.parseInt(draws, 10) || 0,
          notes: notes.trim(),
        },
      },
      {
        onSuccess: () => {
          toast.success("Match resuelto");
          resolveModal.onClose();
          setP1Wins("0");
          setP2Wins("0");
          setDraws("0");
          setNotes("");
        },
        onError: (error: unknown) => {
          toast.danger(getErrorMessage(error));
        },
      }
    );
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  const renderCell = (match: MatchDispute, columnKey: string) => {
    switch (columnKey) {
      case "tournament":
        return <span className="text-sm font-medium">{match.tournament_name}</span>;
      case "round":
        return <span className="text-sm">Ronda {match.round_number}</span>;
      case "players":
        return (
          <span className="text-sm">
            {match.player1?.username ?? "BYE"} <span className="text-[var(--muted)]">vs</span> {match.player2?.username ?? "BYE"}
          </span>
        );
      case "score":
        return (
          <span className="text-sm font-mono">
            {match.player1_wins} - {match.player2_wins}
            {match.draws > 0 && <span className="text-[var(--muted)]"> ({match.draws}E)</span>}
          </span>
        );
      case "disputed_at":
        return <span className="text-xs text-[var(--muted)]">{formatDate(match.disputed_at)}</span>;
      case "actions":
        return (
          <Button
            size="sm"
            variant="secondary"
            onPress={() => {
              setSelectedMatch(match);
              setP1Wins(String(match.player1_wins));
              setP2Wins(String(match.player2_wins));
              setDraws(String(match.draws));
              setNotes("");
              resolveModal.onOpen();
            }}
          >
            Resolver
          </Button>
        );
      default:
        return null;
    }
  };

  const canPrev = page > 1;
  const canNext = page < Math.max(1, meta.total_pages);

  return (
    <>
      <Card className="bg-[var(--surface)] border border-[var(--border)]">
        <Card.Content className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-full rounded" />
                    <Skeleton className="h-3 w-3/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Matches disputados">
                  <Table.Header columns={MATCH_COLUMNS}>
                    {(column: { key: string; label: string }) => (
                      <Table.Column key={column.key} isRowHeader={column.key === MATCH_COLUMNS[0].key}>
                        {column.label}
                      </Table.Column>
                    )}
                  </Table.Header>
                  <Table.Body>
                    {matches.length === 0 ? (
                      <Table.Row>
                        <Table.Cell colSpan={MATCH_COLUMNS.length}>
                          <p className="text-center text-sm text-[var(--muted)] py-6">
                            No hay matches disputados actualmente
                          </p>
                        </Table.Cell>
                      </Table.Row>
                    ) : (
                      matches.map((match) => (
                        <Table.Row key={match.id}>
                          {MATCH_COLUMNS.map((column: { key: string; label: string }) => (
                            <Table.Cell key={column.key}>
                              {renderCell(match, column.key)}
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))
                    )}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--muted)] px-5 py-3 border-t border-[var(--border)]">
            <span>
              Pagina {meta.page} de {meta.total_pages} | Total: {meta.total}
            </span>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="secondary" isDisabled={!canPrev} onPress={() => setPage((prev) => Math.max(1, prev - 1))}>
                Anterior
              </Button>
              <Button type="button" size="sm" variant="secondary" isDisabled={!canNext} onPress={() => setPage((prev) => prev + 1)}>
                Siguiente
              </Button>
            </div>
          </div>
        </Card.Content>
      </Card>

      <Modal>
        <Modal.Backdrop isOpen={resolveModal.isOpen} onOpenChange={(isOpen: boolean) => !isOpen && resolveModal.onClose()}>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>
                  <div className="flex items-center gap-2">
                    <Scale className="h-5 w-5 text-[var(--foreground)]" aria-hidden="true" />
                    Resolver Match
                  </div>
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body className="gap-4">
                <Form className="w-full">
                  <Fieldset className="space-y-4 w-full">
                    {selectedMatch && (
                      <Description className="text-xs text-[var(--muted)]">
                        {selectedMatch.tournament_name} — Ronda {selectedMatch.round_number}:{" "}
                        {selectedMatch.player1?.username ?? "BYE"} vs {selectedMatch.player2?.username ?? "BYE"}
                      </Description>
                    )}
                    <div className="flex gap-3">
                      <TextField className="space-y-1 flex flex-col flex-1">
                        <Label className="text-xs text-[var(--muted)]">Victorias J1</Label>
                        <Input
                          type="number"
                          min={0}
                          value={p1Wins}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setP1Wins(e.target.value)}
                        />
                      </TextField>
                      <TextField className="space-y-1 flex flex-col flex-1">
                        <Label className="text-xs text-[var(--muted)]">Victorias J2</Label>
                        <Input
                          type="number"
                          min={0}
                          value={p2Wins}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setP2Wins(e.target.value)}
                        />
                      </TextField>
                      <TextField className="space-y-1 flex flex-col flex-1">
                        <Label className="text-xs text-[var(--muted)]">Empates</Label>
                        <Input
                          type="number"
                          min={0}
                          value={draws}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraws(e.target.value)}
                        />
                      </TextField>
                    </div>
                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">Notas (mínimo 5 caracteres) *</Label>
                      <TextArea
                        value={notes}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNotes(e.target.value)}
                      />
                    </TextField>
                  </Fieldset>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={resolveModal.onClose}>Cancelar</Button>
                <Button
                  variant="primary"
                  onPress={handleResolve}
                  isPending={resolveMutation.isPending}
                  isDisabled={notes.trim().length < 5}
                >
                  Resolver
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const TAB_LABELS: Record<TabKey, string> = {
  marketplace: "Marketplace",
  duelos: "Duelos",
  matches: "Matches Torneos",
};

export default function DisputesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("marketplace");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-purple-cyan">
          Disputas
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">Panel unificado de disputas</p>
      </div>

      <div className="flex gap-2 border-b border-[var(--border)] pb-0">
        {(["marketplace", "duelos", "matches"] as TabKey[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-[var(--primary)] text-[var(--foreground)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {activeTab === "marketplace" && <MarketplaceDisputesTab />}
      {activeTab === "duelos" && <DuelosDisputesTab />}
      {activeTab === "matches" && <MatchesDisputesTab />}
    </div>
  );
}
