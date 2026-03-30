import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { useGetTransactions, useGetSales } from "@workspace/api-client-react";
import { formatKES } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export default function Reports() {
  const { data: transactions = [] } = useGetTransactions();
  const { data: sales = [] } = useGetSales();

  const totalInc = transactions.reduce((s, t) => s + (t.income || 0), 0);
  const totalExp = transactions.reduce((s, t) => s + (t.expense || 0), 0);
  const net = totalInc - totalExp;

  const byMonth: Record<string, { name: string, income: number, expense: number }> = {};
  transactions.forEach(t => {
    const mk = format(new Date(t.date), "MMM yy");
    if (!byMonth[mk]) byMonth[mk] = { name: mk, income: 0, expense: 0 };
    byMonth[mk].income += (t.income || 0);
    byMonth[mk].expense += (t.expense || 0);
  });
  
  const chartData = Object.values(byMonth);
  let cum = 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-1">Monthly summaries & trends</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5"><div className="text-xs font-bold uppercase text-muted-foreground mb-2">Total Revenue</div><div className="text-2xl font-mono font-bold text-primary">{formatKES(totalInc)}</div></Card>
        <Card className="p-5"><div className="text-xs font-bold uppercase text-muted-foreground mb-2">Total Expenses</div><div className="text-2xl font-mono font-bold text-danger">{formatKES(totalExp)}</div></Card>
        <Card className="p-5"><div className="text-xs font-bold uppercase text-muted-foreground mb-2">Net Profit</div><div className={`text-2xl font-mono font-bold ${net >= 0 ? 'text-primary' : 'text-danger'}`}>{formatKES(net)}</div></Card>
        <Card className="p-5"><div className="text-xs font-bold uppercase text-muted-foreground mb-2">POS Sales</div><div className="text-2xl font-mono font-bold">{sales.length}</div><div className="text-xs text-muted-foreground mt-1">{formatKES(sales.reduce((s,x)=>s+x.total,0))}</div></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Income vs Expenses</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `K${v/1000}k`} />
                  <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} formatter={(v: number) => formatKES(v)} />
                  <Bar dataKey="income" fill="var(--color-primary)" radius={[4,4,0,0]} maxBarSize={40} />
                  <Bar dataKey="expense" fill="var(--color-danger)" radius={[4,4,0,0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Monthly Summary</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Month</th>
                  <th className="px-4 py-3 font-medium text-right">Income</th>
                  <th className="px-4 py-3 font-medium text-right">Expenses</th>
                  <th className="px-4 py-3 font-medium text-right">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {chartData.map(d => {
                  const mNet = d.income - d.expense;
                  cum += mNet;
                  return (
                    <tr key={d.name} className="hover:bg-muted/30">
                      <td className="px-4 py-3">{d.name}</td>
                      <td className="px-4 py-3 font-mono text-right text-primary">{formatKES(d.income)}</td>
                      <td className="px-4 py-3 font-mono text-right text-danger">{formatKES(d.expense)}</td>
                      <td className={`px-4 py-3 font-mono text-right font-bold ${mNet >= 0 ? 'text-primary' : 'text-danger'}`}>{formatKES(mNet)}</td>
                    </tr>
                  )
                })}
                <tr className="bg-muted/50 border-t-2 border-border font-bold">
                  <td className="px-4 py-3">Cumulative</td>
                  <td className="px-4 py-3 font-mono text-right text-primary">{formatKES(totalInc)}</td>
                  <td className="px-4 py-3 font-mono text-right text-danger">{formatKES(totalExp)}</td>
                  <td className={`px-4 py-3 font-mono text-right ${cum >= 0 ? 'text-primary' : 'text-danger'}`}>{formatKES(cum)}</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Full Sales History</CardTitle></CardHeader>
        <CardContent className="p-0 max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border">
              {[...sales].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(s => (
                <tr key={s.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground w-40">{format(new Date(s.createdAt), "dd MMM yy HH:mm")}</td>
                  <td className="px-4 py-3">{s.items.map(i => `${i.productName} ×${i.qty}`).join(", ")}</td>
                  <td className="px-4 py-3 font-mono text-right text-primary font-bold">{formatKES(s.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
