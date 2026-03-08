"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, CardContent, Chip, Input, Spinner, TextArea } from "@heroui/react";
import { getApiBaseUrl, getToken } from "@/lib/api-admin";
import { getErrorMessage } from "@/lib/error-message";
import { Code2, Play, Search, Terminal } from "lucide-react";
import { toast } from "@heroui/react";

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
        toast.danger(getErrorMessage(error, "No se pudo cargar admin-api.yaml"));
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
        toast.danger(`Falta path param: ${param}`);
        return;
      }

      endpointPath = endpointPath.replace(`{${param}}`, encodeURIComponent(value));
    }

    const baseUrl = getApiBaseUrl();
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
      const token = getToken();
      if (!token) {
        toast.danger("No hay token admin para enviar Authorization");
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
        toast.danger("Body JSON invalido");
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
      toast.danger(getErrorMessage(error, "Error de red al ejecutar la operacion"));
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
        <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-purple-cyan">
          Admin API Explorer
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Lee `admin-api.yaml` y ejecuta operaciones por `operationId`.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="bg-[var(--surface)] border border-[var(--border)] xl:col-span-1">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-[var(--foreground)]" />
              <p className="text-sm text-[var(--foreground)] font-medium">Operaciones</p>
            </div>
            <Input
              placeholder="Buscar operationId, path, method..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setSearch(e.target.value)}
            />

            {loadingOperations ? (
              <div className="flex justify-center py-10">
                <Spinner size="lg" color="current" />
              </div>
            ) : (
              <div className="max-h-[34rem] overflow-auto space-y-2 pr-1">
                {filteredOperations.map((operation) => (
                  <Button
                    key={operation.operationId}
                    type="button"
                    variant="secondary"
                    onPress={() => setSelectedOperationId(operation.operationId)}
                    className={`h-auto w-full justify-start rounded-lg border p-3 text-left transition-colors ${selectedOperationId === operation.operationId
                      ? "border-[var(--focus)] bg-[var(--default)]"
                      : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--muted)]"
                      }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-[var(--foreground)]">{operation.operationId}</p>
                      <Chip size="sm" variant="soft" color="default">
                        {operation.method}
                      </Chip>
                    </div>
                    <p className="text-[11px] text-[var(--muted)] mt-1 break-all">{operation.path}</p>
                    {operation.tag ? <p className="text-[11px] text-[var(--field-placeholder)] mt-1">{operation.tag}</p> : null}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[var(--surface)] border border-[var(--border)] xl:col-span-2">
          <CardContent className="p-4 space-y-4">
            {!selectedOperation ? (
              <p className="text-sm text-[var(--muted)]">Selecciona una operación.</p>
            ) : (
              <>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-[var(--foreground)]" />
                    <p className="text-sm font-medium text-[var(--foreground)]">{selectedOperation.operationId}</p>
                    <Chip size="sm" variant="soft" color="default">
                      {selectedOperation.method}
                    </Chip>
                    {selectedOperation.requiresAuth ? (
                      <Chip size="sm" variant="soft" color="default">
                        BearerAuth
                      </Chip>
                    ) : null}
                  </div>
                  <p className="text-xs text-[var(--muted)] break-all">{selectedOperation.path}</p>
                  <p className="text-xs text-[var(--muted)]">{selectedOperation.summary}</p>
                </div>

                {selectedOperation.pathParams.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-[var(--muted)] uppercase tracking-wide">Path params</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {selectedOperation.pathParams.map((param) => (
                        <Input
                          key={param}
                          placeholder={param}
                          value={pathParams[param] || ""}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setPathParams((prev) => ({ ...prev, [param]: e.target.value }))}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                {selectedOperation.queryParams.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-[var(--muted)] uppercase tracking-wide">Query params</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {selectedOperation.queryParams.map((param) => (
                        <Input
                          key={param}
                          placeholder={param}
                          value={queryParams[param] || ""}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setQueryParams((prev) => ({ ...prev, [param]: e.target.value }))}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                {selectedOperation.hasRequestBody ? (
                  <div className="space-y-2">
                    <p className="text-xs text-[var(--muted)] uppercase tracking-wide">Body JSON</p>
                    <TextArea
                      value={bodyText}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setBodyText(e.target.value)}
                      rows={8}
                      className="font-mono text-xs"
                    />
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant={sendAuth ? "primary" : "secondary"}
                    onPress={() => setSendAuth((prev) => !prev)}
                  >
                    Authorization: {sendAuth ? "ON" : "OFF"}
                  </Button>
                  <Button
                    size="sm"
                    onPress={executeOperation}
                    isPending={running}
                    variant="secondary"
                  >
                    <Play className="h-3.5 w-3.5" /> Ejecutar
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[var(--surface)] border border-[var(--border)]">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-[var(--foreground)]" />
            <p className="text-sm font-medium text-[var(--foreground)]">Respuesta</p>
          </div>

          {response ? (
            <>
              <div className="flex flex-wrap gap-2 text-xs">
                <Chip size="sm" variant="soft" color="default">
                  status {response.status}
                </Chip>
                <Chip size="sm" variant="soft" color="default">
                  {response.ok ? "ok" : "error"}
                </Chip>
                <Chip size="sm" variant="soft" color="default">
                  {response.durationMs} ms
                </Chip>
              </div>
              <p className="text-[11px] text-[var(--muted)] break-all">{response.url}</p>
              <details className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2">
                <summary className="cursor-pointer text-xs text-[var(--muted)]">Headers</summary>
                <pre className="mt-2 text-xs text-[var(--muted)] overflow-auto">{prettyJson(response.headers)}</pre>
              </details>
              <pre className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-xs text-[var(--foreground)] overflow-auto max-h-[28rem] whitespace-pre-wrap">
                {response.body}
              </pre>
            </>
          ) : (
            <p className="text-sm text-[var(--muted)]">Aun no se ha ejecutado ninguna operación.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

