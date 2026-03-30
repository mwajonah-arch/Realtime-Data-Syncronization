import React, { useState } from "react";
import { Search, ShoppingCart, Minus, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { 
  useGetProducts, 
  useCreateSale, 
  useUpdateProduct,
  getGetProductsQueryKey,
  getGetSalesQueryKey
} from "@workspace/api-client-react";
import { formatKES, cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  unit: string;
  maxQty: number;
}

export default function POS() {
  const { role, logActivity } = useAuth();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const queryClient = useQueryClient();
  const { data: products = [] } = useGetProducts();
  
  const createSaleMut = useCreateSale({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSalesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
      }
    }
  });
  const updateProductMut = useUpdateProduct();

  const availableProducts = products.filter(p => p.qty > 0);
  const filtered = availableProducts.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.cat.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (p: any) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === p.id);
      if (existing) {
        if (existing.qty >= p.qty) return prev; // max stock
        return prev.map(c => c.id === p.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { id: p.id, name: p.name, price: p.sell, qty: 1, unit: p.unit, maxQty: p.qty }];
    });
  };

  const changeQty = (id: number, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.id === id) {
        const newQty = c.qty + delta;
        if (newQty <= 0) return { ...c, qty: 0 }; // handled in filter
        if (newQty > c.maxQty) return c;
        return { ...c, qty: newQty };
      }
      return c;
    }).filter(c => c.qty > 0));
  };

  const cartTotal = cart.reduce((sum, c) => sum + (c.price * c.qty), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    // We create the sale
    createSaleMut.mutate({
      data: {
        total: cartTotal,
        staffRole: role || "staff",
        items: cart.map(c => ({
          productId: c.id,
          productName: c.name,
          price: c.price,
          qty: c.qty
        }))
      }
    });

    // We also need to update product quantities. In a real app this is a single transaction backend-side.
    // For this prototype, we'll fire individual updates.
    for (const item of cart) {
      const p = products.find(x => x.id === item.id);
      if (p) {
        updateProductMut.mutate({
          id: p.id,
          data: { ...p, qty: p.qty - item.qty }
        });
      }
    }

    logActivity("sale", `Sale ${formatKES(cartTotal)} — ${cart.map(c => `${c.name} ×${c.qty}`).join(", ")}`);
    setCart([]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.20))] md:h-[calc(100vh-theme(spacing.10))] space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Point of Sale</h1>
          <p className="text-muted-foreground mt-1">Record a sale</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6">
        {/* Products Grid */}
        <div className="flex-1 flex flex-col min-h-0">
          <Input 
            placeholder="Search products..." 
            icon={<Search className="w-4 h-4" />}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="mb-4 shrink-0 shadow-soft"
          />
          <div className="flex-1 overflow-y-auto pb-4 scrollbar-hide">
            {filtered.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filtered.map(p => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="flex flex-col text-left bg-surface border border-border rounded-xl p-4 shadow-soft hover:shadow-hover hover:border-primary transition-all active:scale-[0.98] group"
                  >
                    <span className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">{p.name}</span>
                    <span className="font-mono font-bold text-primary mb-2 mt-auto">{formatKES(p.sell)}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Stock: {p.qty} {p.unit}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Search className="w-8 h-8 mb-2 opacity-20" />
                <p>No products found in stock</p>
              </div>
            )}
          </div>
        </div>

        {/* Cart Sidebar */}
        <Card className="w-full lg:w-96 flex flex-col shrink-0 h-[400px] lg:h-full shadow-hover">
          <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
            <h2 className="font-bold flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" /> Current Sale
            </h2>
            <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">
              {cart.reduce((s,c) => s+c.qty, 0)} items
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mb-4 opacity-10" />
                <p className="text-sm">Tap products to add to cart</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-lg animate-in fade-in">
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="text-sm font-semibold truncate">{c.name}</div>
                      <div className="text-xs font-mono text-primary mt-0.5">{formatKES(c.price * c.qty)}</div>
                    </div>
                    <div className="flex items-center gap-2 bg-surface border border-border rounded-md p-1 shrink-0">
                      <button onClick={() => changeQty(c.id, -1)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-mono text-sm font-bold">{c.qty}</span>
                      <button onClick={() => changeQty(c.id, 1)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border bg-muted/20">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Total</span>
              <span className="text-2xl font-mono font-bold text-primary">{formatKES(cartTotal)}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <Button variant="outline" className="col-span-1" onClick={() => setCart([])} disabled={cart.length === 0}>
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button 
                className="col-span-3" 
                size="lg" 
                onClick={handleCheckout} 
                disabled={cart.length === 0 || createSaleMut.isPending}
              >
                {createSaleMut.isPending ? "Processing..." : (
                  <><CheckCircle2 className="w-5 h-5 mr-2" /> Complete Sale</>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
