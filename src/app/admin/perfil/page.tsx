"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Avatar, Button, Card, Chip, Skeleton, Spinner } from "@heroui/react";
import {
  LAST_API_ERROR_EVENT,
  clearApiErrorHistory,
  getApiErrorHistory,
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
import {
  Activity,
  Bell,
  Clock3,
  Mail,
  Shield,
  ShieldCheck,
  Trophy,
  User,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "@heroui/react";

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

type PerfilTab = "resumen" | "seguridad" | "actividad-api";

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
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<PerfilTab>("resumen");
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<Snapshot>(INITIAL_SNAPSHOT);
  const [endpointHealth, setEndpointHealth] = useState<Record<string, EndpointHealth>>({});
  const [lastApiError, setLastApiError] = useState<LastApiErrorInfo | null>(null);
  const [errorHistory, setErrorHistory] = useState<LastApiErrorInfo[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>("");

  const accessToken = useMemo(() => getToken(), []);

  const syncApiErrorState = useCallback(() => {
    setLastApiError(getLastApiError());
    setErrorHistory(getApiErrorHistory());
  }, []);

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

    const tenants = tenantsResult.status === "fulfilled" ? tenantsResult.value.tenants || [] : [];

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

    const badgesTotal = badgesResult.status === "fulfilled" ? badgesResult.value.badges.length : 0;

    const xpEventsTotal = xpEventsResult.status === "fulfilled" ? xpEventsResult.value.events.length : 0;

    const emailTemplatesTotal =
      emailTemplatesResult.status === "fulfilled" ? emailTemplatesResult.value.templates.length : 0;

    const gamificationStats = gamificationResult.status === "fulfilled" ? gamificationResult.value : {};
    const notificationStats = notificationsResult.status === "fulfilled" ? notificationsResult.value : {};

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
    setLastUpdatedAt(new Date().toISOString());
    syncApiErrorState();
    setLoading(false);
  }, [syncApiErrorState]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      refreshProfileData().catch((error: unknown) => {
        toast.danger(getErrorMessage(error, "No se pudo cargar el perfil admin"));
        setLoading(false);
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [refreshProfileData]);

  useEffect(() => {
    const handler = () => syncApiErrorState();

    window.addEventListener(LAST_API_ERROR_EVENT, handler);
    return () => window.removeEventListener(LAST_API_ERROR_EVENT, handler);
  }, [syncApiErrorState]);

  const handleClearHistory = () => {
    clearApiErrorHistory();
    syncApiErrorState();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-purple-cyan">
            Perfil Admin
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Control personal, seguridad y actividad de API para soporte.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onPress={() => void refreshProfileData()} isDisabled={loading}>
            Actualizar datos
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={activeTab === "resumen" ? "primary" : "secondary"}
          onPress={() => setActiveTab("resumen")}
        >
          Resumen
        </Button>
        <Button
          size="sm"
          variant={activeTab === "seguridad" ? "primary" : "secondary"}
          onPress={() => setActiveTab("seguridad")}
        >
          Seguridad
        </Button>
        <Button
          size="sm"
          variant={activeTab === "actividad-api" ? "primary" : "secondary"}
          onPress={() => setActiveTab("actividad-api")}
        >
          Actividad API (histórico de errores)
        </Button>
      </div>

      {loading ? (
        <div className="space-y-6 py-10">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48 rounded" />
              <Skeleton className="h-3 w-32 rounded" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-4/5 rounded" />
            <Skeleton className="h-3 w-3/5 rounded" />
          </div>
        </div>
      ) : null}

      {!loading && activeTab === "resumen" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-[var(--surface)] border border-[var(--border)]">
              <Card.Content className="p-4 space-y-1">
                <p className="text-xs text-[var(--muted)] uppercase tracking-wide">Tenants</p>
                <p className="text-2xl font-bold text-[var(--foreground)]">{snapshot.tenantsTotal}</p>
                <p className="text-xs text-[var(--muted)]">
                  Activos {snapshot.tenantsActive} | Pendientes {snapshot.tenantsPending}
                </p>
              </Card.Content>
            </Card>

            <Card className="bg-[var(--surface)] border border-[var(--border)]">
              <Card.Content className="p-4 space-y-1">
                <p className="text-xs text-[var(--muted)] uppercase tracking-wide">Disputes</p>
                <p className="text-2xl font-bold text-[var(--foreground)]">{snapshot.disputesTotal}</p>
                <p className="text-xs text-[var(--muted)]">
                  Open {snapshot.disputesOpen} | Resueltas {snapshot.disputesResolved}
                </p>
              </Card.Content>
            </Card>

            <Card className="bg-[var(--surface)] border border-[var(--border)]">
              <Card.Content className="p-4 space-y-1">
                <p className="text-xs text-[var(--muted)] uppercase tracking-wide">Templates</p>
                <p className="text-2xl font-bold text-[var(--foreground)]">{snapshot.templatesTotal}</p>
                <p className="text-xs text-[var(--muted)]">
                  Activos {snapshot.templatesActive} | Inactivos {snapshot.templatesInactive}
                </p>
              </Card.Content>
            </Card>

            <Card className="bg-[var(--surface)] border border-[var(--border)]">
              <Card.Content className="p-4 space-y-1">
                <p className="text-xs text-[var(--muted)] uppercase tracking-wide">Broadcasts</p>
                <p className="text-2xl font-bold text-[var(--foreground)]">{snapshot.broadcastsTotal}</p>
                <p className="text-xs text-[var(--muted)]">Email templates {snapshot.emailTemplatesTotal}</p>
              </Card.Content>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-[var(--surface)] border border-[var(--border)]">
              <Card.Content className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-[var(--foreground)]">
                  <Trophy className="h-4 w-4" />
                  <p className="text-sm font-medium">Gamificacion</p>
                </div>
                <p className="text-sm text-[var(--muted)]">XP total otorgado</p>
                <p className="text-xl font-semibold text-[var(--foreground)]">{snapshot.totalXpGranted.toLocaleString()}</p>
                <p className="text-xs text-[var(--muted)]">Eventos XP hoy: {snapshot.xpEventsToday}</p>
                <p className="text-xs text-[var(--muted)]">Badges: {snapshot.badgesTotal}</p>
                <p className="text-xs text-[var(--muted)]">XP events definidos: {snapshot.xpEventsTotal}</p>
              </Card.Content>
            </Card>

            <Card className="bg-[var(--surface)] border border-[var(--border)]">
              <Card.Content className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-[var(--foreground)]">
                  <Bell className="h-4 w-4" />
                  <p className="text-sm font-medium">Notificaciones</p>
                </div>
                <p className="text-sm text-[var(--muted)]">Enviadas (24h)</p>
                <p className="text-xl font-semibold text-[var(--foreground)]">{snapshot.notificationsSent.toLocaleString()}</p>
                <p className="text-xs text-[var(--muted)]">Read rate: {formatPercent(snapshot.notificationsReadRate)}</p>
              </Card.Content>
            </Card>
          </div>

          <Card className="bg-[var(--surface)] border border-[var(--border)]">
            <Card.Content className="p-5 space-y-4">
              <div className="flex items-center gap-2 text-[var(--foreground)]">
                <Zap className="h-4 w-4" />
                <p className="text-sm font-medium">Estado de endpoints</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {Object.entries(endpointHealth).map(([key, health]) => (
                  <div key={key} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{key}</p>
                      <Chip size="sm" variant="soft" color="default">
                        {health.ok ? "OK" : "Error"}
                      </Chip>
                    </div>
                    <p className="text-xs text-[var(--muted)] break-words">{health.detail}</p>
                  </div>
                ))}
              </div>
            </Card.Content>
          </Card>

          <div className="text-xs text-[var(--muted)] flex items-center gap-2">
            <Clock3 className="h-3.5 w-3.5" />
            Ultima actualización: {lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleString("es-CL") : "-"}
          </div>
        </div>
      ) : null}

      {!loading && activeTab === "seguridad" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="bg-[var(--surface-secondary)] border border-[var(--border)] lg:col-span-2">
              <Card.Content className="p-5">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 bg-[var(--default)] text-[var(--foreground)]" size="lg">
                    {user?.avatar_url ? <Avatar.Image src={user.avatar_url} alt={user?.username || "Admin"} /> : null}
                    <Avatar.Fallback>{user?.username?.[0]?.toUpperCase() || "A"}</Avatar.Fallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-[var(--foreground)]">{user?.username || "Admin"}</p>
                    <p className="text-sm text-[var(--muted)]">{user?.email || "Sin email"}</p>
                    <p className="text-xs text-[var(--muted)]">User ID: {user?.id || "-"}</p>
                  </div>
                </div>
              </Card.Content>
            </Card>

            <Card className="bg-[var(--surface-secondary)] border border-[var(--border)]">
              <Card.Content className="p-5 space-y-2">
                <div className="flex items-center gap-2 text-[var(--foreground)]">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm font-medium">Sesion</span>
                </div>
                <p className="text-xs text-[var(--muted)]">Token activo</p>
                <p className="text-xs text-[var(--foreground)] break-all">
                  {accessToken ? `${accessToken.slice(0, 24)}...` : "No autenticado"}
                </p>
                <Chip size="sm" variant="soft" color="default">
                  {accessToken ? "Sesion valida" : "Sesion ausente"}
                </Chip>
              </Card.Content>
            </Card>
          </div>

          <Card className="bg-[var(--surface)] border border-[var(--border)]">
            <Card.Content className="p-5 space-y-4">
              <div className="flex items-center gap-2 text-[var(--foreground)]">
                <ShieldCheck className="h-4 w-4" />
                <p className="text-sm font-medium">Controles de seguridad</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-[var(--muted)]">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 flex items-center gap-2">
                  <User className="h-3.5 w-3.5" /> Usuario autenticado: {user?.username || "-"}
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" /> Email verificado por auth backend
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" /> Sesion protegida por `proxy` en `/admin/*`
                </div>
              </div>

              <div>
                <Button variant="danger" onPress={logout}>
                  Cerrar sesión
                </Button>
              </div>
            </Card.Content>
          </Card>
        </div>
      ) : null}

      {!loading && activeTab === "actividad-api" ? (
        <div className="space-y-4">
          <Card className="bg-[var(--surface)] border border-[var(--border)]">
            <Card.Content className="p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[var(--foreground)]">
                  <Activity className="h-4 w-4" />
                  <p className="text-sm font-medium">Ultimo error API</p>
                </div>
                <Button size="sm" variant="tertiary" onPress={handleClearHistory}>
                  Limpiar historial
                </Button>
              </div>

              {lastApiError ? (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 space-y-1">
                  <p className="text-xs text-[var(--muted)]">
                    {lastApiError.method} {lastApiError.path}
                  </p>
                  <p className="text-sm text-[var(--foreground)]">
                    {lastApiError.status} {lastApiError.code ? `(${lastApiError.code})` : ""}
                  </p>
                  <p className="text-xs text-[var(--muted)]">{lastApiError.message}</p>
                  <p className="text-[11px] text-[var(--field-placeholder)]">
                    {new Date(lastApiError.at).toLocaleString("es-CL")}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-[var(--muted)]">Sin errores API recientes.</p>
              )}
            </Card.Content>
          </Card>

          <Card className="bg-[var(--surface)] border border-[var(--border)]">
            <Card.Content className="p-5 space-y-3">
              <div className="flex items-center gap-2 text-[var(--foreground)]">
                <Zap className="h-4 w-4" />
                <p className="text-sm font-medium">Histórico (últimos {errorHistory.length})</p>
              </div>

              {errorHistory.length === 0 ? (
                <p className="text-xs text-[var(--muted)]">No hay errores en historial.</p>
              ) : (
                <div className="space-y-2">
                  {errorHistory.map((entry, index) => (
                    <div key={`${entry.at}-${entry.path}-${index}`} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                        <span>{entry.method}</span>
                        <span>{entry.path}</span>
                        <span className="text-[var(--muted)]">status {entry.status}</span>
                        {entry.code ? <span className="text-[var(--muted)]">code {entry.code}</span> : null}
                      </div>
                      <p className="text-xs text-[var(--muted)] break-words">{entry.message}</p>
                      <p className="text-[11px] text-[var(--field-placeholder)]">{new Date(entry.at).toLocaleString("es-CL")}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card.Content>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

