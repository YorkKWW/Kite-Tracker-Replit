import { createContext, useContext, useState, type ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "./queryClient";
import type { User } from "@shared/schema";

type AuthUser = Omit<User, "password">;

export type ViewMode = "super_admin" | "admin" | "manager" | "center_manager";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isHamburg: boolean;
  isCenterManager: boolean;
  canEditEquipment: boolean;
  viewMode: ViewMode | null;
  setViewMode: (mode: ViewMode | null) => void;
  isSimulating: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode | null>(null);

  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.status === 401) return null;
        if (!res.ok) return null;
        return res.json();
      } catch {
        return null;
      }
    },
    staleTime: 30000,
    refetchOnWindowFocus: true,
    retry: false,
  });

  const login = async (email: string, password: string) => {
    await apiRequest("POST", "/api/auth/login", { email, password });
    await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
  };

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch {
    }
    queryClient.setQueryData(["/api/auth/me"], null);
    queryClient.clear();
  };

  const actualSuperAdmin = user?.role === "admin" && user?.isSuperAdmin === true;
  const isSimulating = actualSuperAdmin && viewMode !== null && viewMode !== "super_admin";

  let isSuperAdmin = actualSuperAdmin;
  let isAdmin = user?.role === "admin";
  let isHamburg = user?.role === "admin" || user?.role === "manager";
  let isCenterManager = user?.role === "center_manager";
  let canEditEquipment = user?.canEditEquipment === true || user?.role === "admin" || user?.role === "manager";

  if (isSimulating && viewMode) {
    isSuperAdmin = false;
    isAdmin = viewMode === "admin";
    isHamburg = viewMode === "admin" || viewMode === "manager";
    isCenterManager = viewMode === "center_manager";
    canEditEquipment = viewMode === "center_manager" ? false : viewMode === "admin" || viewMode === "manager";
  }

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        login,
        logout,
        isSuperAdmin,
        isAdmin,
        isHamburg,
        isCenterManager,
        canEditEquipment,
        viewMode: actualSuperAdmin ? viewMode : null,
        setViewMode: actualSuperAdmin ? setViewMode : () => {},
        isSimulating,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
