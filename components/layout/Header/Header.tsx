"use client";

import { useAuthStore } from "@/lib/stores/auth-store";
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
import { Menu, LogOut, User, Settings } from "lucide-react";
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
    <header className="sticky top-0 z-50 h-14 border-b border-[var(--c-gray-200)] bg-white flex items-center justify-between px-4 lg:px-6 shrink-0">
      <div className="flex items-center">
        {/* Mobile menu button */}
        <button
          className="md:hidden mr-3 text-[var(--c-gray-500)] hover:text-[var(--c-gray-700)] transition-colors"
          onClick={onMenuToggle}
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Logo */}
        <div className="flex items-center mr-4 md:mr-6">
          <RankeaoLogo className="h-6 w-auto text-[var(--c-gray-800)]" />
        </div>
      </div>

      {/* Horizontal Sub-Navigation */}
      <nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-0.5">
        <AnimatePresence mode="popLayout">
          {headerNavItems.map((item, idx) => {
            const isItemActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <motion.button
                key={item.href}
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96, transition: { duration: 0.1 } }}
                transition={{ duration: 0.2, delay: idx * 0.03, ease: "easeOut" }}
                onClick={() => router.push(item.href)}
                className={`text-[13px] font-medium transition-all px-3.5 py-1.5 rounded-lg ${
                  isItemActive
                    ? "bg-[var(--c-navy-50)] text-[var(--c-navy-700)] border-b-2 border-[var(--c-navy-500)] font-semibold"
                    : "text-[var(--c-gray-600)] hover:bg-[var(--c-gray-100)] hover:text-[var(--c-gray-700)]"
                }`}
              >
                {item.label}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </nav>

      <div className="flex items-center gap-3">
        {/* Settings shortcut */}
        <button
          className="text-[var(--c-gray-500)] hover:text-[var(--c-gray-700)] transition-colors p-1.5 rounded-lg hover:bg-[var(--c-gray-50)]"
          onClick={() => router.push("/admin/perfil")}
          aria-label="Perfil"
        >
          <Settings className="h-[18px] w-[18px]" />
        </button>

        {/* User profile dropdown */}
        <div className="ml-1">
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full cursor-pointer flex border-2 border-transparent hover:border-[var(--c-navy-400)] transition-colors outline-none">
              <Avatar className="h-8 w-8">
                {user?.avatar_url && <AvatarImage src={user.avatar_url} alt="Avatar" />}
                <AvatarFallback className="bg-[var(--c-navy-800)] text-white text-xs font-semibold">
                  {user?.username?.[0]?.toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[256px] p-0 overflow-hidden bg-white border border-[var(--c-gray-200)] shadow-elevated rounded-xl">
              {/* User Info Header */}
              <div className="relative">
                <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-[var(--c-navy-700)] to-[var(--c-navy-500)]" />
                <div className="flex items-center gap-3 px-4 py-4 pt-5">
                  <Avatar className="ring-2 ring-[var(--c-navy-100)]">
                    {user?.avatar_url && <AvatarImage src={user.avatar_url} alt="Avatar" />}
                    <AvatarFallback className="bg-[var(--c-navy-800)] text-white font-semibold">
                      {user?.username?.[0]?.toUpperCase() || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <p className="text-sm font-semibold text-[var(--c-gray-800)] truncate">{user?.username || "Admin"}</p>
                    <p className="text-[11px] text-[var(--c-gray-500)] truncate">{user?.email || "admin@rankeao.cl"}</p>
                  </div>
                </div>
              </div>

              <DropdownMenuSeparator className="bg-[var(--c-gray-100)] m-0" />

              <DropdownMenuGroup className="p-1.5">
                <DropdownMenuLabel className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--c-gray-500)]">
                  Mi cuenta
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => router.push("/admin/perfil")}
                  className="rounded-lg hover:bg-[var(--c-gray-50)] focus:bg-[var(--c-gray-50)] cursor-pointer"
                >
                  <User className="mr-3 h-4 w-4 text-[var(--c-gray-500)]" />
                  <span className="text-sm text-[var(--c-gray-700)]">Mi Perfil</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator className="bg-[var(--c-gray-100)] m-0" />

              <DropdownMenuGroup className="p-1.5">
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="rounded-lg hover:bg-red-50 focus:bg-red-50 cursor-pointer text-red-500 hover:text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span className="text-sm font-medium">Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
