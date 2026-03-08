"use client";

import { useAuth } from "@/lib/auth";
import { useTheme } from "@/hooks/use-theme";
import { usePathname, useRouter } from "next/navigation";
import {
    Breadcrumbs,
    Dropdown,
    DropdownTrigger,
    DropdownPopover,
    DropdownMenu,
    DropdownItem,
    Avatar,
    Button,
} from "@heroui/react";
import { Menu, LogOut, User, Sun, Moon } from "lucide-react";

interface AdminNavbarProps {
    user: { id: string; username: string; email: string; avatar_url?: string } | null;
    onMenuToggle: () => void;
}

export function AdminNavbar({ user, onMenuToggle }: AdminNavbarProps) {
    const { logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();
    const pathname = usePathname();

    const labelMap: Record<string, string> = {
        dashboard: "Panel",
        auth: "API de Auth",
        perfil: "Perfil",
        tenants: "Tiendas",
        disputes: "Disputas",
        notifications: "Notificaciones",
        templates: "Plantillas",
        broadcasts: "Difusiones",
        "email-templates": "Plantillas de Email",
        gamification: "Gamificacion",
        badges: "Insignias",
        cosmetics: "Cosmeticos",
        titles: "Titulos",
        seasons: "Temporadas",
        "xp-events": "Eventos XP",
        levels: "Niveles",
        "api-explorer": "Explorador API",
    };

    const segments = pathname.split("/").filter(Boolean);
    const adminSegments = segments[0] === "admin" ? segments.slice(1) : segments;

    return (
        <header className="flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md px-4 md:px-6 shrink-0">
            {/* Mobile menu toggle */}
            <Button
                isIconOnly
                variant="secondary"
                className="md:hidden text-[var(--muted)]"
                onPress={onMenuToggle}
                aria-label="Toggle menu"
            >
                <Menu className="h-5 w-5" />
            </Button>

            <div className="hidden md:flex min-w-0 flex-1 items-center">
                <Breadcrumbs className="gap-2 text-xs text-[var(--muted)]" separator={<span className="text-[var(--muted)]">/</span>}>
                    <Breadcrumbs.Item href="/admin/dashboard" className="text-[var(--muted)] hover:text-[var(--foreground)]">
                        Admin
                    </Breadcrumbs.Item>
                    {adminSegments.length === 0 ? (
                        <Breadcrumbs.Item className="text-[var(--foreground)]">Panel</Breadcrumbs.Item>
                    ) : (
                        adminSegments.map((segment, index) => {
                            const href = `/admin/${adminSegments.slice(0, index + 1).join("/")}`;
                            const isLast = index === adminSegments.length - 1;
                            const label = labelMap[segment] || segment.replace(/-/g, " ");

                            return (
                                <Breadcrumbs.Item
                                    key={`${segment}-${index}`}
                                    href={isLast ? undefined : href}
                                    className={isLast ? "text-[var(--foreground)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}
                                >
                                    {label}
                                </Breadcrumbs.Item>
                            );
                        })
                    )}
                </Breadcrumbs>
            </div>

            {/* Right side — theme toggle + user dropdown */}
            <div className="flex items-center gap-2">
                <Button
                    isIconOnly
                    variant="secondary"
                    size="sm"
                    onPress={toggleTheme}
                    aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                    className="text-[var(--muted)] hover:text-[var(--foreground)]"
                >
                    {theme === "dark" ? (
                        <Sun className="h-4 w-4" />
                    ) : (
                        <Moon className="h-4 w-4" />
                    )}
                </Button>
                <Dropdown>
                    <DropdownTrigger className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-[var(--default)] transition-colors outline-none">
                        <Avatar
                            size="sm"
                            className="h-8 w-8 bg-[var(--default)] text-[var(--foreground)]"
                        >
                            {user?.avatar_url ? (
                                <Avatar.Image src={user.avatar_url} alt={user?.username || "Admin"} />
                            ) : null}
                            <Avatar.Fallback>{user?.username?.[0]?.toUpperCase() || "A"}</Avatar.Fallback>
                        </Avatar>
                        <div className="hidden sm:flex flex-col items-start">
                            <span className="text-sm font-medium text-[var(--foreground)]">
                                {user?.username || "Admin"}
                            </span>
                            <span className="text-[11px] text-[var(--muted)]">{user?.email}</span>
                        </div>
                    </DropdownTrigger>
                    <DropdownPopover placement="bottom end">
                        <DropdownMenu
                            aria-label="User menu"
                            className="bg-[var(--overlay)] border border-[var(--border)]"
                        >
                            <DropdownItem
                                key="profile"
                                className="text-[var(--foreground)]"
                                onPress={() => router.push("/admin/perfil")}
                            >
                                <span className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Perfil
                                </span>
                            </DropdownItem>
                            <DropdownItem
                                key="logout"
                                className="text-[var(--foreground)]"
                                onPress={logout}
                            >
                                <span className="flex items-center gap-2">
                                    <LogOut className="h-4 w-4" />
                                    Cerrar sesión
                                </span>
                            </DropdownItem>
                        </DropdownMenu>
                    </DropdownPopover>
                </Dropdown>
            </div>
        </header>
    );
}
