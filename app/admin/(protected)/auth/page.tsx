"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  forgotPassword,
  oauthAppleCallback,
  oauthDiscordCallback,
  oauthGoogleCallback,
  refreshToken,
  register,
  resetPassword,
  verifyEmail,
} from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/utils/error-message";
import { KeyRound, Mail, Shield, UserPlus } from "lucide-react";

function pretty(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function AuthApiPage() {
  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [forgotEmail, setForgotEmail] = useState("");
  const [refreshValue, setRefreshValue] = useState("");
  const [tokenField, setTokenField] = useState("");

  const [resultText, setResultText] = useState("Sin ejecuciones aun.");
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const runAction = async (key: string, action: () => Promise<unknown>) => {
    setLoadingKey(key);
    try {
      const data = await action();
      setResultText(pretty(data));
      toast.success("Operacion ejecutada");
    } catch (error: unknown) {
      setResultText(getErrorMessage(error));
      toast.error(getErrorMessage(error));
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-brand">
          Auth API
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Herramientas para probar todos los endpoints de autenticacion del OpenAPI.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] h-full">
          <div className="p-5">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                <UserPlus className="h-4 w-4 text-[var(--foreground)]" aria-hidden="true" />
                Registro
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Crea usuarios para validar flujo completo de autenticacion.
              </p>

              <div className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted-foreground)]">Usuario</Label>
                <Input
                  placeholder="username"
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, username: e.target.value }))}
                />
              </div>
              <div className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted-foreground)]">Email</Label>
                <Input
                  placeholder="email"
                  type="email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted-foreground)]">Contraseña</Label>
                <Input
                  placeholder="password"
                  type="password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))}
                />
              </div>

              <div className="pt-1">
                <Button
                  type="button"
                  onClick={() =>
                    runAction("register", () =>
                      register({
                        username: registerForm.username,
                        email: registerForm.email,
                        password: registerForm.password,
                      })
                    )
                  }
                  disabled={loadingKey === "register"}
                >
                  Ejecutar registro
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] h-full">
          <div className="p-5">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                <Mail className="h-4 w-4 text-[var(--foreground)]" aria-hidden="true" />
                Recuperar / Verificar / Restablecer
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Ejecuta endpoints de recuperacion y verificacion de cuenta.
              </p>

              <div className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted-foreground)]">Email</Label>
                <Input
                  placeholder="email para forgot-password"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted-foreground)]">Token</Label>
                <Input
                  placeholder="token (verify/reset)"
                  value={tokenField}
                  onChange={(e) => setTokenField(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => runAction("forgot", () => forgotPassword(forgotEmail))}
                  disabled={loadingKey === "forgot"}
                >
                  Olvide mi contraseña
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => runAction("verify", () => verifyEmail({ token: tokenField }))}
                  disabled={loadingKey === "verify"}
                >
                  Verificar email
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => runAction("reset", () => resetPassword({ token: tokenField }))}
                  disabled={loadingKey === "reset"}
                >
                  Restablecer clave
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] h-full">
          <div className="p-5">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                <KeyRound className="h-4 w-4 text-[var(--foreground)]" aria-hidden="true" />
                Renovar token
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Usa un refresh token valido para obtener nuevos tokens.
              </p>
              <div className="space-y-1 flex flex-col">
                <Label className="text-xs text-[var(--muted-foreground)]">Refresh token</Label>
                <Textarea
                  placeholder="refresh_token"
                  value={refreshValue}
                  onChange={(e) => setRefreshValue(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="pt-1">
                <Button
                  type="button"
                  onClick={() => runAction("refresh", () => refreshToken(refreshValue))}
                  disabled={loadingKey === "refresh"}
                >
                  Ejecutar renovacion
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] h-full">
          <div className="p-5">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                <Shield className="h-4 w-4 text-[var(--foreground)]" aria-hidden="true" />
                Callbacks OAuth
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Ejecuta callbacks tal como estan definidos en OpenAPI.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => runAction("oauth-google", () => oauthGoogleCallback())}
                  disabled={loadingKey === "oauth-google"}
                >
                  Callback Google
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => runAction("oauth-discord", () => oauthDiscordCallback())}
                  disabled={loadingKey === "oauth-discord"}
                >
                  Callback Discord
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => runAction("oauth-apple", () => oauthAppleCallback())}
                  disabled={loadingKey === "oauth-apple"}
                >
                  Callback Apple
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
        <div className="p-5 space-y-2">
          <p className="text-sm font-medium text-[var(--foreground)]">Resultado</p>
          <pre className="rounded-lg bg-[var(--surface)] border border-[var(--border)] p-3 text-xs text-[var(--muted-foreground)] overflow-auto max-h-72 whitespace-pre-wrap">
            {resultText}
          </pre>
        </div>
      </div>
    </div>
  );
}
