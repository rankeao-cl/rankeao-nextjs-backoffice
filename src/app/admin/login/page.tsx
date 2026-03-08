"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
    TextField, Label, InputGroup, InputGroupPrefix, InputGroupSuffix, Input,
    Button, Card, Form
} from "@heroui/react";
import { useAuth } from "@/lib/auth";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { toast } from "@heroui/react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            toast.danger("Ingresa email y contraseña");
            return;
        }
        setIsLoading(true);
        try {
            await login(email, password);
            toast.success("¡Bienvenido al panel admin!");
            const redirect =
                new URLSearchParams(window.location.search).get("redirect") ||
                "/admin/dashboard";
            router.push(redirect);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Error al iniciar sesión";
            toast.danger(message);
        } finally {
            setIsLoading(false);
        }
    };

    const groupClasses = "flex items-center gap-2 border border-[var(--border)] bg-[var(--field-background)] rounded-xl px-3 py-2 focus-within:border-[var(--focus)] hover:border-[var(--muted)] transition-colors";

    return (
        <div className="flex min-h-screen items-center justify-center px-4 bg-[var(--background)]">
            <div className="pointer-events-none fixed inset-0">
                <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-[var(--default)] blur-[120px]" />
                <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-[var(--default)] blur-[120px]" />
            </div>

            <Card className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] backdrop-blur-xl shadow-neon-white">
                <Card.Content className="p-8">
                    <div className="flex flex-col items-center mb-8">
                        <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] mb-4 shadow-lg">
                            <Image
                                src="/logo.png"
                                alt="Rankeao"
                                fill
                                sizes="56px"
                                className="object-contain p-2"
                                priority
                            />
                        </div>
                        <h1 className="font-[var(--font-heading)] text-2xl font-bold text-[var(--foreground)]">
                            Rankeao Admin
                        </h1>
                        <p className="text-sm text-[var(--muted)] mt-1">
                            Ingresa al panel de administración
                        </p>
                    </div>

                    <Form onSubmit={handleSubmit} className="space-y-5">
                        <TextField name="email" className="space-y-1.5 flex flex-col">
                            <Label className="text-[var(--muted)] text-sm">Email</Label>
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
                            <Label className="text-[var(--muted)] text-sm">Contraseña</Label>
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
                            className="w-full font-semibold transition-all hover:scale-[1.02] py-2 rounded-xl mt-4"
                            isPending={isLoading}
                        >
                            Iniciar Sesión
                        </Button>
                    </Form>

                    <p className="mt-6 text-center text-xs text-[var(--field-placeholder)]">
                        Panel exclusivo para administradores de Rankeao.cl
                    </p>
                </Card.Content>
            </Card>
        </div>
    );
}


