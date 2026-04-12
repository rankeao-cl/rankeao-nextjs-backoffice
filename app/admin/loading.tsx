"use client";

export default function AdminRouteLoading() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--c-gray-200)] border-t-[var(--c-navy-500)]" />
        <p className="text-sm text-[var(--c-gray-500)]">Cargando vista...</p>
      </div>
    </div>
  );
}
