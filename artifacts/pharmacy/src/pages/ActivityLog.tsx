import React from "react";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetActivityLog, useClearActivityLog, getGetActivityLogQueryKey } from "@workspace/api-client-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function ActivityLog() {
  const queryClient = useQueryClient();
  const { data: log = [], isLoading } = useGetActivityLog();
  const clearMut = useClearActivityLog({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetActivityLogQueryKey() });
      }
    }
  });

  const handleClear = () => {
    if (confirm("Clear all activity log?")) clearMut.mutate();
  };

  const getIcon = (action: string) => {
    switch(action) {
      case 'sale': return '🛒';
      case 'edit': return '✏️';
      case 'delete': return '🗑️';
      case 'add': return '➕';
      case 'login': return '🔑';
      case 'logout': return '🚪';
      case 'stock': return '📦';
      default: return '◉';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Activity</h1>
          <p className="text-muted-foreground mt-1">All actions across the system</p>
        </div>
        <Button variant="danger" onClick={handleClear} disabled={log.length === 0 || clearMut.isPending}>
          <Trash2 className="w-4 h-4 mr-2" /> Clear Log
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-4 font-medium">Time</th>
                <th className="px-4 py-4 font-medium">Role</th>
                <th className="px-4 py-4 font-medium">Action</th>
                <th className="px-4 py-4 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
              ) : log.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">No activity yet</td></tr>
              ) : (
                [...log].sort((a,b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()).map(e => (
                  <tr key={e.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">{format(new Date(e.ts), "dd MMM HH:mm")}</td>
                    <td className="px-4 py-3">
                      <Badge variant={e.role === 'admin' ? 'admin' : 'success'}>{e.role}</Badge>
                    </td>
                    <td className="px-4 py-3 font-medium capitalize">{getIcon(e.action)} {e.action}</td>
                    <td className="px-4 py-3 text-muted-foreground">{e.detail}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
