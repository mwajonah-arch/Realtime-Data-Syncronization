import React, { createContext, useContext, useState, useEffect } from "react";
import { useAddActivityLogEntry } from "@workspace/api-client-react";

type Role = "staff" | "admin" | null;

interface AuthContextType {
  role: Role;
  login: (role: "staff" | "admin") => void;
  logout: () => void;
  logActivity: (action: string, detail: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>(() => {
    const saved = localStorage.getItem("sjm_role");
    return (saved as Role) || null;
  });

  const { mutate: addLog } = useAddActivityLogEntry();

  const login = (newRole: "staff" | "admin") => {
    setRole(newRole);
    localStorage.setItem("sjm_role", newRole);
    addLog({ data: { role: newRole, action: "login", detail: `Signed in as ${newRole}` } });
  };

  const logout = () => {
    if (role) {
      addLog({ data: { role, action: "logout", detail: "Signed out" } });
    }
    setRole(null);
    localStorage.removeItem("sjm_role");
  };

  const logActivity = (action: string, detail: string) => {
    if (role) {
      addLog({ data: { role, action, detail } });
    }
  };

  return (
    <AuthContext.Provider value={{ role, login, logout, logActivity }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
