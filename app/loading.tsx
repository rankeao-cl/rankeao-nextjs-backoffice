"use client";

export default function AppLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--brand)]" />
        <p className="text-sm text-[var(--muted-foreground)]">Cargando...</p>
      </div>
    </div>
  );
}
