"use client";

import { Spinner } from "@heroui/react";

export default function AdminRouteLoading() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" color="current" />
        <p className="text-sm text-zinc-500">Cargando vista...</p>
      </div>
    </div>
  );
}
