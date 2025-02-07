import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertBookSchema, insertOrderSchema, insertCategorySchema } from "@shared/schema";

function isAuthenticated(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).send("Authentication required");
  }
  next();
}

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
    if (categories.length === 0) {
      // Add default categories if none exist
      const defaultCategories = [
        { name: "Fiction", description: "Fictional stories and novels" },
        { name: "Non-Fiction", description: "Educational and factual books" },
        { name: "Science Fiction", description: "Futuristic and sci-fi novels" },
        { name: "Fantasy", description: "Fantasy and magical stories" },
        { name: "Mystery", description: "Mystery and detective novels" },
        { name: "Romance", description: "Romance novels and stories" },
        { name: "Children", description: "Books for young readers" },
        { name: "Biography", description: "Life stories and memoirs" }
      ];

      for (const category of defaultCategories) {
        await storage.createCategory(category);
      }
      return res.json(defaultCategories);
    }
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
    const id = req.params.id;
    const category = await storage.getCategory(id);
    if (!category) return res.status(404).send("Category not found");

    const updated = await storage.updateCategory(id, req.body);
    res.json(updated);
  });

  app.delete("/api/categories/:id", isAdmin, async (req, res) => {
    const id = req.params.id;
    await storage.deleteCategory(id);
    res.sendStatus(204);
  });

  // Book routes
  app.get("/api/books", async (_req, res) => {
    // First check if there are any books
    const existingBooks = await storage.getBooks();
    if (existingBooks.length === 0) {
      // Add sample books if none exist
      // Fetch all categories first
      const categories = await storage.getCategories();
      const getCategoryId = (name) => {
        const category = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
        return category?._id;
      };

      const sampleBooks = [
        {
          title: "The Great Gatsby",
          author: "F. Scott Fitzgerald",
          description: "A story of decadence and excess",
          price: 999,
          stock: 10,
          coverUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e",
          categoryId: getCategoryId("Fiction")
        },
        {
          title: "To Kill a Mockingbird",
          author: "Harper Lee",
          description: "A classic of modern American literature",
          price: 1299,
          stock: 7,
          coverUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c",
          categoryId: "classics"
        },
        {
          title: "1984",
          author: "George Orwell",
          description: "A dystopian social science fiction novel",
          price: 1099,
          stock: 15,
          coverUrl: "https://images.unsplash.com/photo-1541963463532-d68292c34b19",
          categoryId: "fiction"
        },
        {
          title: "The Hobbit",
          author: "J.R.R. Tolkien",
          description: "A fantasy novel set in Middle-earth",
          price: 1499,
          stock: 12,
          coverUrl: "https://images.unsplash.com/photo-1629992101753-56d196c8aabb",
          categoryId: "fantasy"
        },
        {
          title: "Dune",
          author: "Frank Herbert",
          description: "A science fiction masterpiece",
          price: 1399,
          stock: 20,
          coverUrl: "https://images.unsplash.com/photo-1589203832113-de6c1c019c6c",
          categoryId: "scifi"
        },
        {
          title: "The Name of the Wind",
          author: "Patrick Rothfuss",
          description: "Epic fantasy tale",
          price: 1599,
          stock: 8,
          coverUrl: "https://images.unsplash.com/photo-1589203832113-de6c1c019c6c",
          categoryId: "fantasy"
        },
        {
          title: "Project Hail Mary",
          author: "Andy Weir",
          description: "Sci-fi adventure in space",
          price: 1699,
          stock: 25,
          coverUrl: "https://images.unsplash.com/photo-1589203832113-de6c1c019c6c",
          categoryId: "scifi"
        },
        {
          title: "Pride and Prejudice",
          author: "Jane Austen",
          description: "A romantic classic",
          price: 999,
          stock: 15,
          coverUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c",
          categoryId: "classics"
        }
      ];

      for (const book of sampleBooks) {
        await storage.createBook(book);
      }
      return res.json(sampleBooks);
    }
    res.json(existingBooks);
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

  app.get("/api/orders/my-orders", isAuthenticated, async (req, res) => {
    const orders = await storage.getOrdersByUser(req.user.id);
    res.json(orders);
  });

  app.patch("/api/orders/:id/status", isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    const { status, paymentStatus } = req.body;
    const order = await storage.updateOrder(id, { status, paymentStatus });
    res.json(order);
  });

  app.get("/api/admin/users", isAdmin, async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users);
  });

  const httpServer = createServer(app);
  return httpServer;
}