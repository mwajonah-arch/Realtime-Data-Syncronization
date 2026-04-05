// artifacts/api-server/src/routes/stockUpdates.ts

import { Router } from "express";
import { db, schema } from "@workspace/db";
import { eq } from "drizzle-orm";
import { broadcast } from "../lib/pusher.js";

const router = Router();

// GET /api/stock-updates
router.get("/", async (_req, res) => {
  try {
    const rows = await db.select().from(schema.stockUpdates);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stock updates" });
  }
});

// GET /api/stock-updates/:id
router.get("/:id", async (req, res) => {
  try {
    const [row] = await db
      .select()
      .from(schema.stockUpdates)
      .where(eq(schema.stockUpdates.id, Number(req.params.id)));
    if (!row) return res.status(404).json({ error: "Stock update not found" });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stock update" });
  }
});

// POST /api/stock-updates
router.post("/", async (req, res) => {
  try {
    const [created] = await db
      .insert(schema.stockUpdates)
      .values(req.body)
      .returning();

    // 🔔 Notify all connected devices — stock level changed
    await broadcast("stock-updates", "created", created);
    // Also ping products so any product list auto-refreshes stock counts
    await broadcast("products", "updated", { id: created.productId });

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Failed to create stock update" });
  }
});

// PATCH /api/stock-updates/:id
router.patch("/:id", async (req, res) => {
  try {
    const [updated] = await db
      .update(schema.stockUpdates)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(schema.stockUpdates.id, Number(req.params.id)))
      .returning();
    if (!updated) return res.status(404).json({ error: "Stock update not found" });

    // 🔔 Notify all connected devices
    await broadcast("stock-updates", "updated", updated);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update stock update" });
  }
});

// DELETE /api/stock-updates/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(schema.stockUpdates).where(eq(schema.stockUpdates.id, id));

    // 🔔 Notify all connected devices
    await broadcast("stock-updates", "deleted", { id });

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete stock update" });
  }
});

export default router;
