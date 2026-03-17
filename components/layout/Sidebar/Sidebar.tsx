"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Button } from "@heroui/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { NAV_ITEMS, type NavEntry } from "@/lib/constants/nav-items";
import s from "./styles/Sidebar.module.css";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <div className={s.inner}>
      {/* Logo */}
      <div className={s.logo}>
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)]">
          <Image src="/logo.png" alt="Rankeao" fill sizes="36px" className="object-contain p-1" priority />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-[var(--font-heading)] text-lg font-bold text-gradient-brand">
              Rankeao
            </span>
            <span className="text-[10px] uppercase tracking-widest text-[var(--muted)]">
              Panel Admin
            </span>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className={s.nav} aria-label="Navegación principal">
        {NAV_ITEMS.map((entry: NavEntry, i: number) => {
          if ("type" in entry && entry.type === "divider") {
            return (
              <div key={`div-${i}`} className={s.divider}>
                {!collapsed && (
                  <span className={s.dividerLabel}>{entry.label}</span>
                )}
                {collapsed && <div className={s.dividerLine} />}
              </div>
            );
          }

          if (!("href" in entry)) return null;
          const Icon = entry.icon;
          const isActive = pathname === entry.href || pathname.startsWith(entry.href + "/");

          return (
            <Link
              key={entry.href}
              href={entry.href}
              onClick={onMobileClose}
              className={`${s.navItem} ${isActive ? s.active : ""}`}
              title={collapsed ? entry.label : undefined}
              aria-current={isActive ? "page" : undefined}
              aria-label={collapsed ? entry.label : undefined}
            >
              <Icon className={`${s.navIcon} ${isActive ? s.navIconActive : ""}`} aria-hidden="true" />
              {!collapsed && <span>{entry.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle (desktop only) */}
      <div className={s.collapseToggle}>
        <Button
          variant="secondary"
          onPress={onToggle}
          aria-label={collapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
          className="w-full text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" aria-hidden="true" /> : <ChevronLeft className="h-4 w-4" aria-hidden="true" />}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className={s.overlay}
          onClick={onMobileClose}
          onKeyDown={(e) => { if (e.key === "Escape") onMobileClose(); }}
          role="button"
          tabIndex={-1}
          aria-label="Cerrar menú"
        />
      )}

      {/* Mobile drawer */}
      <aside className={`${s.mobile} ${mobileOpen ? s.mobileOpen : ""}`} aria-label="Menú móvil">
        <Button
          isIconOnly
          size="sm"
          variant="secondary"
          onPress={onMobileClose}
          aria-label="Cerrar menú"
          className="absolute right-3 top-4 text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </Button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className={`${s.desktop} ${collapsed ? s.collapsed : ""}`} aria-label="Barra lateral">
        {sidebarContent}
      </aside>
    </>
  );
}
