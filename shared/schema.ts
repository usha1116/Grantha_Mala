import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
});

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // stored in cents
  stock: integer("stock").notNull(),
  coverUrl: text("cover_url").notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  items: jsonb("items").$type<Array<{bookId: number, quantity: number}>>().notNull(),
  customerName: text("customer_name").notNull(),
  address: text("address").notNull(),
  status: text("status", { enum: ["pending", "completed", "cancelled"] }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const insertBookSchema = createInsertSchema(books);
export const insertOrderSchema = createInsertSchema(orders);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertBook = z.infer<typeof insertBookSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type User = typeof users.$inferSelect;
export type Book = typeof books.$inferSelect;
export type Order = typeof orders.$inferSelect;
