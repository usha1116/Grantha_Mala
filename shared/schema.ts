import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
});

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // stored in cents
  stock: integer("stock").notNull(),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
  categoryId: integer("category_id").references(() => categories.id),
  coverUrl: text("cover_url").notNull(),
});

export const inventoryHistory = pgTable("inventory_history", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").references(() => books.id).notNull(),
  changeAmount: integer("change_amount").notNull(), // positive for additions, negative for removals
  reason: text("reason").notNull(), // e.g. "sale", "restock", "adjustment"
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Keep existing tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  items: jsonb("items").$type<Array<{bookId: number, quantity: number}>>().notNull(),
  customerName: text("customer_name").notNull(),
  address: text("address").notNull(),
  status: text("status", { enum: ["pending", "completed", "cancelled"] }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Zod schemas
export const insertCategorySchema = createInsertSchema(categories);
export const insertBookSchema = createInsertSchema(books);
export const insertInventoryHistorySchema = createInsertSchema(inventoryHistory);
export const insertOrderSchema = createInsertSchema(orders);
export const insertUserSchema = createInsertSchema(users).extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Types
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertBook = z.infer<typeof insertBookSchema>;
export type InsertInventoryHistory = z.infer<typeof insertInventoryHistorySchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type Book = typeof books.$inferSelect;
export type InventoryHistory = typeof inventoryHistory.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type User = typeof users.$inferSelect;