"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, Layers, BookOpen, Scale } from "lucide-react";
import { useGames, useBulkImportSets, useBulkImportCards, useBulkImportLegality } from "@/lib/hooks/use-catalog";
import type { BulkImportSetsRequest, BulkImportCardsRequest, BulkImportLegalityRequest, BulkImportResult } from "@/lib/types/catalog";
import { getErrorMessage } from "@/lib/utils/error-message";

function GameSelect({
  value,
  onChange,
  games,
  isLoading,
}: {
  value: string;
  onChange: (id: string) => void;
  games: { id: string; name: string }[];
  isLoading: boolean;
}) {
  return (
    <div className="space-y-1 flex flex-col">
      <Label className="text-xs text-[var(--muted-foreground)]">Juego</Label>
      <select
        className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--ring)]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isLoading}
      >
        <option value="">Seleccionar juego...</option>
        {games.map((game) => (
          <option key={game.id} value={game.id}>
            {game.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function ResultBadges({ result }: { result: BulkImportResult | null }) {
  if (!result) return null;
  return (
    <div className="flex gap-2 pt-2">
      <Badge variant="default">
        Creados: {result.created}
      </Badge>
      <Badge variant="default">
        Actualizados: {result.updated}
      </Badge>
      <Badge variant="default">
        Errores: {result.errors}
      </Badge>
    </div>
  );
}

export default function BulkImportPage() {
  const { data: games = [], isLoading: gamesLoading } = useGames();

  // ── Sets state ──
  const [setsGameId, setSetsGameId] = useState("");
  const [setsSource, setSetsSource] = useState("");
  const [setsJson, setSetsJson] = useState("");
  const [setsResult, setSetsResult] = useState<BulkImportResult | null>(null);

  // ── Cards state ──
  const [cardsGameId, setCardsGameId] = useState("");
  const [cardsSource, setCardsSource] = useState("");
  const [cardsJson, setCardsJson] = useState("");
  const [cardsResult, setCardsResult] = useState<BulkImportResult | null>(null);

  // ── Legality state ──
  const [legalityGameId, setLegalityGameId] = useState("");
  const [legalityFormatSlug, setLegalityFormatSlug] = useState("");
  const [legalityJson, setLegalityJson] = useState("");
  const [legalityResult, setLegalityResult] = useState<BulkImportResult | null>(null);

  const bulkImportSets = useBulkImportSets();
  const bulkImportCards = useBulkImportCards();
  const bulkImportLegality = useBulkImportLegality();

  // ── Handlers ──

  const handleImportSets = () => {
    if (!setsGameId) {
      toast.error("Selecciona un juego");
      return;
    }
    let parsed: { code: string; name: string }[];
    try {
      parsed = JSON.parse(setsJson);
      if (!Array.isArray(parsed)) throw new Error("Debe ser un array");
    } catch (err) {
      toast.error("JSON invalido: " + getErrorMessage(err, "formato incorrecto"));
      return;
    }

    const data: BulkImportSetsRequest = {
      game_id: setsGameId,
      source: setsSource || undefined,
      sets: parsed,
    };

    bulkImportSets.mutate(data, {
      onSuccess: (result: BulkImportResult) => {
        toast.success("Sets importados correctamente");
        setSetsResult(result);
      },
      onError: (err: unknown) => {
        toast.error(getErrorMessage(err, "Error al importar sets"));
      },
    });
  };

  const handleImportCards = () => {
    if (!cardsGameId) {
      toast.error("Selecciona un juego");
      return;
    }
    let parsed: BulkImportCardsRequest["cards"];
    try {
      parsed = JSON.parse(cardsJson);
      if (!Array.isArray(parsed)) throw new Error("Debe ser un array");
    } catch (err) {
      toast.error("JSON invalido: " + getErrorMessage(err, "formato incorrecto"));
      return;
    }

    const data: BulkImportCardsRequest = {
      game_id: cardsGameId,
      source: cardsSource || undefined,
      cards: parsed,
    };

    bulkImportCards.mutate(data, {
      onSuccess: (result: BulkImportResult) => {
        toast.success("Cards importadas correctamente");
        setCardsResult(result);
      },
      onError: (err: unknown) => {
        toast.error(getErrorMessage(err, "Error al importar cards"));
      },
    });
  };

  const handleImportLegality = () => {
    if (!legalityGameId) {
      toast.error("Selecciona un juego");
      return;
    }
    if (!legalityFormatSlug) {
      toast.error("Ingresa el format slug");
      return;
    }
    let parsed: BulkImportLegalityRequest["entries"];
    try {
      parsed = JSON.parse(legalityJson);
      if (!Array.isArray(parsed)) throw new Error("Debe ser un array");
    } catch (err) {
      toast.error("JSON invalido: " + getErrorMessage(err, "formato incorrecto"));
      return;
    }

    const data: BulkImportLegalityRequest = {
      game_id: legalityGameId,
      format_slug: legalityFormatSlug,
      entries: parsed,
    };

    bulkImportLegality.mutate(data, {
      onSuccess: (result: BulkImportResult) => {
        toast.success("Legalidad importada correctamente");
        setLegalityResult(result);
      },
      onError: (err: unknown) => {
        toast.error(getErrorMessage(err, "Error al importar legalidad"));
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-brand">
          Importacion Masiva
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Importa sets, cards y legalidad en lote mediante JSON.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── Import Sets ── */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
          <div className="p-5">
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleImportSets(); }}>
              <div className="space-y-4">
                <div className="flex items-center gap-2 font-semibold text-[var(--foreground)]">
                  <Layers className="h-5 w-5 text-[var(--foreground)]" aria-hidden="true" />
                  Importar Sets
                </div>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Importa sets masivamente. El JSON debe ser un array de objetos con code y name.
                </p>

                <GameSelect
                  value={setsGameId}
                  onChange={setSetsGameId}
                  games={games}
                  isLoading={gamesLoading}
                />

                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Fuente (opcional)</Label>
                  <Input
                    placeholder="ej: scryfall, tcgplayer"
                    value={setsSource}
                    onChange={(e) => setSetsSource(e.target.value)}
                  />
                </div>

                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Sets JSON</Label>
                  <Textarea
                    placeholder={'[{"code": "SET1", "name": "Set Uno"}, {"code": "SET2", "name": "Set Dos"}]'}
                    value={setsJson}
                    onChange={(e) => setSetsJson(e.target.value)}
                    rows={6}
                  />
                </div>

                <div className="pt-1">
                  <Button type="submit" disabled={bulkImportSets.isPending}>
                    {bulkImportSets.isPending && (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--brand)] mr-2" />
                    )}
                    <Upload className="h-4 w-4 mr-1" aria-hidden="true" />
                    Importar Sets
                  </Button>
                </div>

                <ResultBadges result={setsResult} />
              </div>
            </form>
          </div>
        </div>

        {/* ── Import Cards ── */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
          <div className="p-5">
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleImportCards(); }}>
              <div className="space-y-4">
                <div className="flex items-center gap-2 font-semibold text-[var(--foreground)]">
                  <BookOpen className="h-5 w-5 text-[var(--foreground)]" aria-hidden="true" />
                  Importar Cards
                </div>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Importa cards con sus printings. Cada card debe tener al menos un printing con set_code y collector_number.
                </p>

                <GameSelect
                  value={cardsGameId}
                  onChange={setCardsGameId}
                  games={games}
                  isLoading={gamesLoading}
                />

                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Fuente (opcional)</Label>
                  <Input
                    placeholder="ej: scryfall, tcgplayer"
                    value={cardsSource}
                    onChange={(e) => setCardsSource(e.target.value)}
                  />
                </div>

                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Cards JSON</Label>
                  <Textarea
                    placeholder={
                      '[{\n  "name": "Lightning Bolt",\n  "type_line": "Instant",\n  "oracle_text": "Deal 3 damage...",\n  "printings": [{\n    "set_code": "M21",\n    "collector_number": "152",\n    "rarity": "uncommon",\n    "image_url": "https://...",\n    "artist": "Christopher Moeller"\n  }]\n}]'
                    }
                    value={cardsJson}
                    onChange={(e) => setCardsJson(e.target.value)}
                    rows={10}
                  />
                </div>

                <div className="pt-1">
                  <Button type="submit" disabled={bulkImportCards.isPending}>
                    {bulkImportCards.isPending && (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--brand)] mr-2" />
                    )}
                    <Upload className="h-4 w-4 mr-1" aria-hidden="true" />
                    Importar Cards
                  </Button>
                </div>

                <ResultBadges result={cardsResult} />
              </div>
            </form>
          </div>
        </div>

        {/* ── Import Legality ── */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] lg:col-span-2">
          <div className="p-5">
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleImportLegality(); }}>
              <div className="space-y-4">
                <div className="flex items-center gap-2 font-semibold text-[var(--foreground)]">
                  <Scale className="h-5 w-5 text-[var(--foreground)]" aria-hidden="true" />
                  Importar Legalidad
                </div>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Actualiza la legalidad de cards para un formato especifico. Valores posibles: LEGAL, BANNED, RESTRICTED, NOT_LEGAL.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <GameSelect
                    value={legalityGameId}
                    onChange={setLegalityGameId}
                    games={games}
                    isLoading={gamesLoading}
                  />

                  <div className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted-foreground)]">Format Slug</Label>
                    <Input
                      placeholder="ej: standard, modern, pioneer"
                      value={legalityFormatSlug}
                      onChange={(e) => setLegalityFormatSlug(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted-foreground)]">Entries JSON</Label>
                  <Textarea
                    placeholder={'[{"card_name": "Lightning Bolt", "legality": "LEGAL"}, {"card_name": "Black Lotus", "legality": "BANNED"}]'}
                    value={legalityJson}
                    onChange={(e) => setLegalityJson(e.target.value)}
                    rows={6}
                  />
                </div>

                <div className="pt-1">
                  <Button type="submit" disabled={bulkImportLegality.isPending}>
                    {bulkImportLegality.isPending && (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--brand)] mr-2" />
                    )}
                    <Upload className="h-4 w-4 mr-1" aria-hidden="true" />
                    Importar Legalidad
                  </Button>
                </div>

                <ResultBadges result={legalityResult} />
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
