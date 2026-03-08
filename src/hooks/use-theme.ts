"use client";

import { useCallback, useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "rankeao-theme";

function getInitialTheme(): Theme {
    if (typeof window === "undefined") return "dark";
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useTheme() {
    const [theme, setThemeState] = useState<Theme>("dark");

    // Sync on mount
    useEffect(() => {
        const initial = getInitialTheme();
        setThemeState(initial);
        applyTheme(initial);
    }, []);

    const applyTheme = (t: Theme) => {
        const root = document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(t);
        root.setAttribute("data-theme", t);
    };

    const setTheme = useCallback((t: Theme) => {
        setThemeState(t);
        applyTheme(t);
        localStorage.setItem(STORAGE_KEY, t);
    }, []);

    const toggleTheme = useCallback(() => {
        setThemeState((prev) => {
            const next = prev === "dark" ? "light" : "dark";
            applyTheme(next);
            localStorage.setItem(STORAGE_KEY, next);
            return next;
        });
    }, []);

    return { theme, setTheme, toggleTheme };
}
