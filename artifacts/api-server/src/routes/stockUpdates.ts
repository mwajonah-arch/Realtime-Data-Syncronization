import { Router, type IRouter } from "express";
import { db, stockUpdatesTable, productsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

function mapStockUpdate(s: typeof stockUpdatesTable.$inferSelect) {
  return {
    id: s.id,
    note: s.note,
    items: s.items,
    staffRole: s.staffRole,
    createdAt: s.createdAt,
  };
}

router.get("/", async (_req, res) => {
  const updates = await db.select().from(stockUpdatesTable).orderBy(stockUpdatesTable.createdAt);
  res.json(updates.map(mapStockUpdate));
});

router.post("/", async (req, res) => {
  const body = req.body as {
    note: string;
    items: Array<{ productId: number; productName: string; qtyAdded: number }>;
    staffRole: string;
  };

  const [update] = await db.insert(stockUpdatesTable).values({
    note: body.note || "",
    items: body.items,
    staffRole: body.staffRole || "staff",
  }).returning();

  // Increment stock for each item
  for (const item of body.items) {
    if (item.qtyAdded > 0) {
      await db.update(productsTable)
        .set({ qty: sql`${productsTable.qty} + ${item.qtyAdded}` })
        .where(eq(productsTable.id, item.productId));
    }
  }

  res.status(201).json(mapStockUpdate(update));
});

export default router;
