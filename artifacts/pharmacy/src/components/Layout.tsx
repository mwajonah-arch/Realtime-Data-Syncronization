import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  PackagePlus, 
  CalendarCheck, 
  BadgeDollarSign, 
  BarChart3, 
  Activity,
  LogOut,
  Key,
  Menu,
  X
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: React.ReactNode }) {
  const { role, logout } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = role === "admin";

  const navItems = isAdmin ? [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Inventory", href: "/inventory", icon: Package },
    { label: "Point of Sale", href: "/pos", icon: ShoppingCart },
    { label: "End of Day", href: "/end-of-day", icon: CalendarCheck, admin: true },
    { label: "Financials", href: "/financials", icon: BadgeDollarSign, admin: true },
    { label: "Reports", href: "/reports", icon: BarChart3, admin: true },
    { label: "Staff Activity", href: "/activity", icon: Activity, admin: true },
  ] : [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Point of Sale", href: "/pos", icon: ShoppingCart },
    { label: "Add Stock", href: "/stock-update", icon: PackagePlus },
    { label: "Inventory", href: "/inventory", icon: Package },
    { label: "My Summary", href: "/my-summary", icon: BarChart3 },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      {/* Mobile Topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-surface border-b border-border z-40 flex items-center px-4 justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-1 -ml-1 text-foreground">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-lg tracking-tight">SJ Medipoint</span>
        </div>
        <span className={cn(
          "text-[10px] font-mono font-bold px-2 py-1 rounded-full",
          isAdmin ? "bg-admin-light text-admin" : "bg-primary-light text-primary"
        )}>
          {isAdmin ? "ADMIN" : "STAFF"}
        </span>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:sticky top-0 left-0 h-[100dvh] w-64 bg-surface border-r border-border z-50 flex flex-col transition-transform duration-300 ease-in-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-6 border-b border-border flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-tight">SJ Medipoint</h1>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">Pharmacy Manager</p>
          </div>
          <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 pt-2 pb-1">
            {isAdmin ? "General" : "Quick Links"}
          </div>
          {navItems.map((item) => {
            const isActive = location === item.href;
            if (item.admin && !isAdmin) return null;
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                isActive 
                  ? item.admin ? "bg-admin-light text-admin" : "bg-primary-light text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )} onClick={() => setSidebarOpen(false)}>
                <item.icon className={cn("w-4 h-4", isActive ? "" : "opacity-70 group-hover:opacity-100")} />
                {item.label}
                {item.admin && (
                  <span className="ml-auto text-[9px] font-mono bg-admin-light text-admin px-1.5 py-0.5 rounded">ADMIN</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 p-2 bg-muted rounded-xl border border-border mb-3">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0",
              isAdmin ? "bg-admin" : "bg-primary"
            )}>
              {isAdmin ? "AD" : "ST"}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{isAdmin ? "Administrator" : "Staff Member"}</div>
              <div className="text-[10px] text-muted-foreground truncate">{isAdmin ? "Full Access" : "Limited Access"}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 px-2">
            <button 
              onClick={logout}
              className="text-xs flex items-center gap-1.5 text-muted-foreground hover:text-danger transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-x-hidden pt-14 md:pt-0 pb-16 md:pb-0">
        <div className="max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in duration-300">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav (Staff Only) */}
      {!isAdmin && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-40 pb-safe">
          <div className="flex items-center justify-around p-2">
            {[
              { id: "/", icon: LayoutDashboard, label: "Home" },
              { id: "/pos", icon: ShoppingCart, label: "Sell" },
              { id: "/stock-update", icon: PackagePlus, label: "Stock" },
              { id: "/inventory", icon: Package, label: "Items" },
              { id: "/my-summary", icon: BarChart3, label: "Summary" }
            ].map(item => (
              <Link key={item.id} href={item.id} className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg min-w-[60px]",
                location === item.id ? "text-primary" : "text-muted-foreground"
              )}>
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
