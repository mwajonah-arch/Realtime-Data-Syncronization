import { Router, type IRouter } from "express";
import { db, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function mapProduct(p: typeof productsTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    cat: p.cat,
    unit: p.unit,
    qty: p.qty,
    low: p.low,
    buy: Number(p.buy),
    sell: Number(p.sell),
    expiry: p.expiry,
    supplier: p.supplier,
    createdAt: p.createdAt,
  };
}

router.get("/", async (_req, res) => {
  const products = await db.select().from(productsTable).orderBy(productsTable.name);
  res.json(products.map(mapProduct));
});

router.post("/", async (req, res) => {
  const body = req.body as {
    name: string; cat: string; unit: string; qty: number; low: number;
    buy: number; sell: number; expiry: string; supplier: string;
  };
  const [product] = await db.insert(productsTable).values({
    name: body.name,
    cat: body.cat,
    unit: body.unit,
    qty: body.qty ?? 0,
    low: body.low ?? 10,
    buy: String(body.buy ?? 0),
    sell: String(body.sell ?? 0),
    expiry: body.expiry ?? "",
    supplier: body.supplier ?? "",
  }).returning();
  res.status(201).json(mapProduct(product));
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  const body = req.body as {
    name: string; cat: string; unit: string; qty: number; low: number;
    buy: number; sell: number; expiry: string; supplier: string;
  };
  const [product] = await db.update(productsTable).set({
    name: body.name,
    cat: body.cat,
    unit: body.unit,
    qty: body.qty ?? 0,
    low: body.low ?? 10,
    buy: String(body.buy ?? 0),
    sell: String(body.sell ?? 0),
    expiry: body.expiry ?? "",
    supplier: body.supplier ?? "",
  }).where(eq(productsTable.id, id)).returning();
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }
  res.json(mapProduct(product));
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  await db.delete(productsTable).where(eq(productsTable.id, id));
  res.json({ success: true });
});

export default router;
