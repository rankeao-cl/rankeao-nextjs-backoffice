"use client";

import { useAuth } from "@/lib/auth";
import { Sidebar } from "@/components/admin/Sidebar";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Spinner } from "@heroui/react";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const isLoginPage = pathname === "/admin/login";

    useEffect(() => {
        if (!isLoginPage && !isLoading && !isAuthenticated) {
            router.replace("/admin/login");
        }
    }, [isLoading, isAuthenticated, router, isLoginPage]);

    // If it's the login page, just render the content without layout or auth checks
    if (isLoginPage) {
        return <>{children}</>;
    }

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[var(--background)]">
                <div className="flex flex-col items-center gap-4">
                    <Spinner size="lg" color="current" />
                    <p className="text-[var(--muted)] text-sm">Cargando panel...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <div className="admin-shell flex h-screen overflow-hidden bg-[var(--background)]">
            {/* Sidebar */}
            <Sidebar
                collapsed={collapsed}
                onToggle={() => setCollapsed(!collapsed)}
                mobileOpen={mobileOpen}
                onMobileClose={() => setMobileOpen(false)}
            />

            {/* Main area */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <AdminNavbar
                    user={user}
                    onMenuToggle={() => setMobileOpen(true)}
                />
                <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
                    <div className="mx-auto w-full max-w-[1480px]">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
