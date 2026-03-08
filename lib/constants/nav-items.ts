import {
  LayoutDashboard,
  User,
  Store,
  Award,
  Sparkles,
  Crown,
  Trophy,
  Zap,
  Layers,
  Scale,
  Bell,
  Radio,
  Mail,
  Shield,
  Code2,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavDivider {
  type: "divider";
  label: string;
}

export type NavEntry = NavItem | NavDivider;

export const NAV_ITEMS: NavEntry[] = [
  { label: "Panel", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Explorador API", href: "/admin/api-explorer", icon: Code2 },
  { label: "API de Auth", href: "/admin/auth", icon: Shield },
  { label: "Perfil", href: "/admin/perfil", icon: User },
  { label: "Tiendas", href: "/admin/tenants", icon: Store },
  { type: "divider", label: "Gamificación" },
  { label: "Insignias", href: "/admin/gamification/badges", icon: Award },
  { label: "Cosméticos", href: "/admin/gamification/cosmetics", icon: Sparkles },
  { label: "Títulos", href: "/admin/gamification/titles", icon: Crown },
  { label: "Temporadas", href: "/admin/gamification/seasons", icon: Trophy },
  { label: "Eventos XP", href: "/admin/gamification/xp-events", icon: Zap },
  { label: "Niveles", href: "/admin/gamification/levels", icon: Layers },
  { type: "divider", label: "Marketplace" },
  { label: "Disputas", href: "/admin/disputes", icon: Scale },
  { type: "divider", label: "Notificaciones" },
  { label: "Plantillas", href: "/admin/notifications/templates", icon: Bell },
  { label: "Plantillas Email", href: "/admin/notifications/email-templates", icon: Mail },
  { label: "Difusiones", href: "/admin/notifications/broadcasts", icon: Radio },
];
