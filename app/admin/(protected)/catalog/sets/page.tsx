"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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

  const [modalOpen, setModalOpen] = useState(false);
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
    setModalOpen(true);
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
    setModalOpen(true);
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
            setModalOpen(false);
          },
          onError: (err: unknown) => {
            toast.error(getErrorMessage(err, "Error al actualizar set"));
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
            setModalOpen(false);
          },
          onError: (err: unknown) => {
            toast.error(getErrorMessage(err, "Error al crear set"));
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
          <code className="text-xs text-[var(--muted-foreground)] bg-[var(--surface)] px-2 py-0.5 rounded font-medium">
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
          <span className="text-sm text-[var(--muted-foreground)]">
            {String(set.set_type || "-")}
          </span>
        );
      case "total_cards":
        return (
          <span className="text-sm text-[var(--muted-foreground)]">
            {set.total_cards != null ? String(set.total_cards) : "-"}
          </span>
        );
      case "status":
        return (
          <Badge variant="default">
            {set.is_active ? "Activo" : "Inactivo"}
          </Badge>
        );
      case "release_date":
        return (
          <span className="text-xs text-[var(--muted-foreground)]">
            {set.release_date
              ? new Date(set.release_date).toLocaleDateString("es-CL")
              : "-"}
          </span>
        );
      case "actions":
        return (
          <div className="flex gap-1">
            <Button size="icon" variant="outline" aria-label="Editar set" onClick={() => openEdit(set)}>
              <Edit className="h-3.5 w-3.5" aria-hidden="true" />
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
          <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-brand">
            Sets / Expansiones
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Gestionar sets y expansiones del catalogo
          </p>
        </div>
      </div>

      {/* Game selector + search + create */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
        <div className="px-5 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1 flex flex-col min-w-[200px]">
              <label className="text-xs text-[var(--muted-foreground)]">Juego</label>
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

            <div className="space-y-1 flex flex-col min-w-[200px] flex-1">
              <Label className="text-xs text-[var(--muted-foreground)]">Buscar set</Label>
              <Input
                placeholder="Nombre o codigo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={!selectedGame}
              />
            </div>

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={openCreate}
              disabled={!selectedGame}
            >
              <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
              Nuevo set
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
        <div className="p-0">
          {!selectedGame ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="h-10 w-10 text-[var(--muted-foreground)] mb-3 opacity-40" aria-hidden="true" />
              <p className="text-sm text-[var(--muted-foreground)]">
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
              <p className="text-sm text-[var(--muted-foreground)]">
                {search ? "No se encontraron sets con ese filtro" : "No hay sets para este juego"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[var(--surface)]">
                  <tr>
                    {TABLE_COLUMNS.map((column) => (
                      <th key={column.key} className="table-header px-4 py-3 text-left">
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSets.map((set) => (
                    <tr key={set.id} className="table-row">
                      {TABLE_COLUMNS.map((column) => (
                        <td key={column.key} className="px-4 py-3">
                          {renderCell(set, column.key)}
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

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-elevated p-6">
            <h2 className="text-base font-semibold text-[var(--foreground)] mb-4">
              {editTarget ? "Editar Set" : "Crear Set"}
            </h2>
            <form className="w-full" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="space-y-4 w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted-foreground)]">Codigo *</Label>
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
                      placeholder="ej: SVI"
                    />
                  </div>
                  <div className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted-foreground)]">Nombre *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="ej: Scarlet & Violet"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted-foreground)]">Fecha de lanzamiento</Label>
                    <Input
                      type="date"
                      value={formData.release_date}
                      onChange={(e) => setFormData((prev) => ({ ...prev, release_date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted-foreground)]">Tipo de set</Label>
                    <Input
                      value={formData.set_type}
                      onChange={(e) => setFormData((prev) => ({ ...prev, set_type: e.target.value }))}
                      placeholder="ej: expansion, core, promo"
                    />
                  </div>
                </div>

                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Total de cartas</Label>
                  <Input
                    type="number"
                    value={formData.total_cards}
                    onChange={(e) => setFormData((prev) => ({ ...prev, total_cards: e.target.value }))}
                    placeholder="ej: 198"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted-foreground)]">Logo URL</Label>
                    <Input
                      value={formData.logo_url}
                      onChange={(e) => setFormData((prev) => ({ ...prev, logo_url: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted-foreground)]">Icon URL</Label>
                    <Input
                      value={formData.icon_url}
                      onChange={(e) => setFormData((prev) => ({ ...prev, icon_url: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
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
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="default" disabled={formLoading}>
                  {formLoading && (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--brand)] mr-2" />
                  )}
                  {editTarget ? "Guardar" : "Crear"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
