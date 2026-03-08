"use client";

import { useAuthStore } from "@/lib/stores/auth-store";
import { useTheme } from "@/lib/hooks/use-theme";
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
import s from "./styles/Header.module.css";

const labelMap: Record<string, string> = {
  dashboard: "Panel",
  auth: "API de Auth",
  perfil: "Perfil",
  tenants: "Tiendas",
  disputes: "Disputas",
  notifications: "Notificaciones",
  templates: "Plantillas",
  broadcasts: "Difusiones",
  "email-templates": "Plantillas Email",
  gamification: "Gamificación",
  badges: "Insignias",
  cosmetics: "Cosméticos",
  titles: "Títulos",
  seasons: "Temporadas",
  "xp-events": "Eventos XP",
  levels: "Niveles",
  "api-explorer": "Explorador API",
};

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const user = useAuthStore((st) => st.user);
  const logout = useAuthStore((st) => st.logout);
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);
  const adminSegments = segments[0] === "admin" ? segments.slice(1) : segments;

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  return (
    <header className={s.header}>
      <Button
        isIconOnly
        variant="secondary"
        className="md:hidden text-[var(--muted)]"
        onPress={onMenuToggle}
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className={s.breadcrumbs}>
        <Breadcrumbs
          className="gap-2 text-xs text-[var(--muted)]"
          separator={<span className="text-[var(--muted)]">/</span>}
        >
          <Breadcrumbs.Item
            href="/admin/dashboard"
            className="text-[var(--muted)] hover:text-[var(--foreground)]"
          >
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
                  className={
                    isLast
                      ? "text-[var(--foreground)]"
                      : "text-[var(--muted)] hover:text-[var(--foreground)]"
                  }
                >
                  {label}
                </Breadcrumbs.Item>
              );
            })
          )}
        </Breadcrumbs>
      </div>

      <div className={s.actions}>
        <Button
          isIconOnly
          variant="secondary"
          size="sm"
          onPress={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Dropdown>
          <DropdownTrigger className={s.userTrigger}>
            <Avatar size="sm" className="h-8 w-8 bg-[var(--default)] text-[var(--foreground)]">
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
                onPress={handleLogout}
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
