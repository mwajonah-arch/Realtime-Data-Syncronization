import React, { useState } from "react";
import { Search, Plus, Edit2, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

import { useAuth } from "@/contexts/AuthContext";
import { 
  useGetProducts, 
  useCreateProduct, 
  useUpdateProduct, 
  useDeleteProduct,
  getGetProductsQueryKey 
} from "@workspace/api-client-react";
import { formatKES } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";

const productSchema = z.object({
  name: z.string().min(1, "Required"),
  cat: z.string().min(1, "Required"),
  unit: z.string().min(1, "Required"),
  qty: z.coerce.number().min(0),
  low: z.coerce.number().min(0),
  buy: z.coerce.number().min(0),
  sell: z.coerce.number().min(0),
  expiry: z.string(),
  supplier: z.string()
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function Inventory() {
  const { role, logActivity } = useAuth();
  const isAdmin = role === "admin";
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { data: products = [], isLoading } = useGetProducts();
  
  const createMut = useCreateProduct({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
        logActivity("add", `Added product: ${data.name}`);
        setIsModalOpen(false);
      }
    }
  });

  const updateMut = useUpdateProduct({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
        logActivity("edit", `Edited product: ${data.name}`);
        setIsModalOpen(false);
      }
    }
  });

  const deleteMut = useDeleteProduct({
    mutation: {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
        logActivity("delete", `Deleted product ID: ${variables.id}`);
      }
    }
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { cat: "Analgesics", unit: "Tabs", qty: 0, low: 10, buy: 0, sell: 0, expiry: "", supplier: "" }
  });

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.cat.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditingId(null);
    reset({ cat: "Analgesics", unit: "Tabs", qty: 0, low: 10, buy: 0, sell: 0, expiry: "", supplier: "" });
    setIsModalOpen(true);
  };

  const openEdit = (p: any) => {
    setEditingId(p.id);
    reset({
      name: p.name, cat: p.cat, unit: p.unit, qty: p.qty, low: p.low,
      buy: p.buy, sell: p.sell, expiry: p.expiry, supplier: p.supplier
    });
    setIsModalOpen(true);
  };

  const onSubmit = (data: ProductFormValues) => {
    if (editingId) {
      updateMut.mutate({ id: editingId, data });
    } else {
      createMut.mutate({ data });
    }
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Delete "${name}"?`)) {
      deleteMut.mutate({ id });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground mt-1">Current stock levels</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Input 
            placeholder="Search products..." 
            icon={<Search className="w-4 h-4" />}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full sm:w-64"
          />
          {isAdmin && (
            <Button onClick={openAdd}>
              <Plus className="w-4 h-4 mr-2" /> Add Product
            </Button>
          )}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-4 font-medium">Product</th>
                <th className="px-4 py-4 font-medium">Category</th>
                <th className="px-4 py-4 font-medium">Qty</th>
                <th className="px-4 py-4 font-medium">Unit</th>
                {isAdmin && <th className="px-4 py-4 font-medium">Buy Price</th>}
                <th className="px-4 py-4 font-medium">Sell Price</th>
                <th className="px-4 py-4 font-medium">Status</th>
                {isAdmin && <th className="px-4 py-4 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">Loading inventory...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">No products found</td></tr>
              ) : (
                filtered.map(p => {
                  const isLow = p.qty <= p.low;
                  const isOut = p.qty === 0;
                  return (
                    <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-semibold">{p.name}</td>
                      <td className="px-4 py-3"><Badge variant="outline">{p.cat}</Badge></td>
                      <td className={`px-4 py-3 font-mono font-bold ${isOut ? 'text-danger' : isLow ? 'text-warning' : ''}`}>{p.qty}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.unit}</td>
                      {isAdmin && <td className="px-4 py-3 font-mono">{formatKES(p.buy)}</td>}
                      <td className="px-4 py-3 font-mono">{formatKES(p.sell)}</td>
                      <td className="px-4 py-3">
                        {isOut ? <Badge variant="danger">Out of stock</Badge> : 
                         isLow ? <Badge variant="warning">Low stock</Badge> : 
                         <Badge variant="success">In stock</Badge>}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id, p.name)} className="text-danger hover:text-danger hover:bg-danger/10">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? "Edit Product" : "Add Product"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Product Name</label>
              <Input {...register("name")} placeholder="e.g. Paracetamol 500mg" />
              {errors.name && <span className="text-xs text-danger">{errors.name.message}</span>}
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</label>
              <select {...register("cat")} className="flex h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                {["Analgesics","Antibiotics","Antifungals","Vitamins","Antiseptics","Antihistamines","Gastrointestinal","Cardiovascular","Dermatology","Other"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Unit</label>
              <select {...register("unit")} className="flex h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                {["Tabs","Capsules","Bottles","Sachets","Vials","Pieces","Boxes"].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quantity</label>
              <Input type="number" {...register("qty")} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Low Stock Alert</label>
              <Input type="number" {...register("low")} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Buy Price (KES)</label>
              <Input type="number" {...register("buy")} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sell Price (KES)</label>
              <Input type="number" {...register("sell")} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Expiry Date</label>
              <Input type="date" {...register("expiry")} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Supplier</label>
              <Input {...register("supplier")} />
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-3 border-t border-border mt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
              {createMut.isPending || updateMut.isPending ? "Saving..." : "Save Product"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
