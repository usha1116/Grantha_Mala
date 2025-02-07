import { z } from "zod";

export const categories = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
});

export const books = z.object({
  id: z.string(),
  title: z.string(),
  author: z.string(),
  description: z.string(),
  price: z.number(),
  stock: z.number(),
  lowStockThreshold: z.number().default(5),
  categoryId: z.string(),
  coverUrl: z.string(),
});

export const inventoryHistory = z.object({
  id: z.string(),
  bookId: z.string(),
  changeAmount: z.number(),
  reason: z.string(),
  createdAt: z.date(),
});

export const users = z.object({
  id: z.string(),
  username: z.string(),
  password: z.string(),
  isAdmin: z.boolean().default(false),
});

export const orders = z.object({
  id: z.string(),
  items: z.array(z.object({
    bookId: z.string(),
    quantity: z.number(),
  })),
  customerName: z.string(),
  address: z.string(),
  status: z.enum(["pending", "completed", "cancelled"]),
  createdAt: z.date(),
});

// Zod schemas
export const insertCategorySchema = categories.omit({ id: true });
export const insertBookSchema = books.omit({ id: true });
export const insertInventoryHistorySchema = inventoryHistory.omit({ id: true, createdAt: true });
export const insertOrderSchema = orders.omit({ id: true, createdAt: true });
export const insertUserSchema = users.omit({ id: true }).extend({
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

export type Category = z.infer<typeof categories>;
export type Book = z.infer<typeof books>;
export type InventoryHistory = z.infer<typeof inventoryHistory>;
export type Order = z.infer<typeof orders>;
export type User = z.infer<typeof users>;