"use client";

import { useAuthStore } from "@/lib/stores/auth-store";
import { useThemeStore } from "@/lib/stores/theme-store";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Menu, LogOut, User, Settings, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NAV_GROUPS, type NavItem } from "@/lib/constants/nav-items";
import { RankeaoLogo } from "@/components/icons/RankeaoLogo";

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const user = useAuthStore((st) => st.user);
  const logout = useAuthStore((st) => st.logout);
  const router = useRouter();
  const pathname = usePathname();
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  const activePathGroup = NAV_GROUPS.find((g) => {
    if (g.href && (pathname === g.href || pathname.startsWith(g.href + "/"))) return true;
    if (g.sections) {
      return g.sections.some((sec) =>
        sec.items.some((item) => pathname === item.href || pathname.startsWith(item.href + "/"))
      );
    }
    return false;
  });

  const headerNavItems: NavItem[] = activePathGroup?.sections
    ? activePathGroup.sections.flatMap((sec) => sec.items)
    : [];

  return (
    <header className="sticky top-0 z-50 h-14 border-b border-[var(--border)] bg-[var(--background)] flex items-center justify-between px-4 lg:px-6 shrink-0">
      <div className="flex items-center">
        <button
          className="md:hidden mr-3 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          onClick={onMenuToggle}
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center mr-4 md:mr-6">
          <RankeaoLogo className="h-6 w-auto text-[var(--foreground)]" />
        </div>
      </div>

      {headerNavItems.length > 0 && (
        <nav
          className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-0.5 rounded-full px-1 py-1"
          style={{ background: "var(--sidebar)", boxShadow: "var(--shadow-popover)", border: "1px solid var(--border)" }}
        >
          <AnimatePresence mode="popLayout">
            {headerNavItems.map((item, idx) => {
              const isItemActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <motion.button
                  key={item.href}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.1 } }}
                  transition={{ duration: 0.18, delay: idx * 0.02, ease: "easeOut" }}
                  onClick={() => router.push(item.href)}
                  className="text-[13px] font-medium transition-all px-4 py-1.5 rounded-full"
                  style={{
                    background: isItemActive ? "var(--sidebar-accent)" : "transparent",
                    color: isItemActive ? "var(--sidebar-primary)" : "var(--sidebar-foreground)",
                    fontWeight: isItemActive ? 600 : 500,
                    border: isItemActive ? "1px solid transparent" : "1px solid transparent",
                  }}
                >
                  {item.label}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </nav>
      )}

      <div className="flex items-center gap-1.5">
        {/* Theme toggle */}
        <button
          className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors p-1.5 rounded-lg hover:bg-[var(--surface-secondary)]"
          onClick={toggleTheme}
          aria-label="Cambiar tema"
        >
          {theme === "light" ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
        </button>

        {/* Settings */}
        <button
          className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors p-1.5 rounded-lg hover:bg-[var(--surface-secondary)]"
          onClick={() => router.push("/admin/perfil")}
          aria-label="Perfil"
        >
          <Settings className="h-[18px] w-[18px]" />
        </button>

        {/* User profile dropdown */}
        <div className="ml-1">
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full cursor-pointer flex border-2 border-transparent hover:border-[var(--accent)] transition-colors outline-none">
              <Avatar className="h-8 w-8">
                {user?.avatar_url && <AvatarImage src={user.avatar_url} alt="Avatar" />}
                <AvatarFallback className="bg-[var(--sidebar)] text-white text-xs font-semibold">
                  {user?.username?.[0]?.toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[256px] p-0 overflow-hidden bg-[var(--card)] border border-[var(--border)] shadow-elevated rounded-xl">
              <div className="relative">
                <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-[var(--brand)] to-[var(--accent)]" />
                <div className="flex items-center gap-3 px-4 py-4 pt-5">
                  <Avatar className="ring-2 ring-[var(--border)]">
                    {user?.avatar_url && <AvatarImage src={user.avatar_url} alt="Avatar" />}
                    <AvatarFallback className="bg-[var(--sidebar)] text-white font-semibold">
                      {user?.username?.[0]?.toUpperCase() || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <p className="text-sm font-semibold text-[var(--foreground)] truncate">{user?.username || "Admin"}</p>
                    <p className="text-[11px] text-[var(--muted-foreground)] truncate">{user?.email || "admin@rankeao.cl"}</p>
                  </div>
                </div>
              </div>

              <DropdownMenuSeparator className="bg-[var(--border)] m-0" />

              <DropdownMenuGroup className="p-1.5">
                <DropdownMenuLabel className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Mi cuenta
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => router.push("/admin/perfil")}
                  className="rounded-lg hover:bg-[var(--surface-secondary)] focus:bg-[var(--surface-secondary)] cursor-pointer"
                >
                  <User className="mr-3 h-4 w-4 text-[var(--muted-foreground)]" />
                  <span className="text-sm text-[var(--foreground)]">Mi Perfil</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator className="bg-[var(--border)] m-0" />

              <DropdownMenuGroup className="p-1.5">
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="rounded-lg hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer text-[var(--danger)] hover:text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span className="text-sm font-medium">Cerrar Sesion</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
