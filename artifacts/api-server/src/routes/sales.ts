import { Router, type IRouter } from "express";
import { db, salesTable, productsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

function mapSale(s: typeof salesTable.$inferSelect) {
  return {
    id: s.id,
    items: s.items,
    total: Number(s.total),
    staffRole: s.staffRole,
    createdAt: s.createdAt,
  };
}

router.get("/", async (_req, res) => {
  const sales = await db.select().from(salesTable).orderBy(salesTable.createdAt);
  res.json(sales.map(mapSale));
});

router.post("/", async (req, res) => {
  const body = req.body as {
    items: Array<{ productId: number; productName: string; qty: number; price: number }>;
    total: number;
    staffRole: string;
  };

  const [sale] = await db.insert(salesTable).values({
    items: body.items,
    total: String(body.total),
    staffRole: body.staffRole || "staff",
  }).returning();

  // Decrement stock for each sold item
  for (const item of body.items) {
    await db.update(productsTable)
      .set({ qty: sql`${productsTable.qty} - ${item.qty}` })
      .where(eq(productsTable.id, item.productId));
  }

  res.status(201).json(mapSale(sale));
});

export default router;
