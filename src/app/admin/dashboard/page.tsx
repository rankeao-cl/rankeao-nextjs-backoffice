"use client";

import { useEffect, useState } from "react";
import { Button, Card, Skeleton } from "@heroui/react";
import {
    LAST_API_ERROR_EVENT,
    clearLastApiError,
    getGamificationStats,
    getLastApiError,
    getNotificationStats,
    type LastApiErrorInfo,
} from "@/lib/api-admin";
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
} from "lucide-react";
import Link from "next/link";

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    color: "accent" | "success" | "warning" | "default";
    href?: string;
}

function StatCard({ label, value, icon, color, href }: StatCardProps) {
    const colorMap = {
        accent: {
            text: "text-[var(--foreground)]",
            iconBg: "bg-[var(--accent)]/15",
            iconColor: "text-[var(--accent)]",
        },
        success: {
            text: "text-[var(--foreground)]",
            iconBg: "bg-[var(--success)]/15",
            iconColor: "text-[var(--success)]",
        },
        warning: {
            text: "text-[var(--foreground)]",
            iconBg: "bg-[var(--warning)]/15",
            iconColor: "text-[var(--warning)]",
        },
        default: {
            text: "text-[var(--foreground)]",
            iconBg: "bg-[var(--default)]",
            iconColor: "text-[var(--foreground)]",
        },
    };

    const c = colorMap[color];

    const content = (
        <Card
            className={`h-full bg-gradient-to-br hover:scale-[1.03] transition-transform duration-200 cursor-pointer`}
        >
            <Card.Content className="flex flex-row items-center gap-4 p-5">
                <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${c.iconBg}`}
                >
                    <div className={c.iconColor}>{icon}</div>
                </div>
                <div>
                    <p className="text-xs text-[var(--muted)] uppercase tracking-wide">{label}</p>
                    <p className={`text-2xl font-bold ${c.text} font-[var(--font-heading)]`}>
                        {value}
                    </p>
                </div>
            </Card.Content>
        </Card>
    );

    return href ? <Link href={href} className="block h-full">{content}</Link> : content;
}

function SkeletonCard() {
    return (
        <Card className="h-full bg-[var(--surface-secondary)] border border-[var(--border)]">
            <Card.Content className="flex flex-row items-center gap-4 p-5">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-3 w-20 rounded" />
                    <Skeleton className="h-7 w-16 rounded" />
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
        <Link href={href} className="block h-full">
            <Card className="h-full bg-[var(--surface-secondary)] border border-[var(--border)] hover:border-[var(--muted)] hover:bg-[var(--surface)] transition-all duration-200 hover:scale-[1.02]">
                <Card.Content className="flex flex-row items-center gap-4 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--default)]">
                        {icon}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-[var(--foreground)]">{label}</p>
                        <p className="text-xs text-[var(--muted)]">{description}</p>
                    </div>
                </Card.Content>
            </Card>
        </Link>
    );
}

export default function DashboardPage() {
    const [gamStats, setGamStats] = useState<Record<string, unknown> | null>(null);
    const [notifStats, setNotifStats] = useState<Record<string, unknown> | null>(null);
    const [lastApiError, setLastApiError] = useState<LastApiErrorInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [gs, ns] = await Promise.allSettled([
                    getGamificationStats(),
                    getNotificationStats(),
                ]);
                if (gs.status === "fulfilled") setGamStats(gs.value);
                if (ns.status === "fulfilled") setNotifStats(ns.value);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

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

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-purple-cyan">
                    Panel
                </h1>
                <p className="text-sm text-[var(--muted)] mt-1">
                    Resumen general del panel de administración
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                            label="Total XP Otorgado"
                            value={gamStats?.total_xp_granted?.toLocaleString() ?? "—"}
                            icon={<TrendingUp className="h-6 w-6" />}
                            color="accent"
                        />
                        <StatCard
                            label="Insignias Otorgadas"
                            value={gamStats?.total_badges_earned?.toLocaleString() ?? "—"}
                            icon={<Award className="h-6 w-6" />}
                            color="success"
                            href="/admin/gamification/badges"
                        />
                        <StatCard
                            label="Titulos Activos"
                            value={gamStats?.total_titles_earned?.toLocaleString() ?? "—"}
                            icon={<Crown className="h-6 w-6" />}
                            color="warning"
                            href="/admin/gamification/titles"
                        />
                        <StatCard
                            label="Eventos XP Hoy"
                            value={gamStats?.xp_events_today?.toLocaleString() ?? "—"}
                            icon={<Zap className="h-6 w-6" />}
                            color="accent"
                        />
                    </>
                )}
            </div>

            {/* Notification stats row */}
            {notifStats && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard
                        label="Notificaciones Enviadas"
                        value={notifStats?.total_sent?.toLocaleString() ?? "—"}
                        icon={<Bell className="h-6 w-6" />}
                        color="default"
                    />
                    <StatCard
                        label="Tasa de Lectura"
                        value={
                            typeof notifStats?.read_rate === "number"
                                ? `${(notifStats.read_rate * 100).toFixed(1)}%`
                                : "—"
                        }
                        icon={<BarChart3 className="h-6 w-6" />}
                        color="success"
                    />
                    <StatCard
                        label="Cosmeticos Otorgados"
                        value={gamStats?.total_cosmetics_earned?.toLocaleString() ?? "—"}
                        icon={<Sparkles className="h-6 w-6" />}
                        color="warning"
                        href="/admin/gamification/cosmetics"
                    />
                </div>
            )}

            <Card className="bg-[var(--surface-secondary)] border border-[var(--border)]">
                <Card.Content className="p-5 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Bug className="h-5 w-5 text-[var(--foreground)]" />
                            <h2 className="text-base font-semibold text-[var(--foreground)]">Diagnostico API</h2>
                        </div>
                        {lastApiError ? (
                            <Button size="sm" variant="tertiary" onPress={clearLastApiError}>
                                Limpiar
                            </Button>
                        ) : null}
                    </div>

                    {lastApiError ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                                <p className="text-[11px] text-[var(--muted)] uppercase tracking-wide">Estado</p>
                                <p className="text-[var(--foreground)] font-semibold">{lastApiError.status}</p>
                            </div>
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                                <p className="text-[11px] text-[var(--muted)] uppercase tracking-wide">Codigo</p>
                                <p className="text-[var(--foreground)] font-semibold">{lastApiError.code || "N/A"}</p>
                            </div>
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 lg:col-span-2">
                                <p className="text-[11px] text-[var(--muted)] uppercase tracking-wide">Ruta</p>
                                <code className="text-xs text-[var(--foreground)]">{lastApiError.path}</code>
                            </div>
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                                <p className="text-[11px] text-[var(--muted)] uppercase tracking-wide">Metodo</p>
                                <p className="text-[var(--foreground)] font-semibold">{lastApiError.method}</p>
                            </div>
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                                <p className="text-[11px] text-[var(--muted)] uppercase tracking-wide">Fecha</p>
                                <p className="text-[var(--foreground)] font-semibold">
                                    {new Date(lastApiError.at).toLocaleString("es-CL")}
                                </p>
                            </div>
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 lg:col-span-2">
                                <p className="text-[11px] text-[var(--muted)] uppercase tracking-wide">Mensaje</p>
                                <p className="text-sm text-[var(--foreground)]">{lastApiError.message}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-[var(--foreground)]" />
                            <p className="text-sm text-[var(--muted)]">No hay errores API recientes registrados.</p>
                        </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                        <TriangleAlert className="h-3.5 w-3.5" />
                        Muestra el ultimo error capturado por el cliente admin para soporte rapido.
                    </div>
                </Card.Content>
            </Card>

            {/* Quick Links */}
            <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4 font-[var(--font-heading)]">
                    Accesos Rápidos
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <QuickLink
                        label="Gestion de Tiendas"
                        href="/admin/tenants"
                        icon={<Store className="h-5 w-5 text-[var(--foreground)]" />}
                        description="Verificar, suspender y reactivar tiendas"
                    />
                    <QuickLink
                        label="Insignias y Gamificacion"
                        href="/admin/gamification/badges"
                        icon={<Award className="h-5 w-5 text-[var(--foreground)]" />}
                        description="Crear, editar y otorgar insignias"
                    />
                    <QuickLink
                        label="Disputas Marketplace"
                        href="/admin/disputes"
                        icon={<Scale className="h-5 w-5 text-[var(--foreground)]" />}
                        description="Resolver disputas entre usuarios"
                    />
                    <QuickLink
                        label="Temporadas"
                        href="/admin/gamification/seasons"
                        icon={<Users className="h-5 w-5 text-[var(--foreground)]" />}
                        description="Administrar temporadas competitivas"
                    />
                    <QuickLink
                        label="Plantillas de Notificacion"
                        href="/admin/notifications/templates"
                        icon={<Bell className="h-5 w-5 text-[var(--foreground)]" />}
                        description="CRUD y previsualizacion de plantillas"
                    />
                    <QuickLink
                        label="Plantillas de Email"
                        href="/admin/notifications/email-templates"
                        icon={<Mail className="h-5 w-5 text-[var(--foreground)]" />}
                        description="Previsualizacion de plantillas de correo"
                    />
                    <QuickLink
                        label="Difusiones"
                        href="/admin/notifications/broadcasts"
                        icon={<Users className="h-5 w-5 text-[var(--foreground)]" />}
                        description="Enviar notificaciones masivas"
                    />
                    <QuickLink
                        label="Niveles"
                        href="/admin/gamification/levels"
                        icon={<Layers className="h-5 w-5 text-[var(--foreground)]" />}
                        description="Configurar thresholds de XP"
                    />
                </div>
            </div>
        </div>
    );
}

