import { Router, type IRouter } from "express";
import { db, activityLogTable } from "@workspace/db";

const router: IRouter = Router();

function mapEntry(e: typeof activityLogTable.$inferSelect) {
  return {
    id: e.id,
    ts: e.ts,
    role: e.role,
    action: e.action,
    detail: e.detail,
  };
}

router.get("/", async (_req, res) => {
  const entries = await db.select().from(activityLogTable).orderBy(activityLogTable.ts);
  res.json(entries.map(mapEntry));
});

router.post("/entry", async (req, res) => {
  const body = req.body as { role: string; action: string; detail: string };
  const [entry] = await db.insert(activityLogTable).values({
    role: body.role,
    action: body.action,
    detail: body.detail,
  }).returning();
  res.status(201).json(mapEntry(entry));
});

router.delete("/", async (_req, res) => {
  await db.delete(activityLogTable);
  res.json({ success: true });
});

export default router;
