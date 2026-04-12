"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Layers, Pencil, Printer, Scale, Plus, Trash2 } from "lucide-react";
import {
  useGames,
  useCreateCard,
  useUpdateCard,
  useCreatePrinting,
  useUpdatePrinting,
  useBatchUpdateLegality,
} from "@/lib/hooks/use-catalog";
import type {
  CreateCardRequest,
  UpdateCardRequest,
  CreatePrintingRequest,
  UpdatePrintingRequest,
  LegalityUpdate,
} from "@/lib/types/catalog";
import { getErrorMessage } from "@/lib/utils/error-message";

const LEGALITY_OPTIONS = ["LEGAL", "BANNED", "RESTRICTED", "NOT_LEGAL"] as const;

export default function CardsPage() {
  // ── Games for selector ──
  const { data: games = [] } = useGames();

  // ── Create Card ──
  const [createForm, setCreateForm] = useState({
    game_id: "",
    name: "",
    type_line: "",
    oracle_text: "",
    flavor_text: "",
    is_token: false,
  });

  // ── Update Card ──
  const [updateForm, setUpdateForm] = useState({
    card_id: "",
    name: "",
    type_line: "",
    oracle_text: "",
    flavor_text: "",
    is_token: "",
  });

  // ── Create Printing ──
  const [printingForm, setPrintingForm] = useState({
    card_id: "",
    set_id: "",
    collector_number: "",
    rarity: "",
    image_url: "",
    image_url_small: "",
    image_url_art: "",
    is_foil_available: "",
    is_nonfoil_available: "",
    is_first_edition: "",
    artist: "",
    price_usd: "",
    price_clp: "",
  });

  // ── Legality ──
  const [legalityCardId, setLegalityCardId] = useState("");
  const [legalityEntries, setLegalityEntries] = useState<LegalityUpdate[]>([
    { format_id: "", legality: "LEGAL" },
  ]);

  const createCard = useCreateCard();
  const updateCard = useUpdateCard();
  const createPrinting = useCreatePrinting();
  const updatePrinting = useUpdatePrinting();
  const batchLegality = useBatchUpdateLegality();

  // ── Handlers ──

  const handleCreateCard = () => {
    if (!createForm.game_id || !createForm.name) {
      toast.error("game_id y nombre son requeridos");
      return;
    }

    const data: CreateCardRequest = {
      game_id: createForm.game_id,
      name: createForm.name,
      type_line: createForm.type_line || undefined,
      oracle_text: createForm.oracle_text || undefined,
      flavor_text: createForm.flavor_text || undefined,
      is_token: createForm.is_token || undefined,
    };

    createCard.mutate(data, {
      onSuccess: () => {
        toast.success("Carta creada");
        setCreateForm({
          game_id: createForm.game_id,
          name: "",
          type_line: "",
          oracle_text: "",
          flavor_text: "",
          is_token: false,
        });
      },
      onError: (err) => {
        toast.error(getErrorMessage(err, "Error al crear carta"));
      },
    });
  };

  const handleUpdateCard = () => {
    if (!updateForm.card_id) {
      toast.error("Ingresa el Card ID");
      return;
    }

    const data: UpdateCardRequest = {};
    if (updateForm.name) data.name = updateForm.name;
    if (updateForm.type_line) data.type_line = updateForm.type_line;
    if (updateForm.oracle_text) data.oracle_text = updateForm.oracle_text;
    if (updateForm.flavor_text) data.flavor_text = updateForm.flavor_text;
    if (updateForm.is_token) data.is_token = updateForm.is_token.toLowerCase() === "true";

    if (Object.keys(data).length === 0) {
      toast.error("Ingresa al menos un campo para actualizar");
      return;
    }

    updateCard.mutate(
      { cardId: updateForm.card_id, data },
      {
        onSuccess: () => {
          toast.success("Carta actualizada");
        },
        onError: (err) => {
          toast.error(getErrorMessage(err, "Error al actualizar carta"));
        },
      },
    );
  };

  const handleCreatePrinting = () => {
    if (!printingForm.card_id || !printingForm.set_id) {
      toast.error("card_id y set_id son requeridos");
      return;
    }

    const data: CreatePrintingRequest = {
      set_id: printingForm.set_id,
      collector_number: printingForm.collector_number || undefined,
      rarity: printingForm.rarity || undefined,
      image_url: printingForm.image_url || undefined,
      image_url_small: printingForm.image_url_small || undefined,
      image_url_art: printingForm.image_url_art || undefined,
      artist: printingForm.artist || undefined,
      price_usd: printingForm.price_usd || undefined,
      price_clp: printingForm.price_clp ? Number(printingForm.price_clp) : undefined,
    };

    if (printingForm.is_foil_available)
      data.is_foil_available = printingForm.is_foil_available.toLowerCase() === "true";
    if (printingForm.is_nonfoil_available)
      data.is_nonfoil_available = printingForm.is_nonfoil_available.toLowerCase() === "true";
    if (printingForm.is_first_edition)
      data.is_first_edition = printingForm.is_first_edition.toLowerCase() === "true";

    createPrinting.mutate(
      { cardId: printingForm.card_id, data },
      {
        onSuccess: () => {
          toast.success("Edicion creada");
          setPrintingForm((prev) => ({
            ...prev,
            set_id: "",
            collector_number: "",
            rarity: "",
            image_url: "",
            image_url_small: "",
            image_url_art: "",
            is_foil_available: "",
            is_nonfoil_available: "",
            is_first_edition: "",
            artist: "",
            price_usd: "",
            price_clp: "",
          }));
        },
        onError: (err) => {
          toast.error(getErrorMessage(err, "Error al crear edicion"));
        },
      },
    );
  };

  const handleBatchLegality = () => {
    if (!legalityCardId) {
      toast.error("Ingresa el Card ID");
      return;
    }

    const validEntries = legalityEntries.filter((e) => e.format_id.trim());
    if (validEntries.length === 0) {
      toast.error("Agrega al menos una entrada con format_id");
      return;
    }

    batchLegality.mutate(
      { cardId: legalityCardId, data: { updates: validEntries } },
      {
        onSuccess: () => {
          toast.success("Legalidad actualizada");
          setLegalityEntries([{ format_id: "", legality: "LEGAL" }]);
        },
        onError: (err) => {
          toast.error(getErrorMessage(err, "Error al actualizar legalidad"));
        },
      },
    );
  };

  const addLegalityEntry = () => {
    setLegalityEntries((prev) => [...prev, { format_id: "", legality: "LEGAL" }]);
  };

  const removeLegalityEntry = (index: number) => {
    setLegalityEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLegalityEntry = (index: number, field: keyof LegalityUpdate, value: string) => {
    setLegalityEntries((prev) =>
      prev.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry,
      ),
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-brand">
          Cartas y Ediciones
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Crear cartas, registrar ediciones (printings) y gestionar legalidad por formato.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ── Create Card ── */}
        <div className="rounded-lg border border-[var(--c-gray-200)] bg-white">
          <div className="p-5">
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleCreateCard(); }}>
              <div className="space-y-4">
                <div className="flex items-center gap-2 font-semibold text-[var(--foreground)]">
                  <Layers className="h-5 w-5 text-[var(--foreground)]" aria-hidden="true" />
                  Crear carta
                </div>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Registra una carta nueva asociada a un juego del catalogo.
                </p>

                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Juego</Label>
                  <select
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    value={createForm.game_id}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, game_id: e.target.value }))}
                  >
                    <option value="">Seleccionar juego...</option>
                    {games.map((game) => (
                      <option key={game.id} value={game.id}>
                        {game.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Nombre</Label>
                  <Input
                    placeholder="Nombre de la carta"
                    value={createForm.name}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Linea de tipo</Label>
                  <Input
                    placeholder="ej: Creature — Human Warrior"
                    value={createForm.type_line}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, type_line: e.target.value }))}
                  />
                </div>

                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Texto oracle</Label>
                  <Textarea
                    placeholder="Texto de reglas"
                    value={createForm.oracle_text}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, oracle_text: e.target.value }))}
                  />
                </div>

                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Texto de ambientacion</Label>
                  <Textarea
                    placeholder="Flavor text (opcional)"
                    value={createForm.flavor_text}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, flavor_text: e.target.value }))}
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-[var(--foreground)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createForm.is_token}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, is_token: e.target.checked }))
                    }
                    className="rounded border-[var(--border)]"
                  />
                  Es token
                </label>

                <div className="pt-1">
                  <Button type="submit" disabled={createCard.isPending}>
                    {createCard.isPending && (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--c-gray-200)] border-t-[var(--c-navy-500)] mr-2" />
                    )}
                    Crear carta
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* ── Update Card ── */}
        <div className="rounded-lg border border-[var(--c-gray-200)] bg-white">
          <div className="p-5">
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleUpdateCard(); }}>
              <div className="space-y-4">
                <div className="flex items-center gap-2 font-semibold text-[var(--foreground)]">
                  <Pencil className="h-5 w-5 text-[var(--foreground)]" aria-hidden="true" />
                  Actualizar carta
                </div>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Modifica los atributos de una carta existente por su ID.
                </p>

                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Card ID</Label>
                  <Input
                    placeholder="card_id"
                    value={updateForm.card_id}
                    onChange={(e) => setUpdateForm((prev) => ({ ...prev, card_id: e.target.value }))}
                  />
                </div>

                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Nombre</Label>
                  <Input
                    placeholder="opcional"
                    value={updateForm.name}
                    onChange={(e) => setUpdateForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Linea de tipo</Label>
                  <Input
                    placeholder="opcional"
                    value={updateForm.type_line}
                    onChange={(e) => setUpdateForm((prev) => ({ ...prev, type_line: e.target.value }))}
                  />
                </div>

                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Texto oracle</Label>
                  <Textarea
                    placeholder="opcional"
                    value={updateForm.oracle_text}
                    onChange={(e) => setUpdateForm((prev) => ({ ...prev, oracle_text: e.target.value }))}
                  />
                </div>

                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Texto de ambientacion</Label>
                  <Textarea
                    placeholder="opcional"
                    value={updateForm.flavor_text}
                    onChange={(e) => setUpdateForm((prev) => ({ ...prev, flavor_text: e.target.value }))}
                  />
                </div>

                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">is_token</Label>
                  <Input
                    placeholder="true | false (opcional)"
                    value={updateForm.is_token}
                    onChange={(e) => setUpdateForm((prev) => ({ ...prev, is_token: e.target.value }))}
                  />
                </div>

                <div className="pt-1">
                  <Button type="submit" disabled={updateCard.isPending}>
                    {updateCard.isPending && (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--c-gray-200)] border-t-[var(--c-navy-500)] mr-2" />
                    )}
                    Guardar cambios
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* ── Create Printing ── */}
        <div className="rounded-lg border border-[var(--c-gray-200)] bg-white">
          <div className="p-5">
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleCreatePrinting(); }}>
              <div className="space-y-4">
                <div className="flex items-center gap-2 font-semibold text-[var(--foreground)]">
                  <Printer className="h-5 w-5 text-[var(--foreground)]" aria-hidden="true" />
                  Crear edicion (printing)
                </div>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Asocia una edicion/impresion a una carta existente.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted-foreground)]">Card ID</Label>
                    <Input
                      placeholder="card_id"
                      value={printingForm.card_id}
                      onChange={(e) => setPrintingForm((prev) => ({ ...prev, card_id: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted-foreground)]">Set ID</Label>
                    <Input
                      placeholder="set_id"
                      value={printingForm.set_id}
                      onChange={(e) => setPrintingForm((prev) => ({ ...prev, set_id: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted-foreground)]">Numero de coleccion</Label>
                    <Input
                      placeholder="ej: 042"
                      value={printingForm.collector_number}
                      onChange={(e) => setPrintingForm((prev) => ({ ...prev, collector_number: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted-foreground)]">Rareza</Label>
                    <Input
                      placeholder="common | uncommon | rare | mythic"
                      value={printingForm.rarity}
                      onChange={(e) => setPrintingForm((prev) => ({ ...prev, rarity: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">URL imagen</Label>
                  <Input
                    placeholder="imagen principal"
                    value={printingForm.image_url}
                    onChange={(e) => setPrintingForm((prev) => ({ ...prev, image_url: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted-foreground)]">URL imagen small</Label>
                    <Input
                      placeholder="opcional"
                      value={printingForm.image_url_small}
                      onChange={(e) => setPrintingForm((prev) => ({ ...prev, image_url_small: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted-foreground)]">URL imagen art</Label>
                    <Input
                      placeholder="opcional"
                      value={printingForm.image_url_art}
                      onChange={(e) => setPrintingForm((prev) => ({ ...prev, image_url_art: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Artista</Label>
                  <Input
                    placeholder="opcional"
                    value={printingForm.artist}
                    onChange={(e) => setPrintingForm((prev) => ({ ...prev, artist: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted-foreground)]">Foil disponible</Label>
                    <Input
                      placeholder="true | false"
                      value={printingForm.is_foil_available}
                      onChange={(e) => setPrintingForm((prev) => ({ ...prev, is_foil_available: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted-foreground)]">Non-foil disponible</Label>
                    <Input
                      placeholder="true | false"
                      value={printingForm.is_nonfoil_available}
                      onChange={(e) => setPrintingForm((prev) => ({ ...prev, is_nonfoil_available: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted-foreground)]">Primera edicion</Label>
                    <Input
                      placeholder="true | false"
                      value={printingForm.is_first_edition}
                      onChange={(e) => setPrintingForm((prev) => ({ ...prev, is_first_edition: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted-foreground)]">Precio USD</Label>
                    <Input
                      placeholder="ej: 1.50"
                      value={printingForm.price_usd}
                      onChange={(e) => setPrintingForm((prev) => ({ ...prev, price_usd: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted-foreground)]">Precio CLP</Label>
                    <Input
                      placeholder="ej: 1200"
                      value={printingForm.price_clp}
                      onChange={(e) => setPrintingForm((prev) => ({ ...prev, price_clp: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <Button type="submit" disabled={createPrinting.isPending}>
                    {createPrinting.isPending && (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--c-gray-200)] border-t-[var(--c-navy-500)] mr-2" />
                    )}
                    Crear edicion
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* ── Batch Update Legality ── */}
        <div className="rounded-lg border border-[var(--c-gray-200)] bg-white">
          <div className="p-5">
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleBatchLegality(); }}>
              <div className="space-y-4">
                <div className="flex items-center gap-2 font-semibold text-[var(--foreground)]">
                  <Scale className="h-5 w-5 text-[var(--foreground)]" aria-hidden="true" />
                  Actualizar legalidad
                </div>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Define en que formatos una carta es legal, baneada o restringida.
                </p>

                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Card ID</Label>
                  <Input
                    placeholder="card_id"
                    value={legalityCardId}
                    onChange={(e) => setLegalityCardId(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-medium text-[var(--muted-foreground)]">Entradas de legalidad</p>
                  {legalityEntries.map((entry, index) => (
                    <div key={index} className="flex items-end gap-2">
                      <div className="space-y-1 flex flex-col flex-1">
                        <Label className="text-xs text-[var(--muted-foreground)]">Format ID</Label>
                        <Input
                          placeholder="format_id"
                          value={entry.format_id}
                          onChange={(e) => updateLegalityEntry(index, "format_id", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1 flex flex-col flex-1">
                        <Label className="text-xs text-[var(--muted-foreground)]">Legalidad</Label>
                        <select
                          className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                          value={entry.legality}
                          onChange={(e) => updateLegalityEntry(index, "legality", e.target.value)}
                        >
                          {LEGALITY_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                      {legalityEntries.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          aria-label="Eliminar entrada de legalidad"
                          onClick={() => removeLegalityEntry(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addLegalityEntry}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                    Agregar formato
                  </Button>
                </div>

                <div className="pt-1">
                  <Button type="submit" disabled={batchLegality.isPending}>
                    {batchLegality.isPending && (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--c-gray-200)] border-t-[var(--c-navy-500)] mr-2" />
                    )}
                    Guardar legalidad
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
