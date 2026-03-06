"use client";

import { useAuth } from "@/lib/auth";
import {
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

            {/* Spacer for desktop */}
            <div className="hidden md:block" />

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
