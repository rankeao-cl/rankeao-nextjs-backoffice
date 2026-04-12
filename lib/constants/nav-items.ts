import {
  LayoutDashboard,
  Store,
  Gamepad2,
  Trophy,
  Scale,
  Bell,
  Settings,
  Shield,
  Code2,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export interface NavMainGroup {
  label: string;
  icon: LucideIcon;
  href?: string;
  sections?: NavSection[];
}

export const NAV_GROUPS: NavMainGroup[] = [
  {
    label: "Panel",
    icon: LayoutDashboard,
    href: "/admin/dashboard",
  },
  {
    label: "Catálogo",
    icon: Gamepad2,
    sections: [
      {
        title: "Juegos y cartas",
        items: [
          { label: "Juegos", href: "/admin/catalog/games" },
          { label: "Sets", href: "/admin/catalog/sets" },
          { label: "Cartas", href: "/admin/catalog/cards" },
          { label: "Importación", href: "/admin/catalog/import" },
        ],
      },
    ],
  },
  {
    label: "Gamificación",
    icon: Trophy,
    sections: [
      {
        title: "Recompensas",
        items: [
          { label: "Insignias", href: "/admin/gamification/badges" },
          { label: "Cosméticos", href: "/admin/gamification/cosmetics" },
          { label: "Títulos", href: "/admin/gamification/titles" },
          { label: "Niveles", href: "/admin/gamification/levels" },
        ],
      },
      {
        title: "Temporadas",
        items: [
          { label: "Temporadas", href: "/admin/gamification/seasons" },
          { label: "Eventos XP", href: "/admin/gamification/xp-events" },
        ],
      },
    ],
  },
  {
    label: "Tiendas",
    icon: Store,
    href: "/admin/tenants",
  },
  {
    label: "Marketplace",
    icon: Scale,
    sections: [
      {
        title: "Gestión",
        items: [
          { label: "Disputas", href: "/admin/disputes" },
          { label: "Configuración", href: "/admin/marketplace/config" },
        ],
      },
    ],
  },
  {
    label: "Torneos",
    icon: Shield,
    sections: [
      {
        title: "Administración",
        items: [
          { label: "Aprobaciones", href: "/admin/tournaments/approvals" },
          { label: "Ratings", href: "/admin/tournaments/ratings" },
        ],
      },
    ],
  },
  {
    label: "Notificaciones",
    icon: Bell,
    sections: [
      {
        title: "Plantillas",
        items: [
          { label: "Push", href: "/admin/notifications/templates" },
          { label: "Email", href: "/admin/notifications/email-templates" },
        ],
      },
      {
        title: "Difusión",
        items: [
          { label: "Difusiones", href: "/admin/notifications/broadcasts" },
        ],
      },
    ],
  },
  {
    label: "Sistema",
    icon: Settings,
    sections: [
      {
        title: "Admin",
        items: [
          { label: "Perfil", href: "/admin/perfil" },
          { label: "API Auth", href: "/admin/auth" },
          { label: "Explorador API", href: "/admin/api-explorer" },
        ],
      },
    ],
  },
];

// Legacy export for backward compatibility
export type NavEntry = NavItem | { type: "divider"; label: string };
export const NAV_ITEMS: NavEntry[] = NAV_GROUPS.flatMap((g) => {
  if (g.href) return [{ label: g.label, href: g.href, icon: g.icon }];
  return g.sections?.flatMap((s) => s.items) ?? [];
});
