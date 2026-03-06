"use client";

import { useAuth } from "@/lib/auth";
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
import { Menu, LogOut, User } from "lucide-react";

interface AdminNavbarProps {
    user: { id: string; username: string; email: string; avatar_url?: string } | null;
    onMenuToggle: () => void;
}

export function AdminNavbar({ user, onMenuToggle }: AdminNavbarProps) {
    const { logout } = useAuth();
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
        <header className="flex h-14 items-center justify-between border-b border-[#2a2f4b]/40 bg-[#0a0b12]/80 backdrop-blur-md px-4 md:px-6 shrink-0">
            {/* Mobile menu toggle */}
            <Button
                isIconOnly
                variant="ghost"
                className="md:hidden text-zinc-400"
                onPress={onMenuToggle}
                aria-label="Toggle menu"
            >
                <Menu className="h-5 w-5" />
            </Button>

            <div className="hidden md:flex min-w-0 flex-1 items-center">
                <Breadcrumbs className="gap-2 text-xs text-zinc-500" separator={<span className="text-zinc-700">/</span>}>
                    <Breadcrumbs.Item href="/admin/dashboard" className="text-zinc-400 hover:text-zinc-200">
                        Admin
                    </Breadcrumbs.Item>
                    {adminSegments.length === 0 ? (
                        <Breadcrumbs.Item className="text-zinc-200">Panel</Breadcrumbs.Item>
                    ) : (
                        adminSegments.map((segment, index) => {
                            const href = `/admin/${adminSegments.slice(0, index + 1).join("/")}`;
                            const isLast = index === adminSegments.length - 1;
                            const label = labelMap[segment] || segment.replace(/-/g, " ");

                            return (
                                <Breadcrumbs.Item
                                    key={`${segment}-${index}`}
                                    href={isLast ? undefined : href}
                                    className={isLast ? "text-zinc-200" : "text-zinc-400 hover:text-zinc-200"}
                                >
                                    {label}
                                </Breadcrumbs.Item>
                            );
                        })
                    )}
                </Breadcrumbs>
            </div>

            {/* Right side — user dropdown */}
            <div className="flex items-center gap-3">
                <Dropdown>
                    <DropdownTrigger className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-white/5 transition-colors outline-none">
                        <Avatar
                            size="sm"
                            className="h-8 w-8 bg-white/10 text-zinc-200"
                        >
                            {user?.avatar_url ? (
                                <Avatar.Image src={user.avatar_url} alt={user?.username || "Admin"} />
                            ) : null}
                            <Avatar.Fallback>{user?.username?.[0]?.toUpperCase() || "A"}</Avatar.Fallback>
                        </Avatar>
                        <div className="hidden sm:flex flex-col items-start">
                            <span className="text-sm font-medium text-zinc-200">
                                {user?.username || "Admin"}
                            </span>
                            <span className="text-[11px] text-zinc-500">{user?.email}</span>
                        </div>
                    </DropdownTrigger>
                    <DropdownPopover placement="bottom end">
                        <DropdownMenu
                            aria-label="User menu"
                            className="bg-[#0f1017] border border-[#2a2f4b]"
                        >
                            <DropdownItem
                                key="profile"
                                className="text-zinc-300"
                                onPress={() => router.push("/admin/perfil")}
                            >
                                <span className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Perfil
                                </span>
                            </DropdownItem>
                            <DropdownItem
                                key="logout"
                                className="text-zinc-100"
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
