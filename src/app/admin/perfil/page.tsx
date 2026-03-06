"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Avatar, Button, Card, CardContent, Chip, Spinner } from "@heroui/react";
import {
  getBadges,
  getBroadcasts,
  getDisputes,
  getEmailTemplates,
  getGamificationStats,
  getLastApiError,
  getNotificationStats,
  getTemplates,
  getTenants,
  getToken,
  getXPEvents,
  type LastApiErrorInfo,
} from "@/lib/api-admin";
import { useAuth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/error-message";
import { Activity, Bell, Mail, Shield, Trophy, Users, Zap } from "lucide-react";
import { toast } from "sonner";

type EndpointHealth = {
  ok: boolean;
  detail: string;
};

type Snapshot = {
  tenantsTotal: number;
  tenantsPending: number;
  tenantsActive: number;
  tenantsSuspended: number;
  disputesTotal: number;
  disputesOpen: number;
  disputesResolved: number;
  templatesTotal: number;
  templatesActive: number;
  templatesInactive: number;
  broadcastsTotal: number;
  badgesTotal: number;
  xpEventsTotal: number;
  emailTemplatesTotal: number;
  totalXpGranted: number;
  xpEventsToday: number;
  notificationsSent: number;
  notificationsReadRate: number;
};

const INITIAL_SNAPSHOT: Snapshot = {
  tenantsTotal: 0,
  tenantsPending: 0,
  tenantsActive: 0,
  tenantsSuspended: 0,
  disputesTotal: 0,
  disputesOpen: 0,
  disputesResolved: 0,
  templatesTotal: 0,
  templatesActive: 0,
  templatesInactive: 0,
  broadcastsTotal: 0,
  badgesTotal: 0,
  xpEventsTotal: 0,
  emailTemplatesTotal: 0,
  totalXpGranted: 0,
  xpEventsToday: 0,
  notificationsSent: 0,
  notificationsReadRate: 0,
};

function formatPercent(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "0%";
  }

  return `${(value * 100).toFixed(1)}%`;
}

