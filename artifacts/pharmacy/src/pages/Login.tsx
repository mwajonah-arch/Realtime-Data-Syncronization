import React, { useState } from "react";
import { Shield, User, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export default function Login() {
  const { login } = useAuth();
  const [role, setRole] = useState<"staff" | "admin">("staff");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (role === "admin" && password !== "admin1234") {
      setError("Incorrect password.");
      return;
    }
    
    login(role);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
      
      <div className="w-full max-w-sm bg-surface rounded-2xl shadow-xl border border-border p-8 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">SJ Medipoint</h1>
          <p className="text-sm font-mono text-muted-foreground mt-1">Pharmacy Manager</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 block">
              Sign in as
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("staff")}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200",
                  role === "staff" 
                    ? "border-primary bg-primary-light text-primary" 
                    : "border-border bg-surface text-muted-foreground hover:border-primary/50"
                )}
              >
                <User className="w-6 h-6 mb-2" />
                <span className="font-semibold text-sm">Staff</span>
                <span className="text-[10px] opacity-80 mt-1">POS & Stock</span>
              </button>
              
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200",
                  role === "admin" 
                    ? "border-admin bg-admin-light text-admin" 
                    : "border-border bg-surface text-muted-foreground hover:border-admin/50"
                )}
              >
                <Shield className="w-6 h-6 mb-2" />
                <span className="font-semibold text-sm">Admin</span>
                <span className="text-[10px] opacity-80 mt-1">Full Access</span>
              </button>
            </div>
          </div>

          {role === "admin" && (
            <div className="animate-in slide-in-from-top-2 fade-in duration-200">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Admin Password
              </label>
              <Input
                type="password"
                placeholder="Enter password (admin1234)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>
          )}

          {error && <div className="text-sm text-danger text-center animate-in fade-in">{error}</div>}

          <Button type="submit" className="w-full" size="lg" variant={role === "admin" ? "admin" : "primary"}>
            Continue <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground font-mono">
            Default admin password: <strong className="text-foreground">admin1234</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
