"use client";

import { Toast, toast } from "@heroui/react";
import { AuthProvider } from "@/lib/auth";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            {children}
            <Toast.Provider placement="top end" />
        </AuthProvider>
    );
}
