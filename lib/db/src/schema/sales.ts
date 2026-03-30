import { pgTable, serial, jsonb, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const salesTable = pgTable("sales", {
  id: serial("id").primaryKey(),
  items: jsonb("items").notNull().$type<Array<{ productId: number; productName: string; qty: number; price: number }>>(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull().default("0"),
  staffRole: text("staff_role").notNull().default("staff"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSaleSchema = createInsertSchema(salesTable).omit({ id: true, createdAt: true });
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type Sale = typeof salesTable.$inferSelect;
