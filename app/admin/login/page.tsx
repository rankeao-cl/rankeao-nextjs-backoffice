"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  TextField, Label, InputGroup, InputGroupPrefix, InputGroupSuffix, Input,
  Button, Card, Form,
} from "@heroui/react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { login } from "@/lib/api/auth";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { toast } from "@heroui/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.danger("Ingresa email y contraseña");
      return;
    }
    setIsLoading(true);
    try {
      const res = await login(email, password);
      setAuth(res);
      toast.success("¡Bienvenido al panel admin!");
      const redirect =
        new URLSearchParams(window.location.search).get("redirect") || "/admin/dashboard";
      router.push(redirect);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al iniciar sesión";
      toast.danger(message);
    } finally {
      setIsLoading(false);
    }
  };

  const groupClasses =
    "flex items-center gap-2 border border-[var(--border)] bg-[var(--field-background)] rounded-lg px-3 py-2.5 focus-within:border-[var(--accent)] focus-within:ring-1 focus-within:ring-[var(--accent)]/20 hover:border-[var(--muted)] transition-all duration-150";

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 bg-[var(--background)] overflow-hidden">
      {/* Ambient background shapes */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full blur-[140px] opacity-30"
          style={{ background: "var(--accent)" }}
        />
        <div
          className="absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full blur-[120px] opacity-20"
          style={{ background: "var(--brand)" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full blur-[200px] opacity-[0.07]"
          style={{ background: "var(--accent)" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-[400px]">
        {/* Logo + branding above card */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-brand mb-5">
            <Image src="/logo.png" alt="Rankeao" fill sizes="64px" className="object-contain p-2" priority />
          </div>
          <h1 className="font-[var(--font-heading)] text-3xl font-bold text-gradient-brand tracking-tight">
            Rankeao
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1 tracking-wide">
            Panel de administración
          </p>
        </div>

        <Card className="bg-[var(--surface)]/80 border border-[var(--border)] backdrop-blur-2xl shadow-brand">
          <Card.Content className="p-7">
            <Form onSubmit={handleSubmit} className="space-y-5">
              <TextField name="email" className="space-y-1.5 flex flex-col">
                <Label className="text-[var(--muted)] text-xs font-medium tracking-wide uppercase">Email</Label>
                <InputGroup className={groupClasses}>
                  <InputGroupPrefix>
                    <Mail className="h-4 w-4 text-[var(--muted)] pointer-events-none" />
                  </InputGroupPrefix>
                  <Input
                    type="email"
                    placeholder="admin@rankeao.cl"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setEmail(e.target.value)}
                    className="w-full bg-transparent text-[var(--field-foreground)] placeholder:text-[var(--field-placeholder)] focus:outline-none"
                    required
                  />
                </InputGroup>
              </TextField>

              <TextField name="password" className="space-y-1.5 flex flex-col">
                <Label className="text-[var(--muted)] text-xs font-medium tracking-wide uppercase">Contraseña</Label>
                <InputGroup className={groupClasses}>
                  <InputGroupPrefix>
                    <Lock className="h-4 w-4 text-[var(--muted)] pointer-events-none" />
                  </InputGroupPrefix>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setPassword(e.target.value)}
                    className="w-full bg-transparent text-[var(--field-foreground)] placeholder:text-[var(--field-placeholder)] focus:outline-none"
                    required
                  />
                  <InputGroupSuffix>
                    <Button
                      type="button"
                      isIconOnly
                      size="sm"
                      variant="secondary"
                      onPress={() => setShowPassword(!showPassword)}
                      className="text-[var(--muted)] hover:text-[var(--foreground)]"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </InputGroupSuffix>
                </InputGroup>
              </TextField>

              <Button
                type="submit"
                className="w-full font-semibold py-2.5 rounded-lg mt-2"
                style={{
                  background: "linear-gradient(135deg, var(--accent), var(--brand))",
                  color: "var(--accent-foreground)",
                }}
                isPending={isLoading}
              >
                Iniciar Sesión
              </Button>
            </Form>

            <p className="mt-6 text-center text-[11px] text-[var(--field-placeholder)] tracking-wide">
              Panel exclusivo para administradores
            </p>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
