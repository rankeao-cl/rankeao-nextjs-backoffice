"use client";

import { useState } from "react";
import {
  Button,
  Card,
  Chip,
  Fieldset,
  Form,
  Input,
  Label,
  Modal,
  Skeleton,
  Table,
  TextField,
} from "@heroui/react";
import { toast } from "@heroui/react";
import { useDisclosure } from "@/lib/hooks/use-disclosure";
import { Edit, Plus, Search } from "lucide-react";
import { getErrorMessage } from "@/lib/utils/error-message";
import {
  useGames,
  useSets,
  useCreateSet,
  useUpdateSet,
} from "@/lib/hooks/use-catalog";
import type {
  Game,
  CardSet,
  CreateSetRequest,
  UpdateSetRequest,
} from "@/lib/types/catalog";

type SetForm = {
  code: string;
  name: string;
  release_date: string;
  set_type: string;
  total_cards: string;
  logo_url: string;
  icon_url: string;
  is_active: boolean;
};

const INITIAL_FORM: SetForm = {
  code: "",
  name: "",
  release_date: "",
  set_type: "",
  total_cards: "",
  logo_url: "",
  icon_url: "",
  is_active: true,
};

const TABLE_COLUMNS = [
  { key: "code", label: "CODIGO" },
  { key: "name", label: "NOMBRE" },
  { key: "set_type", label: "TIPO" },
  { key: "total_cards", label: "CARTAS" },
  { key: "status", label: "ESTADO" },
  { key: "release_date", label: "LANZAMIENTO" },
  { key: "actions", label: "ACCIONES" },
] as const;

