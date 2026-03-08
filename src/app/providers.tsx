"use client";

import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            {children}
            <Toaster
                theme="system"
                position="top-right"
                toastOptions={{
                    style: {
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        color: "var(--foreground)",
                    },
                }}
            />
        </AuthProvider>
    );
}
