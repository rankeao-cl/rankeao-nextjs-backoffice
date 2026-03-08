import { apiFetch, extractList, extractRecord } from "./client";
import type {
  Game,
  CreateGameRequest,
  UpdateGameRequest,
  Format,
  CreateFormatRequest,
  UpdateFormatRequest,
  CardSet,
  CreateSetRequest,
  UpdateSetRequest,
  Card,
  CreateCardRequest,
  UpdateCardRequest,
  CreatePrintingRequest,
  UpdatePrintingRequest,
  BatchLegalityRequest,
  BulkImportSetsRequest,
  BulkImportCardsRequest,
  BulkImportLegalityRequest,
  BulkImportResult,
} from "@/lib/types/catalog";

// ── Games ──

export async function listGames(): Promise<Game[]> {
  const payload = await apiFetch<unknown>("/catalog/games");
  return extractList<Game>(payload, ["games", "items", "data"]);
}

export async function createGame(data: CreateGameRequest) {
  return apiFetch("/catalog/games", { method: "POST", body: data });
}

export async function updateGame(slug: string, data: UpdateGameRequest) {
  return apiFetch(`/catalog/games/${slug}`, { method: "PATCH", body: data });
}

// ── Formats ──

export async function listFormats(gameSlug: string): Promise<Format[]> {
  const payload = await apiFetch<unknown>(`/catalog/games/${gameSlug}/formats`);
  return extractList<Format>(payload, ["formats", "items", "data"]);
}

export async function createFormat(gameSlug: string, data: CreateFormatRequest) {
  return apiFetch(`/catalog/games/${gameSlug}/formats`, { method: "POST", body: data });
}

export async function updateFormat(gameSlug: string, formatSlug: string, data: UpdateFormatRequest) {
  return apiFetch(`/catalog/games/${gameSlug}/formats/${formatSlug}`, { method: "PATCH", body: data });
}

// ── Sets ──

export async function listSets(gameSlug: string): Promise<CardSet[]> {
  const payload = await apiFetch<unknown>(`/catalog/games/${gameSlug}/sets`);
  return extractList<CardSet>(payload, ["sets", "items", "data"]);
}

export async function createSet(gameSlug: string, data: CreateSetRequest) {
  return apiFetch(`/catalog/games/${gameSlug}/sets`, { method: "POST", body: data });
}

export async function updateSet(setId: string, data: UpdateSetRequest) {
  return apiFetch(`/catalog/sets/${setId}`, { method: "PATCH", body: data });
}

// ── Cards ──

export async function createCard(data: CreateCardRequest) {
  return apiFetch("/catalog/cards", { method: "POST", body: data });
}

export async function updateCard(cardId: string, data: UpdateCardRequest) {
  return apiFetch(`/catalog/cards/${cardId}`, { method: "PATCH", body: data });
}

// ── Printings ──

export async function createPrinting(cardId: string, data: CreatePrintingRequest) {
  return apiFetch(`/catalog/cards/${cardId}/printings`, { method: "POST", body: data });
}

export async function updatePrinting(printingId: string, data: UpdatePrintingRequest) {
  return apiFetch(`/catalog/printings/${printingId}`, { method: "PATCH", body: data });
}

// ── Legality ──

export async function batchUpdateLegality(cardId: string, data: BatchLegalityRequest) {
  return apiFetch(`/catalog/cards/${cardId}/legality`, { method: "PUT", body: data });
}

// ── Bulk Import ──

export async function bulkImportSets(data: BulkImportSetsRequest): Promise<BulkImportResult> {
  const payload = await apiFetch<unknown>("/catalog/import/sets", { method: "POST", body: data });
  return extractRecord(payload) as unknown as BulkImportResult;
}

export async function bulkImportCards(data: BulkImportCardsRequest): Promise<BulkImportResult> {
  const payload = await apiFetch<unknown>("/catalog/import/cards", { method: "POST", body: data });
  return extractRecord(payload) as unknown as BulkImportResult;
}

export async function bulkImportLegality(data: BulkImportLegalityRequest): Promise<BulkImportResult> {
  const payload = await apiFetch<unknown>("/catalog/import/legality", { method: "POST", body: data });
  return extractRecord(payload) as unknown as BulkImportResult;
}
