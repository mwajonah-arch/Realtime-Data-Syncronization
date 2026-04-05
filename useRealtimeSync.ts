// lib/api-client-react/src/hooks/useRealtimeSync.ts
//
// Subscribes to Pusher and invalidates React Query caches automatically
// when any device mutates data. Drop this into any page component.
//
// ── Quick start ──────────────────────────────────────────────────────────────
//
//   // Watch specific entities:
//   useRealtimeSync(["products", "sales"]);
//
//   // Watch everything (great for dashboards):
//   useRealtimeSync();
//
//   // Your existing React Query hooks auto-refetch when data changes:
//   const { data: products } = useGetProducts();
//   const { data: sales } = useGetSales();
//
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Pusher, { type Channel } from "pusher-js";

// All entities that broadcast sync events
export type SyncEntity =
  | "products"
  | "sales"
  | "stock-updates"
  | "transactions"
  | "activity-log";

export type SyncEvent = "created" | "updated" | "deleted";

export interface SyncPayload {
  entity: SyncEntity;
  event: SyncEvent;
  data: unknown;
  timestamp: number;
}

const ALL_ENTITIES: SyncEntity[] = [
  "products",
  "sales",
  "stock-updates",
  "transactions",
  "activity-log",
];

// Pusher singleton — one connection for the whole app session
let _pusher: Pusher | null = null;

function getPusher(): Pusher {
  if (!_pusher) {
    const key = import.meta.env.VITE_PUSHER_KEY as string | undefined;
    const cluster = import.meta.env.VITE_PUSHER_CLUSTER as string | undefined;

    if (!key || !cluster) {
      throw new Error(
        "Set VITE_PUSHER_KEY and VITE_PUSHER_CLUSTER in your .env file",
      );
    }

    _pusher = new Pusher(key, { cluster, forceTLS: true });
  }
  return _pusher;
}

/**
 * Subscribe to real-time sync events for the given entities.
 * Invalidates React Query caches on every create/update/delete
 * so all components showing that data automatically refetch.
 *
 * @param entities - which entities to watch. Omit to watch all.
 */
export function useRealtimeSync(entities: SyncEntity[] = ALL_ENTITIES): void {
  const queryClient = useQueryClient();
  // Stable ref so we don't recreate the effect when the array identity changes
  const entitiesRef = useRef(entities);
  entitiesRef.current = entities;

  useEffect(() => {
    const pusher = getPusher();
    const channel: Channel = pusher.subscribe("medipoint-sync");

    const handlers = new Map<string, (payload: SyncPayload) => void>();

    for (const entity of entitiesRef.current) {
      for (const event of ["created", "updated", "deleted"] as SyncEvent[]) {
        const eventName = `${entity}:${event}`;

        const handler = (payload: SyncPayload) => {
          // Invalidate the React Query cache for this entity.
          // Any active useQuery with [entity] as the first key will refetch.
          queryClient.invalidateQueries({ queryKey: [payload.entity] });

          if (process.env.NODE_ENV === "development") {
            console.debug(`[medipoint-sync] ${eventName}`, payload.data);
          }
        };

        handlers.set(eventName, handler);
        channel.bind(eventName, handler);
      }
    }

    return () => {
      handlers.forEach((handler, eventName) => {
        channel.unbind(eventName, handler);
      });
      pusher.unsubscribe("medipoint-sync");
    };
  }, [queryClient]); // entities intentionally via ref — stable identity
}
