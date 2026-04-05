// artifacts/api-server/src/lib/pusher.ts
// Server-side Pusher instance used to notify all connected clients
// when data changes. Import `broadcast` into any mutating route.

import Pusher from "pusher";

const {
  PUSHER_APP_ID,
  PUSHER_KEY,
  PUSHER_SECRET,
  PUSHER_CLUSTER,
} = process.env;

if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET || !PUSHER_CLUSTER) {
  throw new Error(
    "Missing Pusher env vars. Set PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER in Vercel.",
  );
}

export const pusher = new Pusher({
  appId: PUSHER_APP_ID,
  key: PUSHER_KEY,
  secret: PUSHER_SECRET,
  cluster: PUSHER_CLUSTER,
  useTLS: true,
});

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Broadcast a data-change event to all connected clients on the
 * "medipoint-sync" Pusher channel.
 *
 * @example
 * await broadcast("products", "created", newProduct);
 * await broadcast("sales", "updated", updatedSale);
 * await broadcast("stock-updates", "deleted", { id });
 */
export async function broadcast(
  entity: SyncEntity,
  event: SyncEvent,
  data: unknown,
): Promise<void> {
  const payload: SyncPayload = {
    entity,
    event,
    data,
    timestamp: Date.now(),
  };

  // Pusher event name: e.g. "products:created"
  await pusher.trigger("medipoint-sync", `${entity}:${event}`, payload);
}
