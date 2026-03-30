import React, { useState } from "react";
import { format } from "date-fns";
import { useGetSales, useGetStockUpdates, useGetActivityLog } from "@workspace/api-client-react";
import { formatKES } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";

export default function EndOfDay() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  
  const { data: sales = [] } = useGetSales();
  const { data: stockUpdates = [] } = useGetStockUpdates();
  const { data: log = [] } = useGetActivityLog();

  const dSales = sales.filter(s => s.createdAt.startsWith(date));
  const dStock = stockUpdates.filter(u => u.createdAt.startsWith(date));
  const dLog = log.filter(e => e.ts.startsWith(date));

  const salesTotal = dSales.reduce((sum, s) => sum + s.total, 0);
  const totalItemsSold = dSales.reduce((sum, s) => sum + s.items.reduce((a,i) => a + i.qty, 0), 0);
  const totalStockItems = dStock.reduce((sum, u) => sum + u.items.length, 0);
  const totalStockUnits = dStock.reduce((sum, u) => sum + u.items.reduce((a,i) => a + i.qtyAdded, 0), 0);

  const soldMap: Record<string, { qty: number, revenue: number }> = {};
  dSales.forEach(s => s.items.forEach(i => {
    if (!soldMap[i.productName]) soldMap[i.productName] = { qty: 0, revenue: 0 };
    soldMap[i.productName].qty += i.qty;
    soldMap[i.productName].revenue += (i.price * i.qty);
  }));
  const soldList = Object.entries(soldMap).sort((a,b) => b[1].revenue - a[1].revenue);

  const stockMap: Record<string, number> = {};
  dStock.forEach(u => u.items.forEach(i => {
    stockMap[i.productName] = (stockMap[i.productName] || 0) + i.qtyAdded;
  }));
  const stockList = Object.entries(stockMap).sort((a,b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">End of Day Report</h1>
          <p className="text-muted-foreground mt-1">Daily summary of sales & stock</p>
        </div>
        <Input 
          type="date" 
          value={date} 
          onChange={e => setDate(e.target.value)} 
          className="w-auto shadow-soft"
        />
      </div>

      <div className="bg-gradient-to-br from-primary-light to-surface border border-primary/20 rounded-2xl p-6 shadow-soft">
        <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-4">📅 Summary for {format(new Date(date), "dd MMM yyyy")}</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center"><span className="text-muted-foreground">Total Sales Revenue</span><span className="text-xl font-mono font-bold text-primary">{formatKES(salesTotal)}</span></div>
          <div className="flex justify-between items-center"><span className="text-muted-foreground">Transactions</span><span className="font-mono font-bold">{dSales.length}</span></div>
          <div className="flex justify-between items-center"><span className="text-muted-foreground">Total Items Sold</span><span className="font-mono font-bold">{totalItemsSold} units</span></div>
          <div className="border-t border-primary/10 pt-3 mt-1 flex justify-between items-center"><span className="text-muted-foreground">Stock Batches Received</span><span className="font-mono font-bold text-stock">{dStock.length}</span></div>
          <div className="flex justify-between items-center"><span className="text-muted-foreground">Products Restocked</span><span className="font-mono font-bold text-stock">{totalStockItems} products · {totalStockUnits} units total</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>🛒 Sales Transactions ({dSales.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            {dSales.length > 0 ? (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border">
                  {[...dSales].reverse().map(s => (
                    <tr key={s.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{format(new Date(s.createdAt), "HH:mm")}</td>
                      <td className="px-4 py-3">{s.items.map(i => `${i.productName}×${i.qty}`).join(', ')}</td>
                      <td className="px-4 py-3 font-mono text-right text-primary font-bold">{formatKES(s.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <div className="p-8 text-center text-muted-foreground">No sales recorded on this date</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>📊 Items Sold — Breakdown</CardTitle></CardHeader>
          <CardContent className="p-0">
            {soldList.length > 0 ? (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border">
                  {soldList.map(([name, data]) => (
                    <tr key={name} className="hover:bg-muted/30">
                      <td className="px-4 py-3">{name}</td>
                      <td className="px-4 py-3 font-mono text-right">{data.qty}</td>
                      <td className="px-4 py-3 font-mono text-right text-primary font-medium">{formatKES(data.revenue)}</td>
                    </tr>
                  ))}
                  <tr className="bg-primary/5 font-bold">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 font-mono text-right">{totalItemsSold}</td>
                    <td className="px-4 py-3 font-mono text-right text-primary">{formatKES(salesTotal)}</td>
                  </tr>
                </tbody>
              </table>
            ) : <div className="p-8 text-center text-muted-foreground">No items sold</div>}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>📦 Stock Added</CardTitle></CardHeader>
          <CardContent className="p-0">
            {stockList.length > 0 ? (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border">
                  {stockList.map(([name, added]) => (
                    <tr key={name} className="hover:bg-muted/30">
                      <td className="px-4 py-3">{name}</td>
                      <td className="px-4 py-3 font-mono text-right text-stock font-bold">+{added}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <div className="p-8 text-center text-muted-foreground">No stock received on this date</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
