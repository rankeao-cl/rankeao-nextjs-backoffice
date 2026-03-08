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
  TextArea,
  TextField,
  toast,
} from "@heroui/react";
import { getErrorMessage } from "@/lib/utils/error-message";
import { useDisclosure } from "@/lib/hooks/use-disclosure";
import { ChevronDown, ChevronRight, Edit, Gamepad2, Plus } from "lucide-react";
import type {
  Game,
  Format,
  CreateGameRequest,
  UpdateGameRequest,
  CreateFormatRequest,
  UpdateFormatRequest,
} from "@/lib/types/catalog";
import {
  useGames,
  useCreateGame,
  useUpdateGame,
  useFormats,
  useCreateFormat,
  useUpdateFormat,
} from "@/lib/hooks/use-catalog";

// ── Game form ──

type GameForm = {
  slug: string;
  name: string;
  short_name: string;
  publisher: string;
  logo_url: string;
  description: string;
  is_active: boolean;
  sort_order: string;
};

const INITIAL_GAME_FORM: GameForm = {
  slug: "",
  name: "",
  short_name: "",
  publisher: "",
  logo_url: "",
  description: "",
  is_active: true,
  sort_order: "0",
};

// ── Format form ──

type FormatForm = {
  slug: string;
  name: string;
  description: string;
  is_ranked: boolean;
  is_active: boolean;
  sort_order: string;
  rules_url: string;
};

const INITIAL_FORMAT_FORM: FormatForm = {
  slug: "",
  name: "",
  description: "",
  is_ranked: false,
  is_active: true,
  sort_order: "0",
  rules_url: "",
};

// ── Table columns ──

const GAME_COLUMNS = [
  { key: "expand", label: "" },
  { key: "name", label: "NOMBRE" },
  { key: "slug", label: "SLUG" },
  { key: "publisher", label: "PUBLISHER" },
  { key: "formats", label: "FORMATOS" },
  { key: "status", label: "ESTADO" },
  { key: "created", label: "CREACION" },
  { key: "actions", label: "ACCIONES" },
] as const;

const FORMAT_COLUMNS = [
  { key: "name", label: "NOMBRE" },
  { key: "slug", label: "SLUG" },
  { key: "ranked", label: "RANKED" },
  { key: "status", label: "ESTADO" },
  { key: "sort_order", label: "ORDEN" },
  { key: "actions", label: "ACCIONES" },
] as const;