export default function AdminPerfilPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<Snapshot>(INITIAL_SNAPSHOT);
  const [endpointHealth, setEndpointHealth] = useState<Record<string, EndpointHealth>>({});
  const [lastApiError, setLastApiError] = useState<LastApiErrorInfo | null>(null);

  const accessToken = useMemo(() => getToken(), []);

  const refreshProfileData = useCallback(async () => {
    setLoading(true);

    const results = await Promise.allSettled([
      getTenants(),
      getDisputes({ page: 1, per_page: 20 }),
      getDisputes({ status: "OPEN", page: 1, per_page: 1 }),
      getDisputes({ status: "RESOLVED", page: 1, per_page: 1 }),
      getTemplates({ page: 1, per_page: 20 }),
      getTemplates({ is_active: true, page: 1, per_page: 1 }),
      getTemplates({ is_active: false, page: 1, per_page: 1 }),
      getBroadcasts({ page: 1, per_page: 20 }),
      getBadges(),
      getXPEvents(),
      getEmailTemplates(),
      getGamificationStats(),
      getNotificationStats("24h"),
    ]);

    const [
      tenantsResult,
      disputesResult,
      disputesOpenResult,
      disputesResolvedResult,
      templatesResult,
      templatesActiveResult,
      templatesInactiveResult,
      broadcastsResult,
      badgesResult,
      xpEventsResult,
      emailTemplatesResult,
      gamificationResult,
      notificationsResult,
    ] = results;

    const nextHealth: Record<string, EndpointHealth> = {};

    const markHealth = (
      key: string,
      result: PromiseSettledResult<unknown>,
      okDetail: string
    ) => {
      if (result.status === "fulfilled") {
        nextHealth[key] = { ok: true, detail: okDetail };
        return;
      }

      nextHealth[key] = {
        ok: false,
        detail: getErrorMessage(result.reason, "Error"),
      };
    };

    markHealth("tenants", tenantsResult, "Tenants cargados");
    markHealth("disputes", disputesResult, "Disputes cargadas");
    markHealth("templates", templatesResult, "Templates cargados");
    markHealth("broadcasts", broadcastsResult, "Broadcasts cargados");
    markHealth("badges", badgesResult, "Badges cargados");
    markHealth("xp-events", xpEventsResult, "XP events cargados");
    markHealth("email-templates", emailTemplatesResult, "Email templates cargados");
    markHealth("gamification-stats", gamificationResult, "Stats de gamificacion cargados");
    markHealth("notification-stats", notificationsResult, "Stats de notificaciones cargados");

    const tenants =
      tenantsResult.status === "fulfilled" ? tenantsResult.value.tenants || [] : [];

    const disputesTotal =
      disputesResult.status === "fulfilled"
        ? disputesResult.value.meta?.total || disputesResult.value.disputes.length
        : 0;

    const disputesOpen =
      disputesOpenResult.status === "fulfilled"
        ? disputesOpenResult.value.meta?.total || disputesOpenResult.value.disputes.length
        : 0;

    const disputesResolved =
      disputesResolvedResult.status === "fulfilled"
        ? disputesResolvedResult.value.meta?.total || disputesResolvedResult.value.disputes.length
        : 0;

    const templatesTotal =
      templatesResult.status === "fulfilled"
        ? templatesResult.value.meta?.total || templatesResult.value.templates.length
        : 0;

    const templatesActive =
      templatesActiveResult.status === "fulfilled"
        ? templatesActiveResult.value.meta?.total || templatesActiveResult.value.templates.length
        : 0;

    const templatesInactive =
      templatesInactiveResult.status === "fulfilled"
        ? templatesInactiveResult.value.meta?.total || templatesInactiveResult.value.templates.length
        : 0;

    const broadcastsTotal =
      broadcastsResult.status === "fulfilled"
        ? broadcastsResult.value.meta?.total || broadcastsResult.value.broadcasts.length
        : 0;

    const badgesTotal =
      badgesResult.status === "fulfilled" ? badgesResult.value.badges.length : 0;

    const xpEventsTotal =
      xpEventsResult.status === "fulfilled" ? xpEventsResult.value.events.length : 0;

    const emailTemplatesTotal =
      emailTemplatesResult.status === "fulfilled"
        ? emailTemplatesResult.value.templates.length
        : 0;

    const gamificationStats =
      gamificationResult.status === "fulfilled" ? gamificationResult.value : {};

    const notificationStats =
      notificationsResult.status === "fulfilled" ? notificationsResult.value : {};

    setSnapshot({
      tenantsTotal: tenants.length,
      tenantsPending: tenants.filter((tenant) => tenant.status === "pending").length,
      tenantsActive: tenants.filter((tenant) => tenant.status === "active").length,
      tenantsSuspended: tenants.filter((tenant) => tenant.status === "suspended").length,
      disputesTotal,
      disputesOpen,
      disputesResolved,
      templatesTotal,
      templatesActive,
      templatesInactive,
      broadcastsTotal,
      badgesTotal,
      xpEventsTotal,
      emailTemplatesTotal,
      totalXpGranted: Number(gamificationStats.total_xp_granted || 0),
      xpEventsToday: Number(gamificationStats.xp_events_today || 0),
      notificationsSent: Number(notificationStats.total_sent || 0),
      notificationsReadRate: Number(notificationStats.read_rate || 0),
    });

    setEndpointHealth(nextHealth);
    setLastApiError(getLastApiError());
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      refreshProfileData().catch((error: unknown) => {
        toast.error(getErrorMessage(error, "No se pudo cargar el perfil admin"));
        setLoading(false);
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [refreshProfileData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-purple-cyan">
            Perfil Admin
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Resumen personal y operativo del panel usando datos reales de la API.
          </p>
        </div>
        <Button variant="ghost" onPress={refreshProfileData} isDisabled={loading}>
          Actualizar datos
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-[#0f1017]/80 border border-white/15 lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 bg-white/10 text-zinc-200" size="lg">
                {user?.avatar_url ? <Avatar.Image src={user.avatar_url} alt={user?.username || "Admin"} /> : null}
                <Avatar.Fallback>{user?.username?.[0]?.toUpperCase() || "A"}</Avatar.Fallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-lg font-semibold text-zinc-100">{user?.username || "Admin"}</p>
                <p className="text-sm text-zinc-400">{user?.email || "Sin email"}</p>
                <p className="text-xs text-zinc-500">User ID: {user?.id || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0f1017]/80 border border-white/15">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center gap-2 text-zinc-200">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Sesion</span>
            </div>
            <p className="text-xs text-zinc-500">Token activo</p>
            <p className="text-xs text-zinc-300 break-all">
              {accessToken ? `${accessToken.slice(0, 18)}...` : "No autenticado"}
            </p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" color="current" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-[#0f1017] border border-[#2a2f4b]/40">
              <CardContent className="p-4 space-y-1">
                <p className="text-xs text-zinc-500 uppercase tracking-wide">Tenants</p>
                <p className="text-2xl font-bold text-zinc-100">{snapshot.tenantsTotal}</p>
                <p className="text-xs text-zinc-500">
                  Activos {snapshot.tenantsActive} | Pendientes {snapshot.tenantsPending}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#0f1017] border border-[#2a2f4b]/40">
              <CardContent className="p-4 space-y-1">
                <p className="text-xs text-zinc-500 uppercase tracking-wide">Disputes</p>
                <p className="text-2xl font-bold text-zinc-100">{snapshot.disputesTotal}</p>
                <p className="text-xs text-zinc-500">
                  Open {snapshot.disputesOpen} | Resueltas {snapshot.disputesResolved}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#0f1017] border border-[#2a2f4b]/40">
              <CardContent className="p-4 space-y-1">
                <p className="text-xs text-zinc-500 uppercase tracking-wide">Templates</p>
                <p className="text-2xl font-bold text-zinc-100">{snapshot.templatesTotal}</p>
                <p className="text-xs text-zinc-500">
                  Activos {snapshot.templatesActive} | Inactivos {snapshot.templatesInactive}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#0f1017] border border-[#2a2f4b]/40">
              <CardContent className="p-4 space-y-1">
                <p className="text-xs text-zinc-500 uppercase tracking-wide">Broadcasts</p>
                <p className="text-2xl font-bold text-zinc-100">{snapshot.broadcastsTotal}</p>
                <p className="text-xs text-zinc-500">Email templates {snapshot.emailTemplatesTotal}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="bg-[#0f1017] border border-[#2a2f4b]/40">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-zinc-200">
                  <Trophy className="h-4 w-4" />
                  <p className="text-sm font-medium">Gamificacion</p>
                </div>
                <p className="text-sm text-zinc-400">XP total otorgado</p>
                <p className="text-xl font-semibold text-zinc-100">{snapshot.totalXpGranted.toLocaleString()}</p>
                <p className="text-xs text-zinc-500">Eventos XP hoy: {snapshot.xpEventsToday}</p>
                <p className="text-xs text-zinc-500">Badges: {snapshot.badgesTotal}</p>
                <p className="text-xs text-zinc-500">XP events definidos: {snapshot.xpEventsTotal}</p>
              </CardContent>
            </Card>

            <Card className="bg-[#0f1017] border border-[#2a2f4b]/40">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-zinc-200">
                  <Bell className="h-4 w-4" />
                  <p className="text-sm font-medium">Notificaciones</p>
                </div>
                <p className="text-sm text-zinc-400">Enviadas (24h)</p>
                <p className="text-xl font-semibold text-zinc-100">{snapshot.notificationsSent.toLocaleString()}</p>
                <p className="text-xs text-zinc-500">Read rate: {formatPercent(snapshot.notificationsReadRate)}</p>
              </CardContent>
            </Card>

            <Card className="bg-[#0f1017] border border-[#2a2f4b]/40">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-zinc-200">
                  <Activity className="h-4 w-4" />
                  <p className="text-sm font-medium">Ultimo error API</p>
                </div>
                {lastApiError ? (
                  <>
                    <p className="text-xs text-zinc-400">
                      {lastApiError.method} {lastApiError.path}
                    </p>
                    <p className="text-sm text-zinc-200">
                      {lastApiError.status} {lastApiError.code ? `(${lastApiError.code})` : ""}
                    </p>
                    <p className="text-xs text-zinc-500">{lastApiError.message}</p>
                  </>
                ) : (
                  <p className="text-xs text-zinc-500">Sin errores recientes registrados</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="bg-[#0f1017] border border-[#2a2f4b]/40">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 text-zinc-200">
                <Zap className="h-4 w-4" />
                <p className="text-sm font-medium">Estado de endpoints</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {Object.entries(endpointHealth).map(([key, health]) => (
                  <div key={key} className="rounded-xl border border-white/10 bg-[#0a0b12] p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs uppercase tracking-wide text-zinc-500">{key}</p>
                      <Chip size="sm" variant="soft" color="default">
                        {health.ok ? "OK" : "Error"}
                      </Chip>
                    </div>
                    <p className="text-xs text-zinc-400 break-words">{health.detail}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-zinc-500">
            <div className="rounded-xl border border-white/10 bg-[#0a0b12] p-3 flex items-center gap-2">
              <Users className="h-3.5 w-3.5" /> Tenants suspendidos: {snapshot.tenantsSuspended}
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0a0b12] p-3 flex items-center gap-2">
              <Mail className="h-3.5 w-3.5" /> Email templates: {snapshot.emailTemplatesTotal}
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0a0b12] p-3 flex items-center gap-2">
              <Bell className="h-3.5 w-3.5" /> Broadcasts: {snapshot.broadcastsTotal}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
