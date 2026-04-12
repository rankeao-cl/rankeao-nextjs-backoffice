"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/lib/stores/auth-store";
import { getErrorMessage } from "@/lib/utils/error-message";
import { Code2, Play, Search, Terminal } from "lucide-react";

const DEFAULT_API_BASE = "https://rankeao-go-gateway-production.up.railway.app/api/v1";

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/api/v1") ? trimmed : `${trimmed}/api/v1`;
}

const API_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE
);

type ExplorerOperation = {
  operationId: string;
  method: string;
  path: string;
  summary: string;
  requiresAuth: boolean;
  queryParams: string[];
  pathParams: string[];
  tag?: string;
  hasRequestBody: boolean;
};

type ExplorerResponse = {
  status: number;
  ok: boolean;
  url: string;
  durationMs: number;
  headers: Record<string, string>;
  body: string;
};

function prettyJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function AdminApiExplorerPage() {
  const [operations, setOperations] = useState<ExplorerOperation[]>([]);
  const [loadingOperations, setLoadingOperations] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedOperationId, setSelectedOperationId] = useState("");

  const [pathParams, setPathParams] = useState<Record<string, string>>({});
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});

  const [sendAuth, setSendAuth] = useState(true);
  const [bodyText, setBodyText] = useState("{}");

  const [running, setRunning] = useState(false);
  const [response, setResponse] = useState<ExplorerResponse | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoadingOperations(true);
      try {
        const res = await fetch("/api/admin/openapi", { cache: "no-store" });
        const payload = (await res.json()) as {
          operations?: ExplorerOperation[];
          error?: string;
        };

        if (!res.ok || !payload.operations) {
          throw new Error(payload.error || `Error ${res.status}`);
        }

        setOperations(payload.operations);
        if (payload.operations.length > 0) {
          setSelectedOperationId(payload.operations[0].operationId);
        }
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "No se pudo cargar admin-api.yaml"));
      } finally {
        setLoadingOperations(false);
      }
    };

    void load();
  }, []);

  const filteredOperations = useMemo(() => {
    const q = search.toLowerCase();

    return operations.filter((operation) => {
      return (
        operation.operationId.toLowerCase().includes(q) ||
        operation.path.toLowerCase().includes(q) ||
        operation.method.toLowerCase().includes(q) ||
        String(operation.tag || "").toLowerCase().includes(q)
      );
    });
  }, [operations, search]);

  const selectedOperation = useMemo(() => {
    return operations.find((operation) => operation.operationId === selectedOperationId) || null;
  }, [operations, selectedOperationId]);

  useEffect(() => {
    if (!selectedOperation) {
      return;
    }

    const nextPathParams: Record<string, string> = {};
    const nextQueryParams: Record<string, string> = {};

    selectedOperation.pathParams.forEach((param) => {
      nextPathParams[param] = "";
    });

    selectedOperation.queryParams.forEach((param) => {
      nextQueryParams[param] = "";
    });

    setPathParams(nextPathParams);
    setQueryParams(nextQueryParams);
    setSendAuth(selectedOperation.requiresAuth);
    setBodyText(selectedOperation.hasRequestBody ? "{}" : "");
    setResponse(null);
  }, [selectedOperationId, selectedOperation]);

  const executeOperation = async () => {
    if (!selectedOperation) {
      return;
    }

    let endpointPath = selectedOperation.path;

    for (const param of selectedOperation.pathParams) {
      const value = pathParams[param]?.trim();
      if (!value) {
        toast.error(`Falta path param: ${param}`);
        return;
      }

      endpointPath = endpointPath.replace(`{${param}}`, encodeURIComponent(value));
    }

    const baseUrl = API_BASE_URL;
    const query = new URLSearchParams();

    Object.entries(queryParams).forEach(([key, value]) => {
      const trimmed = value.trim();
      if (trimmed) {
        query.set(key, trimmed);
      }
    });

    const queryString = query.toString();
    const requestUrl = `${baseUrl}${endpointPath}${queryString ? `?${queryString}` : ""}`;

    const headers: Record<string, string> = {};
    const upperMethod = selectedOperation.method.toUpperCase();

    if (sendAuth) {
      const token = useAuthStore.getState().accessToken;
      if (!token) {
        toast.error("No hay token admin para enviar Authorization");
        return;
      }
      headers.Authorization = `Bearer ${token}`;
    }

    let body: string | undefined;
    const canSendBody = !["GET", "HEAD"].includes(upperMethod);

    if (canSendBody && bodyText.trim()) {
      try {
        const parsed = JSON.parse(bodyText);
        body = JSON.stringify(parsed);
        headers["Content-Type"] = "application/json";
      } catch {
        toast.error("Body JSON invalido");
        return;
      }
    }

    setRunning(true);
    const startedAt = performance.now();

    try {
      const res = await fetch(requestUrl, {
        method: upperMethod,
        headers,
        body,
      });

      const rawText = await res.text();
      let outputBody = rawText;

      if (rawText.trim()) {
        try {
          const parsed = JSON.parse(rawText) as unknown;
          outputBody = prettyJson(parsed);
        } catch {
          outputBody = rawText;
        }
      }

      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      setResponse({
        status: res.status,
        ok: res.ok,
        url: requestUrl,
        durationMs: Number((performance.now() - startedAt).toFixed(1)),
        headers: responseHeaders,
        body: outputBody || "(sin contenido)",
      });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Error de red al ejecutar la operacion"));
      setResponse({
        status: 0,
        ok: false,
        url: requestUrl,
        durationMs: Number((performance.now() - startedAt).toFixed(1)),
        headers: {},
        body: getErrorMessage(error),
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-brand">
          Admin API Explorer
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Lee `admin-api.yaml` y ejecuta operaciones por `operationId`.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] xl:col-span-1">
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-[var(--foreground)]" aria-hidden="true" />
              <p className="text-sm text-[var(--foreground)] font-medium">Operaciones</p>
            </div>
            <Input
              placeholder="Buscar operationId, path, method..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {loadingOperations ? (
              <div className="flex justify-center py-10">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--brand)]" />
              </div>
            ) : (
              <div className="max-h-[34rem] overflow-auto space-y-2 pr-1">
                {filteredOperations.map((operation) => (
                  <button
                    key={operation.operationId}
                    type="button"
                    onClick={() => setSelectedOperationId(operation.operationId)}
                    className={`h-auto w-full justify-start rounded-lg border p-3 text-left transition-colors ${selectedOperationId === operation.operationId
                      ? "border-[var(--focus)] bg-[var(--default)]"
                      : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--muted)]"
                      }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-[var(--foreground)]">{operation.operationId}</p>
                      <span className="inline-flex items-center rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-xs font-medium text-[var(--foreground)]">
                        {operation.method}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--muted-foreground)] mt-1 break-all">{operation.path}</p>
                    {operation.tag ? <p className="text-[11px] text-[var(--field-placeholder)] mt-1">{operation.tag}</p> : null}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] xl:col-span-2">
          <div className="p-4 space-y-4">
            {!selectedOperation ? (
              <p className="text-sm text-[var(--muted-foreground)]">Selecciona una operación.</p>
            ) : (
              <>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-[var(--foreground)]" aria-hidden="true" />
                    <p className="text-sm font-medium text-[var(--foreground)]">{selectedOperation.operationId}</p>
                    <span className="inline-flex items-center rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-xs font-medium text-[var(--foreground)]">
                      {selectedOperation.method}
                    </span>
                    {selectedOperation.requiresAuth ? (
                      <span className="inline-flex items-center rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-xs font-medium text-[var(--foreground)]">
                        BearerAuth
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] break-all">{selectedOperation.path}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{selectedOperation.summary}</p>
                </div>

                {selectedOperation.pathParams.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Path params</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {selectedOperation.pathParams.map((param) => (
                        <Input
                          key={param}
                          placeholder={param}
                          value={pathParams[param] || ""}
                          onChange={(e) => setPathParams((prev) => ({ ...prev, [param]: e.target.value }))}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                {selectedOperation.queryParams.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Query params</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {selectedOperation.queryParams.map((param) => (
                        <Input
                          key={param}
                          placeholder={param}
                          value={queryParams[param] || ""}
                          onChange={(e) => setQueryParams((prev) => ({ ...prev, [param]: e.target.value }))}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                {selectedOperation.hasRequestBody ? (
                  <div className="space-y-2">
                    <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Body JSON</p>
                    <Textarea
                      value={bodyText}
                      onChange={(e) => setBodyText(e.target.value)}
                      rows={8}
                      className="font-mono text-xs"
                    />
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant={sendAuth ? "default" : "ghost"}
                    onClick={() => setSendAuth((prev) => !prev)}
                  >
                    Authorization: {sendAuth ? "ON" : "OFF"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={executeOperation}
                    disabled={running}
                    variant="ghost"
                  >
                    <Play className="h-3.5 w-3.5" aria-hidden="true" /> Ejecutar
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-[var(--foreground)]" aria-hidden="true" />
            <p className="text-sm font-medium text-[var(--foreground)]">Respuesta</p>
          </div>

          {response ? (
            <>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-xs font-medium text-[var(--foreground)]">
                  status {response.status}
                </span>
                <span className="inline-flex items-center rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-xs font-medium text-[var(--foreground)]">
                  {response.ok ? "ok" : "error"}
                </span>
                <span className="inline-flex items-center rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-xs font-medium text-[var(--foreground)]">
                  {response.durationMs} ms
                </span>
              </div>
              <p className="text-[11px] text-[var(--muted-foreground)] break-all">{response.url}</p>
              <details className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2">
                <summary className="cursor-pointer text-xs text-[var(--muted-foreground)]">Headers</summary>
                <pre className="mt-2 text-xs text-[var(--muted-foreground)] overflow-auto">{prettyJson(response.headers)}</pre>
              </details>
              <pre className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-xs text-[var(--foreground)] overflow-auto max-h-[28rem] whitespace-pre-wrap">
                {response.body}
              </pre>
            </>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">Aun no se ha ejecutado ninguna operación.</p>
          )}
        </div>
      </div>
    </div>
  );
}
