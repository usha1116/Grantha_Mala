import { InsertUser, InsertBook, InsertOrder, InsertCategory, InsertInventoryHistory, User, Book, Order, Category, InventoryHistory } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Book management
  getBooks(): Promise<Book[]>;
  getBook(id: number): Promise<Book | undefined>;
  createBook(book: InsertBook): Promise<Book>;
  updateBook(id: number, book: Partial<InsertBook>): Promise<Book>;
  deleteBook(id: number): Promise<void>;
  getBooksWithLowStock(): Promise<Book[]>;
  
  // Category management
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: number): Promise<void>;
  
  // Inventory history
  getInventoryHistory(bookId: number): Promise<InventoryHistory[]>;
  recordInventoryChange(change: InsertInventoryHistory): Promise<InventoryHistory>;
  
  // Order management
  getOrders(): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: Order['status']): Promise<Order>;
  
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private books: Map<number, Book>;
  private orders: Map<number, Order>;
  private categories: Map<number, Category>;
  private inventoryHistory: Map<number, InventoryHistory>;
  private currentId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.books = new Map();
    this.orders = new Map();
    this.categories = new Map();
    this.inventoryHistory = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    // Seed initial categories
    const initialCategories: InsertCategory[] = [
      { name: "Fiction", description: "Fictional literature" },
      { name: "Non-Fiction", description: "Educational and informative books" },
      { name: "Science", description: "Scientific publications" },
    ];
    initialCategories.forEach(cat => this.createCategory(cat));

    // Seed initial books
    const sampleBooks: InsertBook[] = [
      {
        title: "The Evolution of Everything",
        author: "Matt Ridley",
        description: "How ideas emerge",
        price: 1999,
        stock: 10,
        lowStockThreshold: 5,
        categoryId: 2, // Non-Fiction
        coverUrl: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73",
      },
      {
        title: "The Psychology of Money",
        author: "Morgan Housel",
        description: "Timeless lessons on wealth, greed, and happiness",
        price: 1499,
        stock: 15,
        lowStockThreshold: 7,
        categoryId: 2, // Non-Fiction
        coverUrl: "https://images.unsplash.com/photo-1592496431122-2349e0fbc666",
      },
    ];
    sampleBooks.forEach(book => this.createBook(book));
  }

  // Existing methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id, isAdmin: false };
    this.users.set(id, user);
    return user;
  }

  // Updated and new book methods
  async getBooks(): Promise<Book[]> {
    return Array.from(this.books.values());
  }

  async getBook(id: number): Promise<Book | undefined> {
    return this.books.get(id);
  }

  async createBook(insertBook: InsertBook): Promise<Book> {
    const id = this.currentId++;
    const book: Book = { ...insertBook, id };
    this.books.set(id, book);
    
    // Record initial stock
    await this.recordInventoryChange({
      bookId: id,
      changeAmount: insertBook.stock,
      reason: "initial stock",
    });
    
    return book;
  }

  async updateBook(id: number, updateBook: Partial<InsertBook>): Promise<Book> {
    const book = await this.getBook(id);
    if (!book) throw new Error("Book not found");
    
    // If stock is being updated, record the change
    if (updateBook.stock !== undefined) {
      const stockChange = updateBook.stock - book.stock;
      if (stockChange !== 0) {
        await this.recordInventoryChange({
          bookId: id,
          changeAmount: stockChange,
          reason: "manual adjustment",
        });
      }
    }
    
    const updatedBook = { ...book, ...updateBook };
    this.books.set(id, updatedBook);
    return updatedBook;
  }

  async deleteBook(id: number): Promise<void> {
    this.books.delete(id);
  }

  async getBooksWithLowStock(): Promise<Book[]> {
    return Array.from(this.books.values()).filter(
      book => book.stock <= book.lowStockThreshold
    );
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.currentId++;
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: number, updateCategory: Partial<InsertCategory>): Promise<Category> {
    const category = await this.getCategory(id);
    if (!category) throw new Error("Category not found");
    
    const updatedCategory = { ...category, ...updateCategory };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<void> {
    this.categories.delete(id);
  }

  // Inventory history methods
  async getInventoryHistory(bookId: number): Promise<InventoryHistory[]> {
    return Array.from(this.inventoryHistory.values())
      .filter(history => history.bookId === bookId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async recordInventoryChange(insertHistory: InsertInventoryHistory): Promise<InventoryHistory> {
    const id = this.currentId++;
    const history: InventoryHistory = {
      ...insertHistory,
      id,
      createdAt: new Date(),
    };
    this.inventoryHistory.set(id, history);
    return history;
  }

  // Existing order methods
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.currentId++;
    const order: Order = {
      ...insertOrder,
      id,
      createdAt: new Date(),
    };
    this.orders.set(id, order);
    
    // Update stock levels and record changes
    for (const item of order.items) {
      const book = await this.getBook(item.bookId);
      if (!book) throw new Error(`Book ${item.bookId} not found`);
      if (book.stock < item.quantity) throw new Error(`Insufficient stock for book ${book.title}`);
      
      await this.updateBook(item.bookId, { stock: book.stock - item.quantity });
      await this.recordInventoryChange({
        bookId: item.bookId,
        changeAmount: -item.quantity,
        reason: `order #${id}`,
      });
    }
    
    return order;
  }

  async updateOrderStatus(id: number, status: Order['status']): Promise<Order> {
    const order = this.orders.get(id);
    if (!order) throw new Error("Order not found");
    
    // If cancelling the order, restore the stock
    if (status === "cancelled" && order.status !== "cancelled") {
      for (const item of order.items) {
        const book = await this.getBook(item.bookId);
        if (!book) continue;
        
        await this.updateBook(item.bookId, { stock: book.stock + item.quantity });
        await this.recordInventoryChange({
          bookId: item.bookId,
          changeAmount: item.quantity,
          reason: `order #${id} cancelled`,
        });
      }
    }
    
    const updatedOrder = { ...order, status };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }
}

export const storage = new MemStorage();
