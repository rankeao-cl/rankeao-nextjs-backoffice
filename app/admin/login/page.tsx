"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/stores/auth-store";
import { login } from "@/lib/api/auth";
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LoginBackground from "./LoginBackground";

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
      toast.error("Ingresa email y contraseña");
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
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-scene">
      <LoginBackground />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <motion.div
          className="w-full max-w-[400px] space-y-8"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/10 backdrop-blur-sm">
              <Image src="/logo.png" alt="Rankeao" fill sizes="56px" className="object-contain p-2" priority />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Panel Administración
              </h1>
              <p className="text-sm text-white/50 mt-1.5">
                Acceso exclusivo para administradores
              </p>
            </div>
          </div>

          <div className="login-card p-6 sm:p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5 flex flex-col">
                <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
                  Email
                </label>
                <div className="flex items-center gap-2.5 border border-white/8 bg-white/6 rounded-xl px-3 py-0.5 focus-within:border-white/30 focus-within:ring-1 focus-within:ring-white/10 transition-all">
                  <Mail className="h-4 w-4 pointer-events-none shrink-0 text-white/40" />
                  <Input
                    type="email"
                    placeholder="admin@rankeao.cl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent border-0 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-10 text-sm text-white placeholder:text-white/40"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5 flex flex-col">
                <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
                  Contraseña
                </label>
                <div className="flex items-center gap-2.5 border border-white/8 bg-white/6 rounded-xl px-3 py-0.5 focus-within:border-white/30 focus-within:ring-1 focus-within:ring-white/10 transition-all">
                  <Lock className="h-4 w-4 pointer-events-none shrink-0 text-white/40" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent border-0 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-10 text-sm text-white placeholder:text-white/40"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="text-white/40 hover:text-white transition-colors shrink-0"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full text-white font-semibold py-2.5 rounded-xl mt-2 text-sm transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
                style={{ background: "linear-gradient(135deg, var(--c-navy-500), var(--c-indigo))" }}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {isLoading ? "Iniciando..." : "Iniciar Sesión"}
              </Button>
            </form>

            <p className="text-center text-[11px] text-white/30 tracking-wide">
              Panel exclusivo para administradores de Rankeao.cl
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
