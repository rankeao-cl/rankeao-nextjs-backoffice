"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  Description,
  Fieldset,
  Form,
  Input,
  Label,
  TextArea,
  TextField,
} from "@heroui/react";
import {
  forgotPassword,
  oauthAppleCallback,
  oauthDiscordCallback,
  oauthGoogleCallback,
  refreshToken,
  registerAuth,
  resetPassword,
  verifyEmail,
} from "@/lib/api-admin";
import { getErrorMessage } from "@/lib/error-message";
import { KeyRound, Mail, Shield, UserPlus } from "lucide-react";
import { toast } from "sonner";

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
        <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-purple-cyan">
          Auth API
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Herramientas para probar todos los endpoints de autenticacion del OpenAPI.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="h-full bg-[#0f1017] border border-[#2a2f4b]/40">
          <CardContent className="p-5">
            <Form className="space-y-4">
              <Fieldset className="space-y-4">
                <Fieldset.Legend className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                  <UserPlus className="h-4 w-4 text-zinc-200" />
                  Registro
                </Fieldset.Legend>
                <Description className="text-xs text-zinc-500">
                  Crea usuarios para validar flujo completo de autenticacion.
                </Description>

                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-zinc-400">Usuario</Label>
                  <Input
                    placeholder="username"
                    value={registerForm.username}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, username: e.target.value }))}
                  />
                </TextField>
                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-zinc-400">Email</Label>
                  <Input
                    placeholder="email"
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </TextField>
                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-zinc-400">Contrasena</Label>
                  <Input
                    placeholder="password"
                    type="password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))}
                  />
                </TextField>

                <Fieldset.Actions className="pt-1">
                  <Button
                    type="button"
                    onPress={() =>
                      runAction("register", () =>
                        registerAuth({
                          username: registerForm.username,
                          email: registerForm.email,
                          password: registerForm.password,
                        })
                      )
                    }
                    isPending={loadingKey === "register"}
                  >
                    Ejecutar registro
                  </Button>
                </Fieldset.Actions>
              </Fieldset>
            </Form>
          </CardContent>
        </Card>

        <Card className="h-full bg-[#0f1017] border border-[#2a2f4b]/40">
          <CardContent className="p-5">
            <Form className="space-y-4">
              <Fieldset className="space-y-4">
                <Fieldset.Legend className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                  <Mail className="h-4 w-4 text-zinc-200" />
                  Recuperar / Verificar / Restablecer
                </Fieldset.Legend>
                <Description className="text-xs text-zinc-500">
                  Ejecuta endpoints de recuperacion y verificacion de cuenta.
                </Description>

                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-zinc-400">Email</Label>
                  <Input
                    placeholder="email para forgot-password"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                </TextField>
                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-zinc-400">Token</Label>
                  <Input
                    placeholder="token (verify/reset)"
                    value={tokenField}
                    onChange={(e) => setTokenField(e.target.value)}
                  />
                </TextField>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onPress={() => runAction("forgot", () => forgotPassword(forgotEmail))}
                    isPending={loadingKey === "forgot"}
                  >
                    Olvide mi contrasena
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onPress={() => runAction("verify", () => verifyEmail({ token: tokenField }))}
                    isPending={loadingKey === "verify"}
                  >
                    Verificar email
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onPress={() => runAction("reset", () => resetPassword({ token: tokenField }))}
                    isPending={loadingKey === "reset"}
                  >
                    Restablecer clave
                  </Button>
                </div>
              </Fieldset>
            </Form>
          </CardContent>
        </Card>

        <Card className="h-full bg-[#0f1017] border border-[#2a2f4b]/40">
          <CardContent className="p-5">
            <Form className="space-y-4">
              <Fieldset className="space-y-4">
                <Fieldset.Legend className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                  <KeyRound className="h-4 w-4 text-zinc-200" />
                  Renovar token
                </Fieldset.Legend>
                <Description className="text-xs text-zinc-500">
                  Usa un refresh token valido para obtener nuevos tokens.
                </Description>
                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-zinc-400">Refresh token</Label>
                  <TextArea
                    placeholder="refresh_token"
                    value={refreshValue}
                    onChange={(e) => setRefreshValue(e.target.value)}
                    rows={4}
                  />
                </TextField>
                <Fieldset.Actions className="pt-1">
                  <Button
                    type="button"
                    onPress={() => runAction("refresh", () => refreshToken(refreshValue))}
                    isPending={loadingKey === "refresh"}
                  >
                    Ejecutar renovacion
                  </Button>
                </Fieldset.Actions>
              </Fieldset>
            </Form>
          </CardContent>
        </Card>

        <Card className="h-full bg-[#0f1017] border border-[#2a2f4b]/40">
          <CardContent className="p-5">
            <Form className="space-y-4">
              <Fieldset className="space-y-4">
                <Fieldset.Legend className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                  <Shield className="h-4 w-4 text-zinc-200" />
                  Callbacks OAuth
                </Fieldset.Legend>
                <Description className="text-xs text-zinc-500">
                  Ejecuta callbacks tal como estan definidos en OpenAPI.
                </Description>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onPress={() => runAction("oauth-google", () => oauthGoogleCallback())}
                    isPending={loadingKey === "oauth-google"}
                  >
                    Callback Google
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onPress={() => runAction("oauth-discord", () => oauthDiscordCallback())}
                    isPending={loadingKey === "oauth-discord"}
                  >
                    Callback Discord
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onPress={() => runAction("oauth-apple", () => oauthAppleCallback())}
                    isPending={loadingKey === "oauth-apple"}
                  >
                    Callback Apple
                  </Button>
                </div>
              </Fieldset>
            </Form>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#0f1017] border border-[#2a2f4b]/40">
        <CardContent className="p-5 space-y-2">
          <p className="text-sm font-medium text-zinc-200">Resultado</p>
          <pre className="rounded-lg bg-[#0a0b12] border border-white/10 p-3 text-xs text-zinc-400 overflow-auto max-h-72 whitespace-pre-wrap">
            {resultText}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
