"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as catalogApi from "@/lib/api/catalog";
import type {
  CreateGameRequest,
  UpdateGameRequest,
  CreateFormatRequest,
  UpdateFormatRequest,
  CreateSetRequest,
  UpdateSetRequest,
  CreateCardRequest,
  UpdateCardRequest,
  CreatePrintingRequest,
  UpdatePrintingRequest,
  BatchLegalityRequest,
  BulkImportSetsRequest,
  BulkImportCardsRequest,
  BulkImportLegalityRequest,
} from "@/lib/types/catalog";

// ── Games ──

export function useGames() {
  return useQuery({
    queryKey: ["catalog", "games"],
    queryFn: catalogApi.listGames,
  });
}

export function useCreateGame() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGameRequest) => catalogApi.createGame(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["catalog", "games"] }),
  });
}

export function useUpdateGame() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: UpdateGameRequest }) =>
      catalogApi.updateGame(slug, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["catalog", "games"] }),
  });
}

// ── Formats ──

export function useFormats(gameSlug: string) {
  return useQuery({
    queryKey: ["catalog", "formats", gameSlug],
    queryFn: () => catalogApi.listFormats(gameSlug),
    enabled: !!gameSlug,
  });
}

export function useCreateFormat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ gameSlug, data }: { gameSlug: string; data: CreateFormatRequest }) =>
      catalogApi.createFormat(gameSlug, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["catalog", "formats"] }),
  });
}

export function useUpdateFormat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ gameSlug, formatSlug, data }: { gameSlug: string; formatSlug: string; data: UpdateFormatRequest }) =>
      catalogApi.updateFormat(gameSlug, formatSlug, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["catalog", "formats"] }),
  });
}

// ── Sets ──

export function useSets(gameSlug: string) {
  return useQuery({
    queryKey: ["catalog", "sets", gameSlug],
    queryFn: () => catalogApi.listSets(gameSlug),
    enabled: !!gameSlug,
  });
}

export function useCreateSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ gameSlug, data }: { gameSlug: string; data: CreateSetRequest }) =>
      catalogApi.createSet(gameSlug, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["catalog", "sets"] }),
  });
}

export function useUpdateSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ setId, data }: { setId: string; data: UpdateSetRequest }) =>
      catalogApi.updateSet(setId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["catalog", "sets"] }),
  });
}

// ── Cards ──

export function useCreateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCardRequest) => catalogApi.createCard(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["catalog"] }),
  });
}

export function useUpdateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, data }: { cardId: string; data: UpdateCardRequest }) =>
      catalogApi.updateCard(cardId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["catalog"] }),
  });
}

// ── Printings ──

export function useCreatePrinting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, data }: { cardId: string; data: CreatePrintingRequest }) =>
      catalogApi.createPrinting(cardId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["catalog"] }),
  });
}

export function useUpdatePrinting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ printingId, data }: { printingId: string; data: UpdatePrintingRequest }) =>
      catalogApi.updatePrinting(printingId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["catalog"] }),
  });
}

// ── Legality ──

export function useBatchUpdateLegality() {
  return useMutation({
    mutationFn: ({ cardId, data }: { cardId: string; data: BatchLegalityRequest }) =>
      catalogApi.batchUpdateLegality(cardId, data),
  });
}

// ── Bulk Import ──

export function useBulkImportSets() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkImportSetsRequest) => catalogApi.bulkImportSets(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["catalog", "sets"] }),
  });
}

export function useBulkImportCards() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkImportCardsRequest) => catalogApi.bulkImportCards(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["catalog"] }),
  });
}

export function useBulkImportLegality() {
  return useMutation({
    mutationFn: (data: BulkImportLegalityRequest) => catalogApi.bulkImportLegality(data),
  });
}