export default function GamesPage() {
  const { data: games = [], isLoading } = useGames();
  const [search, setSearch] = useState("");
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  // Game modal
  const gameModal = useDisclosure();
  const [editGame, setEditGame] = useState<Game | null>(null);
  const [gameForm, setGameForm] = useState<GameForm>(INITIAL_GAME_FORM);

  // Format modal
  const formatModal = useDisclosure();
  const [editFormat, setEditFormat] = useState<Format | null>(null);
  const [formatForm, setFormatForm] = useState<FormatForm>(INITIAL_FORMAT_FORM);

  // Mutations
  const createGame = useCreateGame();
  const updateGame = useUpdateGame();
  const createFormat = useCreateFormat();
  const updateFormat = useUpdateFormat();

  // Formats query for expanded game
  const { data: formats = [], isLoading: formatsLoading } = useFormats(expandedSlug ?? "");

  // ── Filters ──

  const filteredGames = games.filter((game) => {
    const q = search.toLowerCase();
    return (
      String(game.name || "").toLowerCase().includes(q) ||
      String(game.slug || "").toLowerCase().includes(q)
    );
  });

  // ── Game handlers ──

  const openCreateGame = () => {
    setEditGame(null);
    setGameForm(INITIAL_GAME_FORM);
    gameModal.onOpen();
  };

  const openEditGame = (game: Game) => {
    setEditGame(game);
    setGameForm({
      slug: String(game.slug || ""),
      name: String(game.name || ""),
      short_name: String(game.short_name || ""),
      publisher: String(game.publisher || ""),
      logo_url: String(game.logo_url || ""),
      description: String(game.description || ""),
      is_active: Boolean(game.is_active ?? true),
      sort_order: String(game.sort_order ?? 0),
    });
    gameModal.onOpen();
  };

  const handleSaveGame = () => {
    if (!gameForm.name) {
      toast.danger("El nombre es requerido");
      return;
    }

    if (editGame) {
      const data: UpdateGameRequest = {
        name: gameForm.name,
        short_name: gameForm.short_name || undefined,
        publisher: gameForm.publisher || undefined,
        logo_url: gameForm.logo_url || undefined,
        description: gameForm.description || undefined,
        is_active: gameForm.is_active,
        sort_order: Number(gameForm.sort_order) || 0,
      };
      updateGame.mutate(
        { slug: editGame.slug, data },
        {
          onSuccess: () => {
            toast.success("Juego actualizado");
            gameModal.onClose();
          },
          onError: (error: unknown) => {
            toast.danger(getErrorMessage(error));
          },
        },
      );
    } else {
      if (!gameForm.slug) {
        toast.danger("El slug es requerido");
        return;
      }
      const data: CreateGameRequest = {
        slug: gameForm.slug,
        name: gameForm.name,
        short_name: gameForm.short_name || undefined,
        publisher: gameForm.publisher || undefined,
        logo_url: gameForm.logo_url || undefined,
        description: gameForm.description || undefined,
        is_active: gameForm.is_active,
        sort_order: Number(gameForm.sort_order) || 0,
      };
      createGame.mutate(data, {
        onSuccess: () => {
          toast.success("Juego creado");
          gameModal.onClose();
        },
        onError: (error: unknown) => {
          toast.danger(getErrorMessage(error));
        },
      });
    }
  };

  // ── Format handlers ──

  const openCreateFormat = () => {
    setEditFormat(null);
    setFormatForm(INITIAL_FORMAT_FORM);
    formatModal.onOpen();
  };

  const openEditFormat = (format: Format) => {
    setEditFormat(format);
    setFormatForm({
      slug: String(format.slug || ""),
      name: String(format.name || ""),
      description: String(format.description || ""),
      is_ranked: Boolean(format.is_ranked),
      is_active: Boolean(format.is_active ?? true),
      sort_order: String(format.sort_order ?? 0),
      rules_url: String(format.rules_url || ""),
    });
    formatModal.onOpen();
  };

  const handleSaveFormat = () => {
    if (!expandedSlug) return;
    if (!formatForm.name) {
      toast.danger("El nombre es requerido");
      return;
    }

    if (editFormat) {
      const data: UpdateFormatRequest = {
        name: formatForm.name,
        description: formatForm.description || undefined,
        is_ranked: formatForm.is_ranked,
        is_active: formatForm.is_active,
        sort_order: Number(formatForm.sort_order) || 0,
        rules_url: formatForm.rules_url || undefined,
      };
      updateFormat.mutate(
        { gameSlug: expandedSlug, formatSlug: editFormat.slug, data },
        {
          onSuccess: () => {
            toast.success("Formato actualizado");
            formatModal.onClose();
          },
          onError: (error: unknown) => {
            toast.danger(getErrorMessage(error));
          },
        },
      );
    } else {
      if (!formatForm.slug) {
        toast.danger("El slug es requerido");
        return;
      }
      const data: CreateFormatRequest = {
        slug: formatForm.slug,
        name: formatForm.name,
        description: formatForm.description || undefined,
        is_ranked: formatForm.is_ranked,
        is_active: formatForm.is_active,
        sort_order: Number(formatForm.sort_order) || 0,
        rules_url: formatForm.rules_url || undefined,
      };
      createFormat.mutate(
        { gameSlug: expandedSlug, data },
        {
          onSuccess: () => {
            toast.success("Formato creado");
            formatModal.onClose();
          },
          onError: (error: unknown) => {
            toast.danger(getErrorMessage(error));
          },
        },
      );
    }
  };

  // ── Toggle expand ──

  const toggleExpand = (slug: string) => {
    setExpandedSlug((prev) => (prev === slug ? null : slug));
  };

  // ── Render cells ──

  const gameLoading = createGame.isPending || updateGame.isPending;
  const formatLoading = createFormat.isPending || updateFormat.isPending;

  const renderGameCell = (game: Game, columnKey: string) => {
    switch (columnKey) {
      case "expand":
        return (
          <button
            type="button"
            className="p-1 text-[var(--muted)] hover:text-[var(--foreground)]"
            onClick={() => toggleExpand(game.slug)}
          >
            {expandedSlug === game.slug ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        );
      case "name":
        return (
          <div className="flex items-center gap-2">
            {game.logo_url ? (
              <img
                src={game.logo_url}
                alt={game.name}
                className="h-6 w-6 rounded object-cover"
              />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded bg-[var(--default)]">
                <Gamepad2 className="h-3.5 w-3.5 text-[var(--foreground)]" />
              </div>
            )}
            <span className="font-medium text-[var(--foreground)]">{String(game.name || "-")}</span>
          </div>
        );
      case "slug":
        return (
          <code className="text-xs text-[var(--muted)] bg-[var(--surface)] px-2 py-0.5 rounded">
            {String(game.slug || "-")}
          </code>
        );
      case "publisher":
        return <span className="text-[var(--muted)]">{String(game.publisher || "-")}</span>;
      case "formats":
        return <span className="text-[var(--muted)]">{game.formats_count ?? 0}</span>;
      case "status":
        return (
          <Chip size="sm" color="default" variant="soft">
            {game.is_active ? "Activo" : "Inactivo"}
          </Chip>
        );
      case "created":
        return (
          <span className="text-xs text-[var(--muted)]">
            {game.created_at ? new Date(game.created_at).toLocaleDateString("es-CL") : "-"}
          </span>
        );
      case "actions":
        return (
          <Button size="sm" variant="secondary" isIconOnly onPress={() => openEditGame(game)}>
            <Edit className="h-3.5 w-3.5" />
          </Button>
        );
      default:
        return null;
    }
  };

  const renderFormatCell = (format: Format, columnKey: string) => {
    switch (columnKey) {
      case "name":
        return <span className="font-medium text-[var(--foreground)]">{String(format.name || "-")}</span>;
      case "slug":
        return (
          <code className="text-xs text-[var(--muted)] bg-[var(--surface)] px-2 py-0.5 rounded">
            {String(format.slug || "-")}
          </code>
        );
      case "ranked":
        return (
          <Chip size="sm" color="default" variant="soft">
            {format.is_ranked ? "Si" : "No"}
          </Chip>
        );
      case "status":
        return (
          <Chip size="sm" color="default" variant="soft">
            {format.is_active ? "Activo" : "Inactivo"}
          </Chip>
        );
      case "sort_order":
        return <span className="text-xs text-[var(--muted)]">{format.sort_order}</span>;
      case "actions":
        return (
          <Button size="sm" variant="secondary" isIconOnly onPress={() => openEditFormat(format)}>
            <Edit className="h-3.5 w-3.5" />
          </Button>
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
            Juegos y Formatos
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Gestiona los juegos del catalogo y sus formatos de competencia
          </p>
        </div>
        <Button variant="primary" size="sm" onPress={openCreateGame}>
          <Plus className="h-4 w-4" />
          Nuevo juego
        </Button>
      </div>

      {/* Search */}
      <Card className="bg-[var(--surface)] border border-[var(--border)]">
        <Card.Content className="px-5 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <TextField className="space-y-1 flex flex-col min-w-[200px] flex-1">
              <Label className="text-xs text-[var(--muted)]">Buscar juego</Label>
              <Input
                placeholder="Nombre o slug..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setSearch(e.target.value)}
              />
            </TextField>
          </div>
        </Card.Content>
      </Card>

      {/* Games table */}
      <Card className="bg-[var(--surface)] border border-[var(--border)]">
        <Card.Content className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
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
                <Table.Content aria-label="Games table">
                  <Table.Header columns={GAME_COLUMNS}>
                    {(column: { key: string; label: string }) => (
                      <Table.Column key={column.key} isRowHeader={column.key === "name"}>
                        {column.label}
                      </Table.Column>
                    )}
                  </Table.Header>
                  <Table.Body>
                    {filteredGames.map((game) => (
                      <Table.Row
                        key={game.id}
                        className={expandedSlug === game.slug ? "bg-[var(--surface-secondary)]" : ""}
                      >
                        {GAME_COLUMNS.map((column: { key: string; label: string }) => (
                          <Table.Cell key={column.key}>
                            {renderGameCell(game, column.key)}
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

      {/* Formats section (shown when a game is expanded) */}
      {expandedSlug && (
        <Card className="bg-[var(--surface)] border border-[var(--border)]">
          <Card.Content className="p-0">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                Formatos de <code className="text-xs bg-[var(--default)] px-1.5 py-0.5 rounded ml-1">{expandedSlug}</code>
              </p>
              <Button variant="secondary" size="sm" onPress={openCreateFormat}>
                <Plus className="h-3.5 w-3.5" />
                Nuevo formato
              </Button>
            </div>

            {formatsLoading ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-full rounded" />
                      <Skeleton className="h-3 w-2/3 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : formats.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-2">
                <p className="text-sm text-[var(--muted)]">Sin formatos registrados</p>
              </div>
            ) : (
              <Table>
                <Table.ScrollContainer>
                  <Table.Content aria-label="Formats table">
                    <Table.Header columns={FORMAT_COLUMNS}>
                      {(column: { key: string; label: string }) => (
                        <Table.Column key={column.key} isRowHeader={column.key === "name"}>
                          {column.label}
                        </Table.Column>
                      )}
                    </Table.Header>
                    <Table.Body>
                      {formats.map((format) => (
                        <Table.Row key={format.id}>
                          {FORMAT_COLUMNS.map((column: { key: string; label: string }) => (
                            <Table.Cell key={column.key}>
                              {renderFormatCell(format, column.key)}
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
      )}

      {/* Game modal (create / edit) */}
      <Modal>
        <Modal.Backdrop
          isOpen={gameModal.isOpen}
          onOpenChange={(isOpen: boolean) => !isOpen && gameModal.onClose()}
        >
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>{editGame ? "Editar juego" : "Crear juego"}</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="gap-4">
                <Form className="w-full">
                  <Fieldset className="space-y-4 w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Nombre</Label>
                        <Input
                          value={gameForm.name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setGameForm((prev) => ({ ...prev, name: e.target.value }))}
                        />
                      </TextField>
                      <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Slug</Label>
                        <Input
                          value={gameForm.slug}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setGameForm((prev) => ({ ...prev, slug: e.target.value }))}
                          disabled={Boolean(editGame)}
                        />
                      </TextField>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Nombre corto</Label>
                        <Input
                          placeholder="opcional"
                          value={gameForm.short_name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setGameForm((prev) => ({ ...prev, short_name: e.target.value }))}
                        />
                      </TextField>
                      <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Publisher</Label>
                        <Input
                          placeholder="opcional"
                          value={gameForm.publisher}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setGameForm((prev) => ({ ...prev, publisher: e.target.value }))}
                        />
                      </TextField>
                    </div>

                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">Logo URL</Label>
                      <Input
                        placeholder="opcional"
                        value={gameForm.logo_url}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setGameForm((prev) => ({ ...prev, logo_url: e.target.value }))}
                      />
                    </TextField>

                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">Descripcion</Label>
                      <TextArea
                        placeholder="opcional"
                        value={gameForm.description}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setGameForm((prev) => ({ ...prev, description: e.target.value }))}
                      />
                    </TextField>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Orden</Label>
                        <Input
                          type="number"
                          value={gameForm.sort_order}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setGameForm((prev) => ({ ...prev, sort_order: e.target.value }))}
                        />
                      </TextField>
                      <div className="flex items-center gap-2 pt-5">
                        <input
                          type="checkbox"
                          id="game-active"
                          checked={gameForm.is_active}
                          onChange={(e) => setGameForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                          className="accent-[var(--accent)]"
                        />
                        <label htmlFor="game-active" className="text-xs text-[var(--muted)]">Activo</label>
                      </div>
                    </div>
                  </Fieldset>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={gameModal.onClose}>
                  Cancelar
                </Button>
                <Button variant="primary" onPress={handleSaveGame} isPending={gameLoading}>
                  {editGame ? "Guardar" : "Crear"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* Format modal (create / edit) */}
      <Modal>
        <Modal.Backdrop
          isOpen={formatModal.isOpen}
          onOpenChange={(isOpen: boolean) => !isOpen && formatModal.onClose()}
        >
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>{editFormat ? "Editar formato" : "Crear formato"}</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="gap-4">
                <Form className="w-full">
                  <Fieldset className="space-y-4 w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Nombre</Label>
                        <Input
                          value={formatForm.name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormatForm((prev) => ({ ...prev, name: e.target.value }))}
                        />
                      </TextField>
                      <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Slug</Label>
                        <Input
                          value={formatForm.slug}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormatForm((prev) => ({ ...prev, slug: e.target.value }))}
                          disabled={Boolean(editFormat)}
                        />
                      </TextField>
                    </div>

                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">Descripcion</Label>
                      <TextArea
                        placeholder="opcional"
                        value={formatForm.description}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormatForm((prev) => ({ ...prev, description: e.target.value }))}
                      />
                    </TextField>

                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">Rules URL</Label>
                      <Input
                        placeholder="opcional"
                        value={formatForm.rules_url}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormatForm((prev) => ({ ...prev, rules_url: e.target.value }))}
                      />
                    </TextField>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Orden</Label>
                        <Input
                          type="number"
                          value={formatForm.sort_order}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormatForm((prev) => ({ ...prev, sort_order: e.target.value }))}
                        />
                      </TextField>
                      <div className="flex items-center gap-2 pt-5">
                        <input
                          type="checkbox"
                          id="format-ranked"
                          checked={formatForm.is_ranked}
                          onChange={(e) => setFormatForm((prev) => ({ ...prev, is_ranked: e.target.checked }))}
                          className="accent-[var(--accent)]"
                        />
                        <label htmlFor="format-ranked" className="text-xs text-[var(--muted)]">Ranked</label>
                      </div>
                      <div className="flex items-center gap-2 pt-5">
                        <input
                          type="checkbox"
                          id="format-active"
                          checked={formatForm.is_active}
                          onChange={(e) => setFormatForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                          className="accent-[var(--accent)]"
                        />
                        <label htmlFor="format-active" className="text-xs text-[var(--muted)]">Activo</label>
                      </div>
                    </div>
                  </Fieldset>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={formatModal.onClose}>
                  Cancelar
                </Button>
                <Button variant="primary" onPress={handleSaveFormat} isPending={formatLoading}>
                  {editFormat ? "Guardar" : "Crear"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
