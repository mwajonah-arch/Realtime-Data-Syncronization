import { Router, type IRouter } from "express";
import { db, transactionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function mapTransaction(t: typeof transactionsTable.$inferSelect) {
  return {
    id: t.id,
    date: t.date,
    account: t.account,
    category: t.category,
    desc: t.desc,
    income: Number(t.income),
    expense: Number(t.expense),
    createdAt: t.createdAt,
  };
}

router.get("/", async (_req, res) => {
  const txns = await db.select().from(transactionsTable).orderBy(transactionsTable.date);
  res.json(txns.map(mapTransaction));
});

router.post("/", async (req, res) => {
  const body = req.body as {
    date: string; account: string; category: string;
    desc: string; income: number; expense: number;
  };
  const [txn] = await db.insert(transactionsTable).values({
    date: body.date,
    account: body.account || "",
    category: body.category,
    desc: body.desc,
    income: String(body.income ?? 0),
    expense: String(body.expense ?? 0),
  }).returning();
  res.status(201).json(mapTransaction(txn));
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  await db.delete(transactionsTable).where(eq(transactionsTable.id, id));
  res.json({ success: true });
});

export default router;
