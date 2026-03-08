"use client";

import { useEffect, useState } from "react";
import { Button, Card, Skeleton } from "@heroui/react";
import { useGamificationStats } from "@/lib/hooks/use-gamification";
import { useNotificationStats } from "@/lib/hooks/use-notifications";
import {
    Award,
    Crown,
    Sparkles,
    Zap,
    TrendingUp,
    Users,
    Bell,
    BarChart3,
    Store,
    Scale,
    Layers,
    Mail,
    Bug,
    ShieldCheck,
    TriangleAlert,
    ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Local API-error diagnostic (reads from localStorage, not a query)
// ---------------------------------------------------------------------------

const LAST_API_ERROR_STORAGE_KEY = "rankeao_admin_last_api_error";
const LAST_API_ERROR_EVENT = "rankeao:api-error-updated";

interface LastApiErrorInfo {
    status: number;
    code?: string;
    path: string;
    method: string;
    url: string;
    message: string;
    at: string;
}

function getLastApiError(): LastApiErrorInfo | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(LAST_API_ERROR_STORAGE_KEY);
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as LastApiErrorInfo;
        if (typeof parsed !== "object" || parsed === null || typeof parsed.status !== "number") {
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

function clearLastApiError() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(LAST_API_ERROR_STORAGE_KEY);
    window.dispatchEvent(new Event(LAST_API_ERROR_EVENT));
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const STAT_STYLES = {
    accent: {
        border: "border-l-[3px] border-l-[var(--accent)]",
        iconBg: "bg-[var(--accent)]/10",
        iconColor: "text-[var(--accent)]",
    },
    success: {
        border: "border-l-[3px] border-l-[var(--success)]",
        iconBg: "bg-[var(--success)]/10",
        iconColor: "text-[var(--success)]",
    },
    warning: {
        border: "border-l-[3px] border-l-[var(--warning)]",
        iconBg: "bg-[var(--warning)]/10",
        iconColor: "text-[var(--warning)]",
    },
    brand: {
        border: "border-l-[3px] border-l-[var(--brand)]",
        iconBg: "bg-[var(--brand)]/10",
        iconColor: "text-[var(--brand)]",
    },
} as const;

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    color: keyof typeof STAT_STYLES;
    href?: string;
}

function StatCard({ label, value, icon, color, href }: StatCardProps) {
    const st = STAT_STYLES[color];

    const content = (
        <Card className={`h-full ${st.border} border border-[var(--border)] bg-[var(--surface)]`}>
            <Card.Content className="flex flex-row items-center gap-4 p-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${st.iconBg}`}>
                    <div className={st.iconColor}>{icon}</div>
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-[var(--muted)] uppercase tracking-wider font-medium">{label}</p>
                    <p className="text-xl font-bold text-[var(--foreground)] font-[var(--font-heading)] tabular-nums">
                        {value}
                    </p>
                </div>
                {href && (
                    <ArrowUpRight className="h-3.5 w-3.5 text-[var(--muted)] shrink-0" />
                )}
            </Card.Content>
        </Card>
    );

    return href ? <Link href={href} className="block h-full group">{content}</Link> : content;
}

function SkeletonCard() {
    return (
        <Card className="h-full border border-[var(--border)] bg-[var(--surface)]">
            <Card.Content className="flex flex-row items-center gap-4 p-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-2.5 w-20 rounded" />
                    <Skeleton className="h-5 w-14 rounded" />
                </div>
            </Card.Content>
        </Card>
    );
}

interface QuickLinkProps {
    label: string;
    href: string;
    icon: React.ReactNode;
    description: string;
}

function QuickLink({ label, href, icon, description }: QuickLinkProps) {
    return (
        <Link href={href} className="block h-full group">
            <div className="h-full flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 transition-colors duration-150 hover:border-[var(--accent)]/30 hover:bg-[var(--surface-secondary)]">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--surface-secondary)] text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors">
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)] truncate">{label}</p>
                    <p className="text-[11px] text-[var(--muted)] truncate">{description}</p>
                </div>
            </div>
        </Link>
    );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
    const {
        data: gamStats,
        isLoading: gamLoading,
    } = useGamificationStats();

    const {
        data: notifStats,
        isLoading: notifLoading,
    } = useNotificationStats();

    const [lastApiError, setLastApiError] = useState<LastApiErrorInfo | null>(null);

    useEffect(() => {
        const syncLastError = () => {
            setLastApiError(getLastApiError());
        };

        syncLastError();

        if (typeof window === "undefined") {
            return;
        }

        window.addEventListener(LAST_API_ERROR_EVENT, syncLastError);
        return () => window.removeEventListener(LAST_API_ERROR_EVENT, syncLastError);
    }, []);

    const loading = gamLoading || notifLoading;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-[var(--font-heading)] text-[var(--foreground)]">
                        Panel
                    </h1>
                    <p className="text-sm text-[var(--muted)] mt-0.5">
                        Resumen general
                    </p>
                </div>
                <span className="text-[11px] text-[var(--muted)] tabular-nums hidden sm:block">
                    {new Date().toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}
                </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {loading ? (
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                ) : (
                    <>
                        <StatCard
                            label="XP Otorgado"
                            value={gamStats?.total_xp_granted?.toLocaleString() ?? "—"}
                            icon={<TrendingUp className="h-5 w-5" />}
                            color="accent"
                        />
                        <StatCard
                            label="Insignias"
                            value={gamStats?.total_badges_earned?.toLocaleString() ?? "—"}
                            icon={<Award className="h-5 w-5" />}
                            color="success"
                            href="/admin/gamification/badges"
                        />
                        <StatCard
                            label="Titulos Activos"
                            value={gamStats?.total_titles_earned?.toLocaleString() ?? "—"}
                            icon={<Crown className="h-5 w-5" />}
                            color="warning"
                            href="/admin/gamification/titles"
                        />
                        <StatCard
                            label="Eventos XP Hoy"
                            value={gamStats?.xp_events_today?.toLocaleString() ?? "—"}
                            icon={<Zap className="h-5 w-5" />}
                            color="brand"
                        />
                    </>
                )}
            </div>

            {/* Notification stats row */}
            {notifStats && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <StatCard
                        label="Notificaciones 24h"
                        value={notifStats?.sent_24h?.toLocaleString() ?? "—"}
                        icon={<Bell className="h-5 w-5" />}
                        color="accent"
                    />
                    <StatCard
                        label="Tasa de Lectura"
                        value={
                            typeof notifStats?.read_rate === "number"
                                ? `${(notifStats.read_rate * 100).toFixed(1)}%`
                                : "—"
                        }
                        icon={<BarChart3 className="h-5 w-5" />}
                        color="success"
                    />
                    <StatCard
                        label="Cosmeticos"
                        value={gamStats?.total_cosmetics_granted?.toLocaleString() ?? "—"}
                        icon={<Sparkles className="h-5 w-5" />}
                        color="brand"
                        href="/admin/gamification/cosmetics"
                    />
                </div>
            )}

            {/* API Diagnostic */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-[var(--border)] bg-[var(--surface-secondary)]">
                    <div className="flex items-center gap-2">
                        <Bug className="h-4 w-4 text-[var(--muted)]" />
                        <h2 className="text-sm font-semibold text-[var(--foreground)]">Diagnostico API</h2>
                    </div>
                    {lastApiError ? (
                        <Button size="sm" variant="tertiary" onPress={clearLastApiError}>
                            Limpiar
                        </Button>
                    ) : null}
                </div>

                <div className="p-4">
                    {lastApiError ? (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                            <div className="rounded-md border border-[var(--border)] bg-[var(--surface-secondary)] p-3">
                                <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-medium mb-1">Estado</p>
                                <p className="text-sm text-[var(--foreground)] font-semibold tabular-nums">{lastApiError.status}</p>
                            </div>
                            <div className="rounded-md border border-[var(--border)] bg-[var(--surface-secondary)] p-3">
                                <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-medium mb-1">Codigo</p>
                                <p className="text-sm text-[var(--foreground)] font-semibold">{lastApiError.code || "N/A"}</p>
                            </div>
                            <div className="rounded-md border border-[var(--border)] bg-[var(--surface-secondary)] p-3">
                                <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-medium mb-1">Metodo</p>
                                <p className="text-sm text-[var(--foreground)] font-semibold">{lastApiError.method}</p>
                            </div>
                            <div className="rounded-md border border-[var(--border)] bg-[var(--surface-secondary)] p-3">
                                <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-medium mb-1">Fecha</p>
                                <p className="text-sm text-[var(--foreground)] font-semibold tabular-nums">
                                    {new Date(lastApiError.at).toLocaleString("es-CL")}
                                </p>
                            </div>
                            <div className="rounded-md border border-[var(--border)] bg-[var(--surface-secondary)] p-3 col-span-2 lg:col-span-4">
                                <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-medium mb-1">Ruta</p>
                                <code className="text-xs text-[var(--foreground)] font-mono">{lastApiError.path}</code>
                            </div>
                            <div className="rounded-md border border-[var(--border)] bg-[var(--surface-secondary)] p-3 col-span-2 lg:col-span-4">
                                <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-medium mb-1">Mensaje</p>
                                <p className="text-sm text-[var(--foreground)]">{lastApiError.message}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                            <ShieldCheck className="h-4 w-4 text-[var(--success)]" />
                            Sin errores API recientes.
                        </div>
                    )}

                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted)] mt-3 opacity-60">
                        <TriangleAlert className="h-3 w-3" />
                        Ultimo error capturado por el cliente admin.
                    </div>
                </div>
            </div>

            {/* Quick Links */}
            <div>
                <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3 uppercase tracking-wider">
                    Accesos Rápidos
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    <QuickLink
                        label="Tiendas"
                        href="/admin/tenants"
                        icon={<Store className="h-4 w-4" />}
                        description="Verificar y gestionar tiendas"
                    />
                    <QuickLink
                        label="Insignias"
                        href="/admin/gamification/badges"
                        icon={<Award className="h-4 w-4" />}
                        description="Crear y otorgar insignias"
                    />
                    <QuickLink
                        label="Disputas"
                        href="/admin/disputes"
                        icon={<Scale className="h-4 w-4" />}
                        description="Resolver disputas"
                    />
                    <QuickLink
                        label="Temporadas"
                        href="/admin/gamification/seasons"
                        icon={<Users className="h-4 w-4" />}
                        description="Temporadas competitivas"
                    />
                    <QuickLink
                        label="Plantillas"
                        href="/admin/notifications/templates"
                        icon={<Bell className="h-4 w-4" />}
                        description="Plantillas de notificación"
                    />
                    <QuickLink
                        label="Email Templates"
                        href="/admin/notifications/email-templates"
                        icon={<Mail className="h-4 w-4" />}
                        description="Plantillas de correo"
                    />
                    <QuickLink
                        label="Difusiones"
                        href="/admin/notifications/broadcasts"
                        icon={<Users className="h-4 w-4" />}
                        description="Enviar masivamente"
                    />
                    <QuickLink
                        label="Niveles"
                        href="/admin/gamification/levels"
                        icon={<Layers className="h-4 w-4" />}
                        description="Thresholds de XP"
                    />
                </div>
            </div>
        </div>
    );
}
