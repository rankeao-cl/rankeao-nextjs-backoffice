"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Avatar, Button, Card, Chip, Skeleton } from "@heroui/react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useGamificationStats, useBadges, useXPEvents } from "@/lib/hooks/use-gamification";
import {
  useNotificationStats,
  useTemplates,
  useBroadcasts,
  useEmailTemplates,
} from "@/lib/hooks/use-notifications";
import { useTenants } from "@/lib/hooks/use-tenants";
import { useDisputes } from "@/lib/hooks/use-disputes";
import { getErrorMessage } from "@/lib/utils/error-message";
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

// ---------------------------------------------------------------------------
// localStorage API error utilities (inlined from api-admin)
// ---------------------------------------------------------------------------

const LAST_API_ERROR_STORAGE_KEY = "rankeao_admin_last_api_error";
const API_ERROR_HISTORY_STORAGE_KEY = "rankeao_admin_api_error_history";
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
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.path !== "string" ||
      typeof parsed.message !== "string" ||
      typeof parsed.at !== "string"
    ) {
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(LAST_API_ERROR_STORAGE_KEY);
    return null;
  }
}

function getApiErrorHistory(): LastApiErrorInfo[] {
  if (typeof window === "undefined") return [];

  const raw = localStorage.getItem(API_ERROR_HISTORY_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as LastApiErrorInfo[];
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        typeof item.path === "string" &&
        typeof item.message === "string" &&
        typeof item.at === "string"
    );
  } catch {
    localStorage.removeItem(API_ERROR_HISTORY_STORAGE_KEY);
    return [];
  }
}

function clearApiErrorHistory() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(API_ERROR_HISTORY_STORAGE_KEY);
  window.dispatchEvent(new Event(LAST_API_ERROR_EVENT));
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EndpointHealth = {
  ok: boolean;
  detail: string;
};

type PerfilTab = "resumen" | "seguridad" | "actividad-api";

