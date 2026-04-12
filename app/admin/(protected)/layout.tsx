"use client";

import { AuthGuard } from "@/components/ui/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useUIStore } from "@/lib/stores/ui-store";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const mobileOpen = useUIStore((s) => s.mobileMenuOpen);
  const setMobileOpen = useUIStore((s) => s.setMobileMenuOpen);

  return (
    <AuthGuard>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-[var(--brand)] focus:text-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:outline-none"
      >
        Ir al contenido principal
      </a>
      <div className="flex flex-col h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
        <Header onMenuToggle={() => setMobileOpen(true)} />
        <Sidebar
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
        <main id="main-content" className="flex-1 overflow-auto p-4 md:p-6 md:pl-[88px] lg:p-8 lg:pl-[96px]">
          <div className="mx-auto w-full max-w-[1480px]">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
