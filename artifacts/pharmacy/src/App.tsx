import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";

// Pages
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Inventory from "@/pages/Inventory";
import POS from "@/pages/POS";
import StockUpdate from "@/pages/StockUpdate";
import Financials from "@/pages/Financials";
import EndOfDay from "@/pages/EndOfDay";
import Reports from "@/pages/Reports";
import ActivityLog from "@/pages/ActivityLog";
import MySummary from "@/pages/MySummary";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: 30000, // 30s for real-time feel
      refetchOnWindowFocus: true,
    },
  },
});

function ProtectedRouter() {
  const { role } = useAuth();
  
  if (!role) return <Login />;

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/inventory" component={Inventory} />
        <Route path="/pos" component={POS} />
        <Route path="/stock-update" component={StockUpdate} />
        <Route path="/my-summary" component={MySummary} />
        
        {/* Admin only routes */}
        {role === "admin" && (
          <>
            <Route path="/financials" component={Financials} />
            <Route path="/end-of-day" component={EndOfDay} />
            <Route path="/reports" component={Reports} />
            <Route path="/activity" component={ActivityLog} />
          </>
        )}
        
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <ProtectedRouter />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
