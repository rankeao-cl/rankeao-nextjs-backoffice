"use client";

import { useState } from "react";
import {
  Button,
  Card,
  Chip,
  Description,
  Fieldset,
  Form,
  Input,
  Label,
  TextArea,
  TextField,
} from "@heroui/react";
import { toast } from "@heroui/react";
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
    <TextField className="space-y-1 flex flex-col">
      <Label className="text-xs text-[var(--muted)]">Juego</Label>
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
    </TextField>
  );
}

function ResultChips({ result }: { result: BulkImportResult | null }) {
  if (!result) return null;
  return (
    <div className="flex gap-2 pt-2">
      <Chip size="sm" color="default" variant="soft">
        Creados: {result.created}
      </Chip>
      <Chip size="sm" color="default" variant="soft">
        Actualizados: {result.updated}
      </Chip>
      <Chip size="sm" color="default" variant="soft">
        Errores: {result.errors}
      </Chip>
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
      toast.danger("Selecciona un juego");
      return;
    }
    let parsed: { code: string; name: string }[];
    try {
      parsed = JSON.parse(setsJson);
      if (!Array.isArray(parsed)) throw new Error("Debe ser un array");
    } catch (err) {
      toast.danger("JSON invalido: " + getErrorMessage(err, "formato incorrecto"));
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
        toast.danger(getErrorMessage(err, "Error al importar sets"));
      },
    });
  };

  const handleImportCards = () => {
    if (!cardsGameId) {
      toast.danger("Selecciona un juego");
      return;
    }
    let parsed: BulkImportCardsRequest["cards"];
    try {
      parsed = JSON.parse(cardsJson);
      if (!Array.isArray(parsed)) throw new Error("Debe ser un array");
    } catch (err) {
      toast.danger("JSON invalido: " + getErrorMessage(err, "formato incorrecto"));
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
        toast.danger(getErrorMessage(err, "Error al importar cards"));
      },
    });
  };

  const handleImportLegality = () => {
    if (!legalityGameId) {
      toast.danger("Selecciona un juego");
      return;
    }
    if (!legalityFormatSlug) {
      toast.danger("Ingresa el format slug");
      return;
    }
    let parsed: BulkImportLegalityRequest["entries"];
    try {
      parsed = JSON.parse(legalityJson);
      if (!Array.isArray(parsed)) throw new Error("Debe ser un array");
    } catch (err) {
      toast.danger("JSON invalido: " + getErrorMessage(err, "formato incorrecto"));
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
        toast.danger(getErrorMessage(err, "Error al importar legalidad"));
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-purple-cyan">
          Importacion Masiva
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Importa sets, cards y legalidad en lote mediante JSON.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── Import Sets ── */}
        <Card className="bg-[var(--surface)] border border-[var(--border)]">
          <Card.Content className="p-5">
            <Form className="space-y-4">
              <Fieldset className="space-y-4">
                <Fieldset.Legend className="flex items-center gap-2 font-semibold text-[var(--foreground)]">
                  <Layers className="h-5 w-5 text-[var(--foreground)]" />
                  Importar Sets
                </Fieldset.Legend>
                <Description className="text-xs text-[var(--muted)]">
                  Importa sets masivamente. El JSON debe ser un array de objetos con code y name.
                </Description>

                <GameSelect
                  value={setsGameId}
                  onChange={setSetsGameId}
                  games={games}
                  isLoading={gamesLoading}
                />

                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted)]">Fuente (opcional)</Label>
                  <Input
                    placeholder="ej: scryfall, tcgplayer"
                    value={setsSource}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setSetsSource(e.target.value)}
                  />
                </TextField>

                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted)]">Sets JSON</Label>
                  <TextArea
                    placeholder={'[{"code": "SET1", "name": "Set Uno"}, {"code": "SET2", "name": "Set Dos"}]'}
                    value={setsJson}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setSetsJson(e.target.value)}
                    rows={6}
                  />
                </TextField>

                <Fieldset.Actions className="pt-1">
                  <Button type="button" onPress={handleImportSets} isPending={bulkImportSets.isPending}>
                    <Upload className="h-4 w-4 mr-1" />
                    Importar Sets
                  </Button>
                </Fieldset.Actions>

                <ResultChips result={setsResult} />
              </Fieldset>
            </Form>
          </Card.Content>
        </Card>

        {/* ── Import Cards ── */}
        <Card className="bg-[var(--surface)] border border-[var(--border)]">
          <Card.Content className="p-5">
            <Form className="space-y-4">
              <Fieldset className="space-y-4">
                <Fieldset.Legend className="flex items-center gap-2 font-semibold text-[var(--foreground)]">
                  <BookOpen className="h-5 w-5 text-[var(--foreground)]" />
                  Importar Cards
                </Fieldset.Legend>
                <Description className="text-xs text-[var(--muted)]">
                  Importa cards con sus printings. Cada card debe tener al menos un printing con set_code y collector_number.
                </Description>

                <GameSelect
                  value={cardsGameId}
                  onChange={setCardsGameId}
                  games={games}
                  isLoading={gamesLoading}
                />

                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted)]">Fuente (opcional)</Label>
                  <Input
                    placeholder="ej: scryfall, tcgplayer"
                    value={cardsSource}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCardsSource(e.target.value)}
                  />
                </TextField>

                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted)]">Cards JSON</Label>
                  <TextArea
                    placeholder={
                      '[{\n  "name": "Lightning Bolt",\n  "type_line": "Instant",\n  "oracle_text": "Deal 3 damage...",\n  "printings": [{\n    "set_code": "M21",\n    "collector_number": "152",\n    "rarity": "uncommon",\n    "image_url": "https://...",\n    "artist": "Christopher Moeller"\n  }]\n}]'
                    }
                    value={cardsJson}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCardsJson(e.target.value)}
                    rows={10}
                  />
                </TextField>

                <Fieldset.Actions className="pt-1">
                  <Button type="button" onPress={handleImportCards} isPending={bulkImportCards.isPending}>
                    <Upload className="h-4 w-4 mr-1" />
                    Importar Cards
                  </Button>
                </Fieldset.Actions>

                <ResultChips result={cardsResult} />
              </Fieldset>
            </Form>
          </Card.Content>
        </Card>

        {/* ── Import Legality ── */}
        <Card className="bg-[var(--surface)] border border-[var(--border)] lg:col-span-2">
          <Card.Content className="p-5">
            <Form className="space-y-4">
              <Fieldset className="space-y-4">
                <Fieldset.Legend className="flex items-center gap-2 font-semibold text-[var(--foreground)]">
                  <Scale className="h-5 w-5 text-[var(--foreground)]" />
                  Importar Legalidad
                </Fieldset.Legend>
                <Description className="text-xs text-[var(--muted)]">
                  Actualiza la legalidad de cards para un formato especifico. Valores posibles: LEGAL, BANNED, RESTRICTED, NOT_LEGAL.
                </Description>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <GameSelect
                    value={legalityGameId}
                    onChange={setLegalityGameId}
                    games={games}
                    isLoading={gamesLoading}
                  />

                  <TextField className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted)]">Format Slug</Label>
                    <Input
                      placeholder="ej: standard, modern, pioneer"
                      value={legalityFormatSlug}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setLegalityFormatSlug(e.target.value)}
                    />
                  </TextField>
                </div>

                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted)]">Entries JSON</Label>
                  <TextArea
                    placeholder={'[{"card_name": "Lightning Bolt", "legality": "LEGAL"}, {"card_name": "Black Lotus", "legality": "BANNED"}]'}
                    value={legalityJson}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setLegalityJson(e.target.value)}
                    rows={6}
                  />
                </TextField>

                <Fieldset.Actions className="pt-1">
                  <Button type="button" onPress={handleImportLegality} isPending={bulkImportLegality.isPending}>
                    <Upload className="h-4 w-4 mr-1" />
                    Importar Legalidad
                  </Button>
                </Fieldset.Actions>

                <ResultChips result={legalityResult} />
              </Fieldset>
            </Form>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
