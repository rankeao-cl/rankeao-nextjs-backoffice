"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import s from "./styles/AuthGuard.module.css";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated()) {
      router.replace("/admin/login");
      return;
    }

    setChecked(true);
  }, [hasHydrated, isAuthenticated, router]);

  if (!checked) {
    return (
      <div className={s.loading}>
        <div className={s.spinner} />
      </div>
    );
  }

  return <>{children}</>;
}