export default function SetsPage() {
  const [selectedGame, setSelectedGame] = useState("");
  const [search, setSearch] = useState("");

  const { data: games = [], isLoading: gamesLoading } = useGames();
  const { data: sets = [], isLoading: setsLoading } = useSets(selectedGame);

  const createModal = useDisclosure();
  const [editTarget, setEditTarget] = useState<CardSet | null>(null);
  const [formData, setFormData] = useState<SetForm>(INITIAL_FORM);

  const createSet = useCreateSet();
  const updateSet = useUpdateSet();

  const filteredSets = sets.filter((s) => {
    const q = search.toLowerCase();
    return (
      String(s.name || "").toLowerCase().includes(q) ||
      String(s.code || "").toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    setEditTarget(null);
    setFormData(INITIAL_FORM);
    createModal.onOpen();
  };

  const openEdit = (set: CardSet) => {
    setEditTarget(set);
    setFormData({
      code: String(set.code || ""),
      name: String(set.name || ""),
      release_date: set.release_date ? String(set.release_date).slice(0, 10) : "",
      set_type: String(set.set_type || ""),
      total_cards: set.total_cards != null ? String(set.total_cards) : "",
      logo_url: String(set.logo_url || ""),
      icon_url: String(set.icon_url || ""),
      is_active: Boolean(set.is_active ?? true),
    });
    createModal.onOpen();
  };

  const handleSave = () => {
    if (!selectedGame) return;

    if (editTarget?.id) {
      const data: UpdateSetRequest = {};
      if (formData.code) data.code = formData.code;
      if (formData.name) data.name = formData.name;
      if (formData.release_date) data.release_date = formData.release_date;
      if (formData.set_type) data.set_type = formData.set_type;
      if (formData.total_cards) data.total_cards = Number(formData.total_cards);
      if (formData.logo_url) data.logo_url = formData.logo_url;
      if (formData.icon_url) data.icon_url = formData.icon_url;
      data.is_active = formData.is_active;

      updateSet.mutate(
        { setId: editTarget.id, data },
        {
          onSuccess: () => {
            toast.success("Set actualizado");
            createModal.onClose();
          },
          onError: (err: unknown) => {
            toast.danger(getErrorMessage(err, "Error al actualizar set"));
          },
        },
      );
    } else {
      const data: CreateSetRequest = {
        code: formData.code,
        name: formData.name,
      };
      if (formData.release_date) data.release_date = formData.release_date;
      if (formData.set_type) data.set_type = formData.set_type;
      if (formData.total_cards) data.total_cards = Number(formData.total_cards);
      if (formData.logo_url) data.logo_url = formData.logo_url;
      if (formData.icon_url) data.icon_url = formData.icon_url;

      createSet.mutate(
        { gameSlug: selectedGame, data },
        {
          onSuccess: () => {
            toast.success("Set creado");
            createModal.onClose();
          },
          onError: (err: unknown) => {
            toast.danger(getErrorMessage(err, "Error al crear set"));
          },
        },
      );
    }
  };

  const formLoading = createSet.isPending || updateSet.isPending;

  const handleGameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGame(e.target.value);
    setSearch("");
  };

  const renderCell = (set: CardSet, columnKey: string) => {
    switch (columnKey) {
      case "code":
        return (
          <code className="text-xs text-[var(--muted)] bg-[var(--surface)] px-2 py-0.5 rounded font-medium">
            {String(set.code || "-")}
          </code>
        );
      case "name":
        return (
          <span className="font-medium text-[var(--foreground)]">
            {String(set.name || "-")}
          </span>
        );
      case "set_type":
        return (
          <span className="text-sm text-[var(--muted)]">
            {String(set.set_type || "-")}
          </span>
        );
      case "total_cards":
        return (
          <span className="text-sm text-[var(--muted)]">
            {set.total_cards != null ? String(set.total_cards) : "-"}
          </span>
        );
      case "status":
        return (
          <Chip size="sm" color="default" variant="soft">
            {set.is_active ? "Activo" : "Inactivo"}
          </Chip>
        );
      case "release_date":
        return (
          <span className="text-xs text-[var(--muted)]">
            {set.release_date
              ? new Date(set.release_date).toLocaleDateString("es-CL")
              : "-"}
          </span>
        );
      case "actions":
        return (
          <div className="flex gap-1">
            <Button size="sm" variant="secondary" isIconOnly onPress={() => openEdit(set)}>
              <Edit className="h-3.5 w-3.5" />
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
            Sets / Expansiones
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Gestionar sets y expansiones del catalogo
          </p>
        </div>
      </div>

      {/* Game selector + search + create */}
      <Card className="bg-[var(--surface)] border border-[var(--border)]">
        <Card.Content className="px-5 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1 flex flex-col min-w-[200px]">
              <label className="text-xs text-[var(--muted)]">Juego</label>
              <select
                className="h-9 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus:ring-1 focus:ring-[var(--primary)]"
                value={selectedGame}
                onChange={handleGameChange}
              >
                <option value="">Seleccionar juego...</option>
                {gamesLoading ? (
                  <option disabled>Cargando...</option>
                ) : (
                  games.map((game: Game) => (
                    <option key={game.id} value={game.slug}>
                      {game.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <TextField className="space-y-1 flex flex-col min-w-[200px] flex-1">
              <Label className="text-xs text-[var(--muted)]">Buscar set</Label>
              <Input
                placeholder="Nombre o codigo..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                  setSearch(e.target.value)
                }
                disabled={!selectedGame}
              />
            </TextField>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onPress={openCreate}
              isDisabled={!selectedGame}
            >
              <Plus className="h-4 w-4 mr-1" />
              Nuevo set
            </Button>
          </div>
        </Card.Content>
      </Card>

      {/* Table */}
      <Card className="bg-[var(--surface)] border border-[var(--border)]">
        <Card.Content className="p-0">
          {!selectedGame ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="h-10 w-10 text-[var(--muted)] mb-3 opacity-40" />
              <p className="text-sm text-[var(--muted)]">
                Selecciona un juego para ver sus sets
              </p>
            </div>
          ) : setsLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-16 shrink-0 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-full rounded" />
                    <Skeleton className="h-3 w-3/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredSets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-[var(--muted)]">
                {search ? "No se encontraron sets con ese filtro" : "No hay sets para este juego"}
              </p>
            </div>
          ) : (
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Sets table">
                  <Table.Header columns={TABLE_COLUMNS}>
                    {(column: { key: string; label: string }) => (
                      <Table.Column key={column.key} isRowHeader={column.key === TABLE_COLUMNS[0].key}>
                        {column.label}
                      </Table.Column>
                    )}
                  </Table.Header>
                  <Table.Body>
                    {filteredSets.map((set) => (
                      <Table.Row key={set.id}>
                        {TABLE_COLUMNS.map((column: { key: string; label: string }) => (
                          <Table.Cell key={column.key}>
                            {renderCell(set, column.key)}
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

      {/* Create / Edit Modal */}
      <Modal>
        <Modal.Backdrop
          isOpen={createModal.isOpen}
          onOpenChange={(isOpen: boolean) => !isOpen && createModal.onClose()}
        >
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>
                  {editTarget ? "Editar Set" : "Crear Set"}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body className="gap-4">
                <Form className="w-full">
                  <Fieldset className="space-y-4 w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Codigo *</Label>
                        <Input
                          value={formData.code}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                            setFormData((prev) => ({ ...prev, code: e.target.value }))
                          }
                          placeholder="ej: SVI"
                        />
                      </TextField>
                      <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Nombre *</Label>
                        <Input
                          value={formData.name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                            setFormData((prev) => ({ ...prev, name: e.target.value }))
                          }
                          placeholder="ej: Scarlet & Violet"
                        />
                      </TextField>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Fecha de lanzamiento</Label>
                        <Input
                          type="date"
                          value={formData.release_date}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                            setFormData((prev) => ({ ...prev, release_date: e.target.value }))
                          }
                        />
                      </TextField>
                      <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Tipo de set</Label>
                        <Input
                          value={formData.set_type}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                            setFormData((prev) => ({ ...prev, set_type: e.target.value }))
                          }
                          placeholder="ej: expansion, core, promo"
                        />
                      </TextField>
                    </div>

                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">Total de cartas</Label>
                      <Input
                        type="number"
                        value={formData.total_cards}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                          setFormData((prev) => ({ ...prev, total_cards: e.target.value }))
                        }
                        placeholder="ej: 198"
                      />
                    </TextField>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Logo URL</Label>
                        <Input
                          value={formData.logo_url}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                            setFormData((prev) => ({ ...prev, logo_url: e.target.value }))
                          }
                          placeholder="https://..."
                        />
                      </TextField>
                      <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Icon URL</Label>
                        <Input
                          value={formData.icon_url}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                            setFormData((prev) => ({ ...prev, icon_url: e.target.value }))
                          }
                          placeholder="https://..."
                        />
                      </TextField>
                    </div>

                    {editTarget && (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="is_active"
                          checked={formData.is_active}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, is_active: e.target.checked }))
                          }
                          className="accent-[var(--primary)]"
                        />
                        <label htmlFor="is_active" className="text-sm text-[var(--foreground)]">
                          Activo
                        </label>
                      </div>
                    )}
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
    </div>
  );
}
