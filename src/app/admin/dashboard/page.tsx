"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, Spinner } from "@heroui/react";
import { getGamificationStats, getNotificationStats } from "@/lib/api-admin";
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
} from "lucide-react";
import Link from "next/link";

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    color: "white" | "slate";
    href?: string;
}

function StatCard({ label, value, icon, color, href }: StatCardProps) {
    const colorMap = {
        white: {
            bg: "from-white/12 to-white/0",
            border: "border-white/25",
            text: "text-white",
            iconBg: "bg-white/10",
        },
        slate: {
            bg: "from-zinc-300/12 to-zinc-300/0",
            border: "border-zinc-300/20",
            text: "text-zinc-200",
            iconBg: "bg-zinc-300/10",
        },
    };

    const c = colorMap[color];

    const content = (
        <Card
            className={`bg-gradient-to-br ${c.bg} border ${c.border} hover:scale-[1.03] transition-transform duration-200 cursor-pointer`}
        >
            <CardContent className="flex flex-row items-center gap-4 p-5">
                <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${c.iconBg}`}
                >
                    {icon}
                </div>
                <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">{label}</p>
                    <p className={`text-2xl font-bold ${c.text} font-[var(--font-heading)]`}>
                        {value}
                    </p>
                </div>
            </CardContent>
        </Card>
    );

    return href ? <Link href={href}>{content}</Link> : content;
}

function SkeletonCard() {
    return (
        <Card className="bg-[#0f1017]/60 border border-[#2a2f4b]/30">
            <CardContent className="flex flex-row items-center gap-4 p-5">
                <div className="skeleton h-12 w-12 rounded-xl" />
                <div className="space-y-2 flex-1">
                    <div className="skeleton h-3 w-20 rounded" />
                    <div className="skeleton h-7 w-16 rounded" />
                </div>
            </CardContent>
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
        <Link href={href}>
            <Card className="bg-[#0f1017]/80 border border-white/15 hover:border-white/35 hover:bg-[#0f1017] transition-all duration-200 hover:scale-[1.02]">
                <CardContent className="flex flex-row items-center gap-4 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5">
                        {icon}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-zinc-200">{label}</p>
                        <p className="text-xs text-zinc-500">{description}</p>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

export default function DashboardPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [gamStats, setGamStats] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [notifStats, setNotifStats] = useState<any>(null);
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

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold font-[var(--font-heading)] bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                    Dashboard
                </h1>
                <p className="text-sm text-zinc-500 mt-1">
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
                            icon={<TrendingUp className="h-6 w-6 text-white" />}
                            color="white"
                        />
                        <StatCard
                            label="Badges Otorgados"
                            value={gamStats?.total_badges_earned?.toLocaleString() ?? "—"}
                            icon={<Award className="h-6 w-6 text-zinc-200" />}
                            color="slate"
                            href="/admin/gamification/badges"
                        />
                        <StatCard
                            label="Titulos Activos"
                            value={gamStats?.total_titles_earned?.toLocaleString() ?? "—"}
                            icon={<Crown className="h-6 w-6 text-white" />}
                            color="white"
                            href="/admin/gamification/titles"
                        />
                        <StatCard
                            label="Eventos XP Hoy"
                            value={gamStats?.xp_events_today?.toLocaleString() ?? "—"}
                            icon={<Zap className="h-6 w-6 text-zinc-200" />}
                            color="slate"
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
                        icon={<Bell className="h-6 w-6 text-white" />}
                        color="white"
                    />
                    <StatCard
                        label="Tasa de Lectura"
                        value={
                            notifStats?.read_rate
                                ? `${(notifStats.read_rate * 100).toFixed(1)}%`
                                : "—"
                        }
                        icon={<BarChart3 className="h-6 w-6 text-zinc-200" />}
                        color="slate"
                    />
                    <StatCard
                        label="Cosmetics Otorgados"
                        value={gamStats?.total_cosmetics_earned?.toLocaleString() ?? "—"}
                        icon={<Sparkles className="h-6 w-6 text-white" />}
                        color="white"
                        href="/admin/gamification/cosmetics"
                    />
                </div>
            )}

            {/* Quick Links */}
            <div>
                <h2 className="text-lg font-semibold text-zinc-200 mb-4 font-[var(--font-heading)]">
                    Accesos Rápidos
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <QuickLink
                        label="Gestion de Tenants"
                        href="/admin/tenants"
                        icon={<Store className="h-5 w-5 text-white" />}
                        description="Verificar, suspender y reactivar tiendas"
                    />
                    <QuickLink
                        label="Badges y Gamificacion"
                        href="/admin/gamification/badges"
                        icon={<Award className="h-5 w-5 text-zinc-200" />}
                        description="Crear, editar y otorgar badges"
                    />
                    <QuickLink
                        label="Disputas Marketplace"
                        href="/admin/disputes"
                        icon={<Scale className="h-5 w-5 text-white" />}
                        description="Resolver disputas entre usuarios"
                    />
                    <QuickLink
                        label="Temporadas"
                        href="/admin/gamification/seasons"
                        icon={<Users className="h-5 w-5 text-zinc-200" />}
                        description="Administrar seasons competitivas"
                    />
                    <QuickLink
                        label="Templates Notificacion"
                        href="/admin/notifications/templates"
                        icon={<Bell className="h-5 w-5 text-white" />}
                        description="CRUD y preview de templates"
                    />
                    <QuickLink
                        label="Broadcasts"
                        href="/admin/notifications/broadcasts"
                        icon={<Users className="h-5 w-5 text-zinc-200" />}
                        description="Enviar notificaciones masivas"
                    />
                </div>
            </div>
        </div>
    );
}
