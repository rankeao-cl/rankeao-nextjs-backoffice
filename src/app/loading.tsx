"use client";

import { Spinner } from "@heroui/react";

export default function AppLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050507]">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" color="current" />
        <p className="text-sm text-zinc-500">Cargando...</p>
      </div>
    </div>
  );
}
