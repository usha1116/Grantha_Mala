import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertBookSchema, insertOrderSchema, insertCategorySchema } from "@shared/schema";

function isAdmin(req: any, res: any, next: any) {
  if (!req.user?.isAdmin) {
    return res.status(403).send("Admin access required");
  }
  next();
}

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Category routes
  app.get("/api/categories", async (_req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.post("/api/categories", isAdmin, async (req, res) => {
    const parsed = insertCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }
    const category = await storage.createCategory(parsed.data);
    res.status(201).json(category);
  });

  app.patch("/api/categories/:id", isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    const category = await storage.getCategory(id);
    if (!category) return res.status(404).send("Category not found");

    const updated = await storage.updateCategory(id, req.body);
    res.json(updated);
  });

  app.delete("/api/categories/:id", isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteCategory(id);
    res.sendStatus(204);
  });

  // Book routes
  app.get("/api/books", async (_req, res) => {
    const books = await storage.getBooks();
    res.json(books);
  });

  app.get("/api/books/low-stock", isAdmin, async (_req, res) => {
    const books = await storage.getBooksWithLowStock();
    res.json(books);
  });

  app.get("/api/books/:id/inventory-history", isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    const history = await storage.getInventoryHistory(id);
    res.json(history);
  });

  app.post("/api/books", isAdmin, async (req, res) => {
    const parsed = insertBookSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }
    const book = await storage.createBook(parsed.data);
    res.status(201).json(book);
  });

  app.patch("/api/books/:id", isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    const book = await storage.getBook(id);
    if (!book) return res.status(404).send("Book not found");

    const updated = await storage.updateBook(id, req.body);
    res.json(updated);
  });

  app.delete("/api/books/:id", isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteBook(id);
    res.sendStatus(204);
  });

  // Order routes
  app.get("/api/orders", isAdmin, async (_req, res) => {
    const orders = await storage.getOrders();
    res.json(orders);
  });

  app.post("/api/orders", async (req, res) => {
    const parsed = insertOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }
    const order = await storage.createOrder(parsed.data);
    res.status(201).json(order);
  });

  app.patch("/api/orders/:id/status", isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    const order = await storage.updateOrderStatus(id, status);
    res.json(order);
  });

  const httpServer = createServer(app);
  return httpServer;
}