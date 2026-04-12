"use client";

export default function AppLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--c-gray-200)] border-t-[var(--c-navy-500)]" />
        <p className="text-sm text-[var(--c-gray-500)]">Cargando...</p>
      </div>
    </div>
  );
}
