import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/contexts/AuthContext";
import { useGetTransactions, useCreateTransaction, getGetTransactionsQueryKey } from "@workspace/api-client-react";
import { formatKES, cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";

const txnSchema = z.object({
  date: z.string().min(1),
  account: z.string().min(1),
  category: z.string().min(1),
  desc: z.string().min(1),
  income: z.coerce.number().min(0),
  expense: z.coerce.number().min(0)
});

type TxnFormValues = z.infer<typeof txnSchema>;

export default function Financials() {
  const { logActivity } = useAuth();
  const [tab, setTab] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const queryClient = useQueryClient();
  const { data: transactions = [], isLoading } = useGetTransactions();
  
  const createMut = useCreateTransaction({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getGetTransactionsQueryKey() });
        logActivity("add", `Added transaction: ${data.desc}`);
        setIsModalOpen(false);
      }
    }
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TxnFormValues>({
    resolver: zodResolver(txnSchema),
    defaultValues: { date: format(new Date(), "yyyy-MM-dd"), account: "Cash", category: "Other", income: 0, expense: 0 }
  });

  // Calculate tabs (months)
  const monthMap = new Set<string>();
  transactions.forEach(t => monthMap.add(format(new Date(t.date), "MMM yyyy")));
  const months = ["all", ...Array.from(monthMap).sort((a,b) => new Date(b).getTime() - new Date(a).getTime())];

  let displayTxns = [...transactions].sort((a,b) => a.date.localeCompare(b.date));
  let runningBal = 0;
  
  if (tab !== "all") {
    const tabStart = displayTxns.find(t => format(new Date(t.date), "MMM yyyy") === tab)?.date;
    displayTxns.filter(t => tabStart && t.date < tabStart).forEach(t => {
      runningBal += (t.income || 0) - (t.expense || 0);
    });
    displayTxns = displayTxns.filter(t => format(new Date(t.date), "MMM yyyy") === tab);
  }

  const grouped: Record<string, typeof transactions> = {};
  displayTxns.forEach(t => {
    const mk = format(new Date(t.date), "MMM yyyy");
    if (!grouped[mk]) grouped[mk] = [];
    grouped[mk].push(t);
  });

  const onSubmit = (data: TxnFormValues) => createMut.mutate({ data });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financials</h1>
          <p className="text-muted-foreground mt-1">Income, expenses & ledger</p>
        </div>
        <Button onClick={() => { reset(); setIsModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Transaction
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 p-1 bg-muted/50 rounded-xl border border-border w-fit">
        {months.map(m => (
          <button
            key={m}
            onClick={() => setTab(m)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
              tab === m ? "bg-surface shadow text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {m === "all" ? "All Time" : m}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-4 font-medium">Date</th>
                <th className="px-4 py-4 font-medium">Account</th>
                <th className="px-4 py-4 font-medium">Category</th>
                <th className="px-4 py-4 font-medium">Description</th>
                <th className="px-4 py-4 font-medium text-right">Income</th>
                <th className="px-4 py-4 font-medium text-right">Expense</th>
                <th className="px-4 py-4 font-medium text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Loading ledger...</td></tr>
              ) : Object.keys(grouped).length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No transactions found</td></tr>
              ) : (
                Object.entries(grouped).map(([month, rows]) => {
                  let html = [];
                  let mInc = 0;
                  let mExp = 0;
                  
                  rows.forEach(t => {
                    runningBal += (t.income || 0) - (t.expense || 0);
                    mInc += (t.income || 0);
                    mExp += (t.expense || 0);
                    
                    html.push(
                      <tr key={t.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-mono text-xs">{format(new Date(t.date), "dd MMM yyyy")}</td>
                        <td className="px-4 py-3 text-muted-foreground">{t.account}</td>
                        <td className="px-4 py-3"><Badge variant="outline">{t.category}</Badge></td>
                        <td className="px-4 py-3">{t.desc}</td>
                        <td className="px-4 py-3 font-mono text-right text-primary font-medium">{t.income ? formatKES(t.income) : "—"}</td>
                        <td className="px-4 py-3 font-mono text-right text-danger font-medium">{t.expense ? formatKES(t.expense) : "—"}</td>
                        <td className={`px-4 py-3 font-mono text-right font-bold ${runningBal >= 0 ? 'text-primary' : 'text-danger'}`}>{formatKES(runningBal)}</td>
                      </tr>
                    );
                  });

                  html.push(
                    <tr key={`sum-${month}`} className="bg-primary/5 border-t-2 border-border font-semibold">
                      <td colSpan={4} className="px-4 py-3 text-xs uppercase tracking-wider text-primary">▶ {month} Summary</td>
                      <td className="px-4 py-3 font-mono text-right text-primary">{formatKES(mInc)}</td>
                      <td className="px-4 py-3 font-mono text-right text-danger">{formatKES(mExp)}</td>
                      <td className={`px-4 py-3 font-mono text-right ${mInc - mExp >= 0 ? 'text-primary' : 'text-danger'}`}>{formatKES(mInc - mExp)}</td>
                    </tr>
                  );
                  
                  return html;
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Transaction">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Date</label>
              <Input type="date" {...register("date")} />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Account</label>
              <select {...register("account")} className="flex h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                {["Cash","Checking","Credit","Mobile Money"].map(a => <option key={a}>{a}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</label>
              <select {...register("category")} className="flex h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                {["Stock","Shipping","Rent","Stationery","Development","Salaries","Utilities","Sales","Other"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div className="space-y-1 col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</label>
              <Input {...register("desc")} placeholder="Brief description" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Income (KES)</label>
              <Input type="number" {...register("income")} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Expense (KES)</label>
              <Input type="number" {...register("expense")} />
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-3 border-t border-border mt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createMut.isPending}>{createMut.isPending ? "Saving..." : "Save"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
