"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode,
} from "react";
import {
    loginAdmin as apiLogin,
    setTokens,
    clearTokens,
    getToken,
    type AuthResponse,
} from "./api-admin";

interface User {
    id: string;
    username: string;
    email: string;
    avatar_url?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Restore user from localStorage on mount
        const token = getToken();
        if (token) {
            const storedUser = localStorage.getItem("rankeao_admin_user");
            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch {
                    clearTokens();
                }
            }
        }
        setIsLoading(false);
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const res: AuthResponse = await apiLogin(email, password);
        setTokens(res.access_token, res.refresh_token);
        localStorage.setItem("rankeao_admin_user", JSON.stringify(res.user));
        setUser(res.user);
    }, []);

    const logout = useCallback(() => {
        clearTokens();
        setUser(null);
        window.location.href = "/admin/login";
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
