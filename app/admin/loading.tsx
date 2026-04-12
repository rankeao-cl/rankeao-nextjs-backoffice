"use client";

export default function AdminRouteLoading() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--brand)]" />
        <p className="text-sm text-[var(--muted-foreground)]">Cargando vista...</p>
      </div>
    </div>
  );
}
