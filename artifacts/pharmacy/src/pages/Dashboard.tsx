import React from "react";
import { format } from "date-fns";
import { Activity, AlertTriangle, Clock, TrendingUp, PackageSearch, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useGetProducts, useGetSales, useGetTransactions, useGetStockUpdates } from "@workspace/api-client-react";
import { formatKES } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function Dashboard() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const monthStr = format(new Date(), "MMM yyyy");

  const { data: products = [] } = useGetProducts();
  const { data: sales = [] } = useGetSales();
  const { data: transactions = [] } = useGetTransactions();
  const { data: stockUpdates = [] } = useGetStockUpdates();

  const lowStock = products.filter(p => p.qty <= p.low);
  const expSoon = products.filter(p => {
    if (!p.expiry) return false;
    const days = Math.ceil((new Date(p.expiry).getTime() - new Date().getTime()) / 86400000);
    return days <= 30 && days > 0;
  });

  const todaySales = sales.filter(s => s.createdAt.startsWith(todayStr));
  const todayStock = stockUpdates.filter(u => u.createdAt.startsWith(todayStr));
  const monthSales = sales.filter(s => format(new Date(s.createdAt), "MMM yyyy") === monthStr);

  const totalInc = transactions.reduce((sum, t) => sum + (t.income || 0), 0);
  const totalExp = transactions.reduce((sum, t) => sum + (t.expense || 0), 0);
  const netBal = totalInc - totalExp;
  const stockVal = products.reduce((sum, p) => sum + (p.qty * p.sell), 0);

  if (isAdmin) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Full pharmacy overview</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="admin">Admin</Badge>
            <span className="text-sm font-mono text-muted-foreground">{format(new Date(), "EEEE, d MMMM yyyy")}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Income" value={formatKES(totalInc)} sub="All time" valueColor="text-primary" icon={TrendingUp} />
          <StatCard label="Total Expenses" value={formatKES(totalExp)} sub="All time" valueColor="text-danger" icon={ArrowDownRight} />
          <StatCard label="Net Balance" value={formatKES(netBal)} sub="Income − Expenses" valueColor={netBal >= 0 ? "text-primary" : "text-danger"} icon={Activity} />
          <StatCard label="Stock Value" value={formatKES(stockVal)} sub={`${products.length} products`} valueColor="text-admin" icon={PackageSearch} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Low Stock Alerts</CardTitle>
              <AlertTriangle className="w-4 h-4 text-warning" />
            </CardHeader>
            <CardContent className="p-0">
              {lowStock.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="px-4 py-3 font-medium">Product</th>
                        <th className="px-4 py-3 font-medium">Qty</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {lowStock.map(p => (
                        <tr key={p.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium">{p.name}</td>
                          <td className={`px-4 py-3 font-mono ${p.qty === 0 ? "text-danger font-bold" : "text-warning font-bold"}`}>{p.qty}</td>
                          <td className="px-4 py-3">
                            <Badge variant={p.qty === 0 ? "danger" : "warning"}>{p.qty === 0 ? "Out" : "Low"}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState icon={PackageSearch} text="All stock levels are OK" />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Expiring Soon (30 days)</CardTitle>
              <Clock className="w-4 h-4 text-warning" />
            </CardHeader>
            <CardContent className="p-0">
              {expSoon.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="px-4 py-3 font-medium">Product</th>
                        <th className="px-4 py-3 font-medium">Expiry</th>
                        <th className="px-4 py-3 font-medium">Days</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {expSoon.map(p => (
                        <tr key={p.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium">{p.name}</td>
                          <td className="px-4 py-3">{p.expiry ? format(new Date(p.expiry), "dd MMM yyyy") : "—"}</td>
                          <td className="px-4 py-3 font-mono text-warning font-bold">
                            {p.expiry ? Math.ceil((new Date(p.expiry).getTime() - new Date().getTime()) / 86400000) : 0}d
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState icon={Clock} text="No products expiring soon" />
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium text-right">Income</th>
                  <th className="px-4 py-3 font-medium text-right">Expense</th>
                  <th className="px-4 py-3 font-medium text-right">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[...transactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8).map(t => (
                  <tr key={t.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{format(new Date(t.date), "dd MMM yyyy")}</td>
                    <td className="px-4 py-3">{t.desc}</td>
                    <td className="px-4 py-3"><Badge variant="outline">{t.category}</Badge></td>
                    <td className="px-4 py-3 font-mono text-right text-primary">{t.income ? formatKES(t.income) : "—"}</td>
                    <td className="px-4 py-3 font-mono text-right text-danger">{t.expense ? formatKES(t.expense) : "—"}</td>
                    <td className={`px-4 py-3 font-mono text-right font-bold ${t.income - t.expense >= 0 ? "text-primary" : "text-danger"}`}>
                      {formatKES(t.income - t.expense)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transactions.length === 0 && <EmptyState icon={Activity} text="No transactions yet" />}
          </CardContent>
        </Card>
      </div>
    );
  }

  // STAFF DASHBOARD
  const allTodayStockItems = todayStock.flatMap(u => u.items.map(i => ({...i, note: u.note})));
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Good day 👋</h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">{format(new Date(), "EEEE, d MMMM yyyy")}</p>
        </div>
        <Badge variant="success">Staff</Badge>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's Sales" value={formatKES(todaySales.reduce((s,sl)=>s+sl.total,0))} sub={`${todaySales.length} txns`} valueColor="text-primary" />
        <StatCard label="Month's Sales" value={formatKES(monthSales.reduce((s,sl)=>s+sl.total,0))} sub={`${monthSales.length} txns`} valueColor="text-primary" />
        <StatCard label="Stock Updates" value={todayStock.reduce((s,u)=>s+u.items.length,0).toString()} sub="items today" valueColor="text-stock" />
        <StatCard label="Low Stock" value={lowStock.length.toString()} sub="need restock" valueColor="text-warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Today's Sales</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {todaySales.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Time</th>
                    <th className="px-4 py-3 font-medium">Items</th>
                    <th className="px-4 py-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[...todaySales].reverse().slice(0,10).map(s => (
                    <tr key={s.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs">{format(new Date(s.createdAt), "HH:mm")}</td>
                      <td className="px-4 py-3">{s.items.map(i => `${i.productName}×${i.qty}`).join(", ")}</td>
                      <td className="px-4 py-3 font-mono text-right text-primary font-bold">{formatKES(s.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <EmptyState icon={ShoppingCart} text="No sales today yet" />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Stock Added Today</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {allTodayStockItems.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">Added</th>
                    <th className="px-4 py-3 font-medium">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allTodayStockItems.map((i, idx) => (
                    <tr key={idx} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{i.productName}</td>
                      <td className="px-4 py-3 font-mono text-stock font-bold">+{i.qtyAdded}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{i.note || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <EmptyState icon={PackagePlus} text="No stock added today" />}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

function StatCard({ label, value, sub, valueColor, icon: Icon }: any) {
  return (
    <Card className="p-5">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</h3>
        {Icon && <Icon className="w-4 h-4 text-muted-foreground/50" />}
      </div>
      <div className={`text-2xl font-bold font-mono tracking-tighter ${valueColor}`}>{value}</div>
      <p className="text-xs text-muted-foreground font-mono mt-1">{sub}</p>
    </Card>
  );
}

function EmptyState({ icon: Icon, text }: any) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
      <Icon className="w-8 h-8 mb-3 opacity-20" />
      <p className="text-sm">{text}</p>
    </div>
  );
}
