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
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const mobileOpen = useUIStore((s) => s.mobileMenuOpen);
  const setMobileOpen = useUIStore((s) => s.setMobileMenuOpen);

  return (
    <AuthGuard>
      <div className="admin-shell flex h-screen overflow-hidden bg-[var(--background)]">
        <Sidebar
          collapsed={collapsed}
          onToggle={toggleSidebar}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header onMenuToggle={() => setMobileOpen(true)} />
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            <div className="mx-auto w-full max-w-[1480px]">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