function formatPercent(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "0%";
  }

  return `${(value * 100).toFixed(1)}%`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminPerfilPage() {
  const { user, logout, accessToken } = useAuthStore();

  const [activeTab, setActiveTab] = useState<PerfilTab>("resumen");
  const [lastApiError, setLastApiError] = useState<LastApiErrorInfo | null>(null);
  const [errorHistory, setErrorHistory] = useState<LastApiErrorInfo[]>([]);

  // --- React Query hooks ---
  const tenantsQuery = useTenants();
  const disputesQuery = useDisputes({ page: 1, per_page: 20 });
  const disputesOpenQuery = useDisputes({ status: "OPEN", page: 1, per_page: 1 });
  const disputesResolvedQuery = useDisputes({ status: "RESOLVED", page: 1, per_page: 1 });
  const templatesQuery = useTemplates({ page: 1, per_page: 20 });
  const templatesActiveQuery = useTemplates({ is_active: true, page: 1, per_page: 1 });
  const templatesInactiveQuery = useTemplates({ is_active: false, page: 1, per_page: 1 });
  const broadcastsQuery = useBroadcasts({ page: 1, per_page: 20 });
  const badgesQuery = useBadges();
  const xpEventsQuery = useXPEvents();
  const emailTemplatesQuery = useEmailTemplates();
  const gamificationStatsQuery = useGamificationStats();
  const notificationStatsQuery = useNotificationStats("24h");

  const allQueries = [
    tenantsQuery,
    disputesQuery,
    disputesOpenQuery,
    disputesResolvedQuery,
    templatesQuery,
    templatesActiveQuery,
    templatesInactiveQuery,
    broadcastsQuery,
    badgesQuery,
    xpEventsQuery,
    emailTemplatesQuery,
    gamificationStatsQuery,
    notificationStatsQuery,
  ];

  const loading = allQueries.some((q) => q.isLoading);

  // --- Computed snapshot ---
  const snapshot = useMemo(() => {
    const tenants = tenantsQuery.data ?? [];

    const disputesTotal =
      disputesQuery.data?.meta?.total ?? disputesQuery.data?.disputes?.length ?? 0;
    const disputesOpen =
      disputesOpenQuery.data?.meta?.total ?? disputesOpenQuery.data?.disputes?.length ?? 0;
    const disputesResolved =
      disputesResolvedQuery.data?.meta?.total ?? disputesResolvedQuery.data?.disputes?.length ?? 0;

    const templatesTotal =
      templatesQuery.data?.meta?.total ?? templatesQuery.data?.templates?.length ?? 0;
    const templatesActive =
      templatesActiveQuery.data?.meta?.total ?? templatesActiveQuery.data?.templates?.length ?? 0;
    const templatesInactive =
      templatesInactiveQuery.data?.meta?.total ?? templatesInactiveQuery.data?.templates?.length ?? 0;

    const broadcastsTotal =
      broadcastsQuery.data?.meta?.total ?? broadcastsQuery.data?.broadcasts?.length ?? 0;

    const badgesTotal = badgesQuery.data?.length ?? 0;
    const xpEventsTotal = xpEventsQuery.data?.length ?? 0;
    const emailTemplatesTotal = emailTemplatesQuery.data?.length ?? 0;

    const gamificationStats = gamificationStatsQuery.data ?? {};
    const notificationStats = notificationStatsQuery.data ?? {};

    return {
      tenantsTotal: tenants.length,
      tenantsPending: tenants.filter((t) => t.status === "pending").length,
      tenantsActive: tenants.filter((t) => t.status === "active").length,
      tenantsSuspended: tenants.filter((t) => t.status === "suspended").length,
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
      totalXpGranted: Number(gamificationStats.total_xp_granted ?? 0),
      xpEventsToday: Number(gamificationStats.xp_events_today ?? 0),
      notificationsSent: Number(notificationStats.sent_24h ?? (notificationStats as Record<string, unknown>).total_sent ?? 0),
      notificationsReadRate: Number(notificationStats.read_rate ?? 0),
    };
  }, [
    tenantsQuery.data,
    disputesQuery.data,
    disputesOpenQuery.data,
    disputesResolvedQuery.data,
    templatesQuery.data,
    templatesActiveQuery.data,
    templatesInactiveQuery.data,
    broadcastsQuery.data,
    badgesQuery.data,
    xpEventsQuery.data,
    emailTemplatesQuery.data,
    gamificationStatsQuery.data,
    notificationStatsQuery.data,
  ]);

  // --- Endpoint health ---
  const endpointHealth = useMemo(() => {
    const health: Record<string, EndpointHealth> = {};

    const mark = (
      key: string,
      query: { isError: boolean; error: unknown },
      okDetail: string
    ) => {
      if (query.isError) {
        health[key] = { ok: false, detail: getErrorMessage(query.error, "Error") };
      } else {
        health[key] = { ok: true, detail: okDetail };
      }
    };

    mark("tenants", tenantsQuery, "Tenants cargados");
    mark("disputes", disputesQuery, "Disputes cargadas");
    mark("templates", templatesQuery, "Templates cargados");
    mark("broadcasts", broadcastsQuery, "Broadcasts cargados");
    mark("badges", badgesQuery, "Badges cargados");
    mark("xp-events", xpEventsQuery, "XP events cargados");
    mark("email-templates", emailTemplatesQuery, "Email templates cargados");
    mark("gamification-stats", gamificationStatsQuery, "Stats de gamificacion cargados");
    mark("notification-stats", notificationStatsQuery, "Stats de notificaciones cargados");

    return health;
  }, [
    tenantsQuery.isError, tenantsQuery.error,
    disputesQuery.isError, disputesQuery.error,
    templatesQuery.isError, templatesQuery.error,
    broadcastsQuery.isError, broadcastsQuery.error,
    badgesQuery.isError, badgesQuery.error,
    xpEventsQuery.isError, xpEventsQuery.error,
    emailTemplatesQuery.isError, emailTemplatesQuery.error,
    gamificationStatsQuery.isError, gamificationStatsQuery.error,
    notificationStatsQuery.isError, notificationStatsQuery.error,
  ]);

  // --- Last updated timestamp ---
  const lastUpdatedAt = useMemo(() => {
    const timestamps = allQueries
      .map((q) => q.dataUpdatedAt)
      .filter((t) => t > 0);

    if (timestamps.length === 0) return "";
    return new Date(Math.max(...timestamps)).toISOString();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, allQueries.map((q) => q.dataUpdatedAt));

  // --- API error state ---
  const syncApiErrorState = useCallback(() => {
    setLastApiError(getLastApiError());
    setErrorHistory(getApiErrorHistory());
  }, []);

  useEffect(() => {
    syncApiErrorState();
  }, [syncApiErrorState]);

  useEffect(() => {
    const handler = () => syncApiErrorState();
    window.addEventListener(LAST_API_ERROR_EVENT, handler);
    return () => window.removeEventListener(LAST_API_ERROR_EVENT, handler);
  }, [syncApiErrorState]);

  const handleClearHistory = () => {
    clearApiErrorHistory();
    syncApiErrorState();
  };

  const handleRefresh = () => {
    for (const q of allQueries) {
      void q.refetch();
    }
    syncApiErrorState();
  };

  const handleLogout = () => {
    logout();
    if (typeof window !== "undefined") {
      window.location.href = "/admin/login";
    }
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
          <Button variant="secondary" onPress={handleRefresh} isDisabled={loading}>
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
                <Button variant="danger" onPress={handleLogout}>
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
