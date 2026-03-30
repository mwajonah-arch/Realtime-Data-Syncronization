import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cat: text("cat").notNull(),
  unit: text("unit").notNull(),
  qty: integer("qty").notNull().default(0),
  low: integer("low").notNull().default(10),
  buy: numeric("buy", { precision: 10, scale: 2 }).notNull().default("0"),
  sell: numeric("sell", { precision: 10, scale: 2 }).notNull().default("0"),
  expiry: text("expiry").notNull().default(""),
  supplier: text("supplier").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
