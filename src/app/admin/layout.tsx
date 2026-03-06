"use client";

import { useAuth } from "@/lib/auth";
import { Sidebar } from "@/components/admin/Sidebar";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

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
            <div className="flex h-screen items-center justify-center bg-[#050507]">
                <div className="flex flex-col items-center gap-4">
                    <div
                        className="h-9 w-9 animate-spin rounded-full border-2 border-zinc-700 border-t-white"
                        aria-hidden="true"
                    />
                    <p className="text-zinc-500 text-sm">Cargando panel...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <div className="flex h-screen overflow-hidden bg-[#050507]">
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
                    {children}
                </main>
            </div>
        </div>
    );
}
