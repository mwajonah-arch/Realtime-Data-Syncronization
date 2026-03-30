import React from "react";
import { format } from "date-fns";
import { useGetSales, useGetStockUpdates, useGetProducts } from "@workspace/api-client-react";
import { formatKES } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Package, ShoppingCart } from "lucide-react";

export default function MySummary() {
  const { data: sales = [] } = useGetSales();
  const { data: stockUpdates = [] } = useGetStockUpdates();
  const { data: products = [] } = useGetProducts();

  const thisMonth = format(new Date(), "MMM yyyy");
  
  // We assume all data is visible to the staff member as "their summary" for the prototype
  // In a real app we'd filter by user ID.
  const monthSales = sales.filter(s => format(new Date(s.createdAt), "MMM yyyy") === thisMonth);
  const monthStock = stockUpdates.filter(u => format(new Date(u.createdAt), "MMM yyyy") === thisMonth);
  const stockVal = products.reduce((s, p) => s + (p.qty * p.sell), 0);
  
  const allStockItems = monthStock.flatMap(u => u.items.map(i => ({ ...i, date: u.createdAt, note: u.note })));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Summary</h1>
          <p className="text-muted-foreground mt-1">Your sales & stock updates this month</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5"><div className="text-xs font-bold uppercase text-muted-foreground mb-2">Sales This Month</div><div className="text-2xl font-mono font-bold text-primary">{formatKES(monthSales.reduce((s,sl)=>s+sl.total,0))}</div><div className="text-xs text-muted-foreground mt-1">{monthSales.length} txns</div></Card>
        <Card className="p-5"><div className="text-xs font-bold uppercase text-muted-foreground mb-2">All-Time Sales</div><div className="text-2xl font-mono font-bold text-primary">{formatKES(sales.reduce((s,sl)=>s+sl.total,0))}</div><div className="text-xs text-muted-foreground mt-1">{sales.length} txns</div></Card>
        <Card className="p-5"><div className="text-xs font-bold uppercase text-muted-foreground mb-2">Stock Updates</div><div className="text-2xl font-mono font-bold text-stock">{monthStock.reduce((s,u)=>s+u.items.length,0)}</div><div className="text-xs text-muted-foreground mt-1">products restocked</div></Card>
        <Card className="p-5"><div className="text-xs font-bold uppercase text-muted-foreground mb-2">Total Stock Value</div><div className="text-2xl font-mono font-bold text-admin">{formatKES(stockVal)}</div><div className="text-xs text-muted-foreground mt-1">{products.length} items</div></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Sales This Month</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {monthSales.length > 0 ? (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border">
                  {[...monthSales].reverse().map(s => (
                    <tr key={s.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{format(new Date(s.createdAt), "dd MMM HH:mm")}</td>
                      <td className="px-4 py-3">{s.items.map(i => `${i.productName}×${i.qty}`).join(", ")}</td>
                      <td className="px-4 py-3 font-mono text-right text-primary font-bold">{formatKES(s.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                <ShoppingCart className="w-8 h-8 mb-3 opacity-20" />
                <p className="text-sm">No sales this month</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Stock Updates This Month</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {allStockItems.length > 0 ? (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border">
                  {[...allStockItems].reverse().map((i, idx) => (
                    <tr key={idx} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{format(new Date(i.date), "dd MMM HH:mm")}</td>
                      <td className="px-4 py-3 font-medium">{i.productName}</td>
                      <td className="px-4 py-3 font-mono text-right text-stock font-bold">+{i.qtyAdded}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                <Package className="w-8 h-8 mb-3 opacity-20" />
                <p className="text-sm">No stock updates this month</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
