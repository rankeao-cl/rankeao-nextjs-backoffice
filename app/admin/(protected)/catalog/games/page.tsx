"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/utils/error-message";
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
  const [gameModalOpen, setGameModalOpen] = useState(false);
  const [editGame, setEditGame] = useState<Game | null>(null);
  const [gameForm, setGameForm] = useState<GameForm>(INITIAL_GAME_FORM);

  // Format modal
  const [formatModalOpen, setFormatModalOpen] = useState(false);
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
    setGameModalOpen(true);
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
    setGameModalOpen(true);
  };

  const handleSaveGame = () => {
    if (!gameForm.name) {
      toast.error("El nombre es requerido");
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
            setGameModalOpen(false);
          },
          onError: (error: unknown) => {
            toast.error(getErrorMessage(error));
          },
        },
      );
    } else {
      if (!gameForm.slug) {
        toast.error("El slug es requerido");
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
          setGameModalOpen(false);
        },
        onError: (error: unknown) => {
          toast.error(getErrorMessage(error));
        },
      });
    }
  };

  // ── Format handlers ──

  const openCreateFormat = () => {
    setEditFormat(null);
    setFormatForm(INITIAL_FORMAT_FORM);
    setFormatModalOpen(true);
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
    setFormatModalOpen(true);
  };

  const handleSaveFormat = () => {
    if (!expandedSlug) return;
    if (!formatForm.name) {
      toast.error("El nombre es requerido");
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
            setFormatModalOpen(false);
          },
          onError: (error: unknown) => {
            toast.error(getErrorMessage(error));
          },
        },
      );
    } else {
      if (!formatForm.slug) {
        toast.error("El slug es requerido");
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
            setFormatModalOpen(false);
          },
          onError: (error: unknown) => {
            toast.error(getErrorMessage(error));
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
            className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            onClick={() => toggleExpand(game.slug)}
            aria-label={expandedSlug === game.slug ? "Contraer formatos" : "Expandir formatos"}
          >
            {expandedSlug === game.slug ? (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
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
                <Gamepad2 className="h-3.5 w-3.5 text-[var(--foreground)]" aria-hidden="true" />
              </div>
            )}
            <span className="font-medium text-[var(--foreground)]">{String(game.name || "-")}</span>
          </div>
        );
      case "slug":
        return (
          <code className="text-xs text-[var(--muted-foreground)] bg-[var(--surface)] px-2 py-0.5 rounded">
            {String(game.slug || "-")}
          </code>
        );
      case "publisher":
        return <span className="text-[var(--muted-foreground)]">{String(game.publisher || "-")}</span>;
      case "formats":
        return <span className="text-[var(--muted-foreground)]">{game.formats_count ?? 0}</span>;
      case "status":
        return (
          <Badge variant="default">
            {game.is_active ? "Activo" : "Inactivo"}
          </Badge>
        );
      case "created":
        return (
          <span className="text-xs text-[var(--muted-foreground)]">
            {game.created_at ? new Date(game.created_at).toLocaleDateString("es-CL") : "-"}
          </span>
        );
      case "actions":
        return (
          <Button size="icon" variant="outline" aria-label="Editar juego" onClick={() => openEditGame(game)}>
            <Edit className="h-3.5 w-3.5" aria-hidden="true" />
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
          <code className="text-xs text-[var(--muted-foreground)] bg-[var(--surface)] px-2 py-0.5 rounded">
            {String(format.slug || "-")}
          </code>
        );
      case "ranked":
        return (
          <Badge variant="default">
            {format.is_ranked ? "Si" : "No"}
          </Badge>
        );
      case "status":
        return (
          <Badge variant="default">
            {format.is_active ? "Activo" : "Inactivo"}
          </Badge>
        );
      case "sort_order":
        return <span className="text-xs text-[var(--muted-foreground)]">{format.sort_order}</span>;
      case "actions":
        return (
          <Button size="icon" variant="outline" aria-label="Editar formato" onClick={() => openEditFormat(format)}>
            <Edit className="h-3.5 w-3.5" aria-hidden="true" />
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
          <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-brand">
            Juegos y Formatos
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Gestiona los juegos del catalogo y sus formatos de competencia
          </p>
        </div>
        <Button variant="default" size="sm" onClick={openCreateGame}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo juego
        </Button>
      </div>

      {/* Search */}
      <div className="rounded-lg border border-[var(--c-gray-200)] bg-white">
        <div className="px-5 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1 flex flex-col min-w-[200px] flex-1">
              <Label className="text-xs text-[var(--muted-foreground)]">Buscar juego</Label>
              <Input
                placeholder="Nombre o slug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Games table */}
      <div className="rounded-lg border border-[var(--c-gray-200)] bg-white">
        <div className="p-0">
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[var(--c-gray-50)]">
                  <tr>
                    {GAME_COLUMNS.map((column) => (
                      <th key={column.key} className="table-header px-4 py-3 text-left">
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredGames.map((game) => (
                    <tr
                      key={game.id}
                      className={`table-row${expandedSlug === game.slug ? " bg-[var(--surface-secondary)]" : ""}`}
                    >
                      {GAME_COLUMNS.map((column) => (
                        <td key={column.key} className="px-4 py-3">
                          {renderGameCell(game, column.key)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Formats section (shown when a game is expanded) */}
      {expandedSlug && (
        <div className="rounded-lg border border-[var(--c-gray-200)] bg-white">
          <div className="p-0">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                Formatos de <code className="text-xs bg-[var(--default)] px-1.5 py-0.5 rounded ml-1">{expandedSlug}</code>
              </p>
              <Button variant="outline" size="sm" onClick={openCreateFormat}>
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
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
                <p className="text-sm text-[var(--muted-foreground)]">Sin formatos registrados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--c-gray-50)]">
                    <tr>
                      {FORMAT_COLUMNS.map((column) => (
                        <th key={column.key} className="table-header px-4 py-3 text-left">
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {formats.map((format) => (
                      <tr key={format.id} className="table-row">
                        {FORMAT_COLUMNS.map((column) => (
                          <td key={column.key} className="px-4 py-3">
                            {renderFormatCell(format, column.key)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Game modal (create / edit) */}
      {gameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setGameModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-white border border-[var(--c-gray-200)] shadow-elevated p-6">
            <h2 className="text-base font-semibold text-[var(--foreground)] mb-4">
              {editGame ? "Editar juego" : "Crear juego"}
            </h2>
            <form className="w-full" onSubmit={(e) => { e.preventDefault(); handleSaveGame(); }}>
              <div className="space-y-4 w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted-foreground)]">Nombre</Label>
                    <Input
                      value={gameForm.name}
                      onChange={(e) => setGameForm((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted-foreground)]">Slug</Label>
                    <Input
                      value={gameForm.slug}
                      onChange={(e) => setGameForm((prev) => ({ ...prev, slug: e.target.value }))}
                      disabled={Boolean(editGame)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted-foreground)]">Nombre corto</Label>
                    <Input
                      placeholder="opcional"
                      value={gameForm.short_name}
                      onChange={(e) => setGameForm((prev) => ({ ...prev, short_name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted-foreground)]">Publisher</Label>
                    <Input
                      placeholder="opcional"
                      value={gameForm.publisher}
                      onChange={(e) => setGameForm((prev) => ({ ...prev, publisher: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Logo URL</Label>
                  <Input
                    placeholder="opcional"
                    value={gameForm.logo_url}
                    onChange={(e) => setGameForm((prev) => ({ ...prev, logo_url: e.target.value }))}
                  />
                </div>

                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Descripcion</Label>
                  <Textarea
                    placeholder="opcional"
                    value={gameForm.description}
                    onChange={(e) => setGameForm((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted-foreground)]">Orden</Label>
                    <Input
                      type="number"
                      value={gameForm.sort_order}
                      onChange={(e) => setGameForm((prev) => ({ ...prev, sort_order: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <input
                      type="checkbox"
                      id="game-active"
                      checked={gameForm.is_active}
                      onChange={(e) => setGameForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                      className="accent-[var(--accent)]"
                    />
                    <label htmlFor="game-active" className="text-xs text-[var(--muted-foreground)]">Activo</label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button type="button" variant="ghost" onClick={() => setGameModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="default" disabled={gameLoading}>
                  {gameLoading && (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--c-gray-200)] border-t-[var(--c-navy-500)] mr-2" />
                  )}
                  {editGame ? "Guardar" : "Crear"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Format modal (create / edit) */}
      {formatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setFormatModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-white border border-[var(--c-gray-200)] shadow-elevated p-6">
            <h2 className="text-base font-semibold text-[var(--foreground)] mb-4">
              {editFormat ? "Editar formato" : "Crear formato"}
            </h2>
            <form className="w-full" onSubmit={(e) => { e.preventDefault(); handleSaveFormat(); }}>
              <div className="space-y-4 w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted-foreground)]">Nombre</Label>
                    <Input
                      value={formatForm.name}
                      onChange={(e) => setFormatForm((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted-foreground)]">Slug</Label>
                    <Input
                      value={formatForm.slug}
                      onChange={(e) => setFormatForm((prev) => ({ ...prev, slug: e.target.value }))}
                      disabled={Boolean(editFormat)}
                    />
                  </div>
                </div>

                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Descripcion</Label>
                  <Textarea
                    placeholder="opcional"
                    value={formatForm.description}
                    onChange={(e) => setFormatForm((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Rules URL</Label>
                  <Input
                    placeholder="opcional"
                    value={formatForm.rules_url}
                    onChange={(e) => setFormatForm((prev) => ({ ...prev, rules_url: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted-foreground)]">Orden</Label>
                    <Input
                      type="number"
                      value={formatForm.sort_order}
                      onChange={(e) => setFormatForm((prev) => ({ ...prev, sort_order: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <input
                      type="checkbox"
                      id="format-ranked"
                      checked={formatForm.is_ranked}
                      onChange={(e) => setFormatForm((prev) => ({ ...prev, is_ranked: e.target.checked }))}
                      className="accent-[var(--accent)]"
                    />
                    <label htmlFor="format-ranked" className="text-xs text-[var(--muted-foreground)]">Ranked</label>
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <input
                      type="checkbox"
                      id="format-active"
                      checked={formatForm.is_active}
                      onChange={(e) => setFormatForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                      className="accent-[var(--accent)]"
                    />
                    <label htmlFor="format-active" className="text-xs text-[var(--muted-foreground)]">Activo</label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button type="button" variant="ghost" onClick={() => setFormatModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="default" disabled={formatLoading}>
                  {formatLoading && (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--c-gray-200)] border-t-[var(--c-navy-500)] mr-2" />
                  )}
                  {editFormat ? "Guardar" : "Crear"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
