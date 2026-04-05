// artifacts/api-server/src/routes/products.ts
// ─── Changes from original ───────────────────────────────────────────────────
//  + import { broadcast } from "../lib/pusher.js"
//  + await broadcast("products", "created" | "updated" | "deleted", data)
//    added after each successful DB write.
// Everything else (validation, DB calls, error handling) stays as-is.
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from "express";
import { db, schema } from "@workspace/db";
import { eq } from "drizzle-orm";
import { broadcast } from "../lib/pusher.js";

const router = Router();

// GET /api/products
router.get("/", async (_req, res) => {
  try {
    const rows = await db.select().from(schema.products);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
  try {
    const [row] = await db
      .select()
      .from(schema.products)
      .where(eq(schema.products.id, Number(req.params.id)));
    if (!row) return res.status(404).json({ error: "Product not found" });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// POST /api/products
router.post("/", async (req, res) => {
  try {
    const [created] = await db
      .insert(schema.products)
      .values(req.body)
      .returning();

    // 🔔 Notify all connected devices
    await broadcast("products", "created", created);

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Failed to create product" });
  }
});

// PATCH /api/products/:id
router.patch("/:id", async (req, res) => {
  try {
    const [updated] = await db
      .update(schema.products)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(schema.products.id, Number(req.params.id)))
      .returning();
    if (!updated) return res.status(404).json({ error: "Product not found" });

    // 🔔 Notify all connected devices
    await broadcast("products", "updated", updated);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update product" });
  }
});

// DELETE /api/products/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(schema.products).where(eq(schema.products.id, id));

    // 🔔 Notify all connected devices
    await broadcast("products", "deleted", { id });

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;
