"use client";

import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            {children}
            <Toaster
                theme="dark"
                position="top-right"
                toastOptions={{
                    style: {
                        background: "#0f1017",
                        border: "1px solid #2a2f4b",
                        color: "#e4e4e7",
                    },
                }}
            />
        </AuthProvider>
    );
}
