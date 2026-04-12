"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { NAV_GROUPS, type NavMainGroup } from "@/lib/constants/nav-items";
import s from "./styles/Sidebar.module.css";

interface SidebarProps {
  onToggle?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const activePathGroup = NAV_GROUPS.find((g) => {
    if (g.href && (pathname === g.href || pathname.startsWith(g.href + "/"))) return true;
    if (g.sections) {
      return g.sections.some((sec) =>
        sec.items.some((item) => pathname === item.href || pathname.startsWith(item.href + "/"))
      );
    }
    return false;
  });

  const handleGroupClick = (group: NavMainGroup) => {
    if (group.href) {
      router.push(group.href);
    } else if (group.sections && group.sections.length > 0 && group.sections[0].items.length > 0) {
      router.push(group.sections[0].items[0].href);
    }
    if (onMobileClose) onMobileClose();
  };

  const mainSidebarContent = (
    <div className={s.inner}>
      <nav className={s.nav}>
        {NAV_GROUPS.map((group) => {
          const Icon = group.icon;
          const isActive = activePathGroup?.label === group.label;

          return (
            <button
              key={group.label}
              onClick={() => handleGroupClick(group)}
              className={`${s.navItem} ${isActive ? s.active : ""}`}
            >
              <div className={s.navIconWrap}>
                <Icon className={s.navIcon} />
              </div>
              <span className={s.navLabel}>{group.label}</span>
              <span className={s.tooltip}>{group.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {mobileOpen && <div className={s.overlay} onClick={onMobileClose} />}

      {/* MOBILE DRAWER */}
      <aside className={`${s.mobileWrapper} ${mobileOpen ? s.mobileOpen : ""}`}>
        <div className={s.mobile}>
          {mobileOpen && (
            <button onClick={onMobileClose} className={s.mobileClose}>
              <X className="h-5 w-5" />
            </button>
          )}
          {mainSidebarContent}
        </div>
      </aside>

      {/* DESKTOP */}
      <aside className={s.desktopWrapper}>
        <div className={s.desktop}>
          {mainSidebarContent}
        </div>
      </aside>
    </>
  );
}
