"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { NAV_GROUPS, type NavMainGroup, type NavSection } from "@/lib/constants/nav-items";
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

  const [hoverGroup, setHoverGroup] = useState<NavMainGroup | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const displayGroup = hoverGroup || activePathGroup;

  const handleGroupMouseEnter = (group: NavMainGroup) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoverGroup(group);
  };

  const handleMouseLeaveSidebar = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoverGroup(null);
    }, 150);
  };

  const handleMouseEnterPanel = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  };

  const handleGroupClick = (group: NavMainGroup) => {
    if (group.href) {
      router.push(group.href);
      if (onMobileClose) onMobileClose();
    } else if (group.sections && group.sections.length > 0 && group.sections[0].items.length > 0) {
      router.push(group.sections[0].items[0].href);
      if (onMobileClose) onMobileClose();
    }

    if (mobileOpen && !group.href) {
      setHoverGroup(hoverGroup?.label === group.label ? null : group);
    }
  };

  // ── SLENDER MAIN PANEL ──
  const mainSidebarContent = (
    <div className={s.inner}>
      <nav className={s.nav}>
        {NAV_GROUPS.map((group) => {
          const Icon = group.icon;
          const isActive = displayGroup?.label === group.label;

          return (
            <button
              key={group.label}
              onMouseEnter={() => handleGroupMouseEnter(group)}
              onClick={() => handleGroupClick(group)}
              className={`${s.navItem} ${isActive ? s.active : ""}`}
            >
              <div className={s.navIconWrap}>
                <Icon className={s.navIcon} />
              </div>
              <span className={s.navLabel}>{group.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );

  // ── EXTRA SIDEBAR (SUB-MENU) ──
  const renderSubMenuContent = (group: NavMainGroup) => {
    if (!group.sections) return null;
    return (
      <motion.div
        key={group.label}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -5, transition: { duration: 0.1 } }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={s.subInner}
      >
        <motion.div
          className={s.subHeader}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
        >
          <h2 className={s.subTitle}>{group.label}</h2>
        </motion.div>
        <div className={s.subScroll}>
          {group.sections.map((section: NavSection, idx: number) => (
            <motion.div
              key={idx}
              className={s.subSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + idx * 0.05, duration: 0.3, ease: "easeOut" }}
            >
              {section.title && <h3 className={s.subSectionTitle}>{section.title}</h3>}
              <ul className={s.subList}>
                {section.items.map((item) => {
                  const isItemActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => {
                          setHoverGroup(null);
                          if (onMobileClose) onMobileClose();
                        }}
                        className={`${s.subLink} ${isItemActive ? s.subLinkActive : ""}`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

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
        <AnimatePresence>
          {displayGroup?.sections && mobileOpen && (
            <motion.div
              key={displayGroup.label}
              className={`${s.subSidebar} ${s.subSidebarMobile}`}
            >
              <AnimatePresence mode="wait">
                {renderSubMenuContent(displayGroup)}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </aside>

      {/* DESKTOP FLEX WRAPPER WITH HOVER SENSING */}
      <aside
        className={s.desktopWrapper}
        onMouseLeave={handleMouseLeaveSidebar}
        onMouseEnter={handleMouseEnterPanel}
      >
        <div className={s.desktop}>
          {mainSidebarContent}
        </div>

        <AnimatePresence>
          {displayGroup?.sections && hoverGroup && (
            <motion.div
              key="submenu"
              className={s.subSidebar}
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0, transition: { duration: 0.15, ease: "easeIn" } }}
              transition={{ type: "spring", stiffness: 450, damping: 35, mass: 0.8 }}
            >
              <AnimatePresence mode="wait">
                {renderSubMenuContent(displayGroup)}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </aside>
    </>
  );
}
