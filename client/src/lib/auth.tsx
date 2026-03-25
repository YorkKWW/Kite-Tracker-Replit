import { createContext, useContext, useState, type ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "./queryClient";
import type { User } from "@shared/schema";

type AuthUser = Omit<User, "password">;

export type ViewMode = "super_admin" | "admin" | "manager" | "station_lead";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isHamburg: boolean;
  isStationLead: boolean;
  canEditEquipment: boolean;
  viewMode: ViewMode | null;
  setViewMode: (mode: ViewMode | null) => void;
  isSimulating: boolean;
  simStationId: number | null;
  setSimStationId: (id: number | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewModeRaw] = useState<ViewMode | null>(null);
  const [simStationId, setSimStationId] = useState<number | null>(null);

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

  const setViewMode = (mode: ViewMode | null) => {
    setViewModeRaw(mode);
    if (mode !== "station_lead") {
      setSimStationId(null);
    }
  };

  const actualSuperAdmin = user?.role === "admin" && user?.isSuperAdmin === true;
  const userRole = user?.role;
  
  // Determine if user can simulate: higher roles can simulate lower roles
  const canSimulate = userRole === "admin" || userRole === "manager";
  const isSimulating = canSimulate && viewMode !== null && viewMode !== userRole;

  let isSuperAdmin = actualSuperAdmin;
  let isAdmin = user?.role === "admin";
  let isHamburg = user?.role === "admin" || user?.role === "manager";
  let isStationLead = user?.role === "station_lead";
  let canEditEquipment = user?.canEditEquipment === true || user?.role === "admin" || user?.role === "manager";

  if (isSimulating && viewMode) {
    isSuperAdmin = false;
    isAdmin = viewMode === "admin";
    isHamburg = viewMode === "admin" || viewMode === "manager";
    isStationLead = viewMode === "station_lead";
    canEditEquipment = viewMode === "station_lead" ? false : viewMode === "admin" || viewMode === "manager";
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
        isStationLead,
        canEditEquipment,
        viewMode: canSimulate ? viewMode : null,
        setViewMode: canSimulate ? setViewMode : () => {},
        isSimulating,
        simStationId: isSimulating && viewMode === "station_lead" ? simStationId : null,
        setSimStationId: canSimulate ? setSimStationId : () => {},
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
