"use client";

import { Spinner } from "@heroui/react";

export default function AppLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" color="current" />
        <p className="text-sm text-[var(--muted)]">Cargando...</p>
      </div>
    </div>
  );
}
