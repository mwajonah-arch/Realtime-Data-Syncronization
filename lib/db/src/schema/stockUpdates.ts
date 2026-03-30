import { pgTable, serial, jsonb, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const stockUpdatesTable = pgTable("stock_updates", {
  id: serial("id").primaryKey(),
  note: text("note").notNull().default(""),
  items: jsonb("items").notNull().$type<Array<{ productId: number; productName: string; qtyAdded: number }>>(),
  staffRole: text("staff_role").notNull().default("staff"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStockUpdateSchema = createInsertSchema(stockUpdatesTable).omit({ id: true, createdAt: true });
export type InsertStockUpdate = z.infer<typeof insertStockUpdateSchema>;
export type StockUpdate = typeof stockUpdatesTable.$inferSelect;
