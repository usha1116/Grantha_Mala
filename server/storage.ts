import session from "express-session";
import createMemoryStore from "memorystore";
import { Book, Category, Order, User, InventoryHistory } from "./models";
import type { InsertUser, InsertBook, InsertOrder, InsertCategory, InsertInventoryHistory } from "@shared/schema";
import type { IStorage } from "./storage";

const MemoryStore = createMemoryStore(session);

export class MongoDBStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    const user = await User.findById(id).lean();
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await User.findOne({ username }).lean();
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user = new User(insertUser);
    await user.save();
    return user.toObject();
  }

  // Book management
  async getBooks(): Promise<Book[]> {
    return Book.find().lean();
  }

  async getBook(id: number): Promise<Book | undefined> {
    const book = await Book.findById(id).lean();
    return book || undefined;
  }

  async createBook(insertBook: InsertBook): Promise<Book> {
    const book = new Book(insertBook);
    await book.save();

    // Record initial stock
    await this.recordInventoryChange({
      bookId: book._id,
      changeAmount: insertBook.stock,
      reason: "initial stock",
    });

    return book.toObject();
  }

  async updateBook(id: number, updateBook: Partial<InsertBook>): Promise<Book> {
    const book = await Book.findById(id);
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

    Object.assign(book, updateBook);
    await book.save();
    return book.toObject();
  }

  async deleteBook(id: number): Promise<void> {
    await Book.findByIdAndDelete(id);
  }

  async getBooksWithLowStock(): Promise<Book[]> {
    return Book.find({
      $expr: {
        $lte: ["$stock", "$lowStockThreshold"]
      }
    }).lean();
  }

  // Category management
  async getCategories(): Promise<Category[]> {
    return Category.find().lean();
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const category = await Category.findById(id).lean();
    return category || undefined;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const category = new Category(insertCategory);
    await category.save();
    return category.toObject();
  }

  async updateCategory(id: number, updateCategory: Partial<InsertCategory>): Promise<Category> {
    const category = await Category.findById(id);
    if (!category) throw new Error("Category not found");

    Object.assign(category, updateCategory);
    await category.save();
    return category.toObject();
  }

  async deleteCategory(id: number): Promise<void> {
    await Category.findByIdAndDelete(id);
  }

  // Inventory history
  async getInventoryHistory(bookId: number): Promise<InventoryHistory[]> {
    return InventoryHistory.find({ bookId })
      .sort({ createdAt: -1 })
      .lean();
  }

  async recordInventoryChange(insertHistory: InsertInventoryHistory): Promise<InventoryHistory> {
    const history = new InventoryHistory(insertHistory);
    await history.save();
    return history.toObject();
  }

  // Order management
  async getOrders(): Promise<Order[]> {
    return Order.find().lean();
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const order = new Order(insertOrder);

    // Update stock levels and record changes
    for (const item of order.items) {
      const book = await Book.findById(item.bookId);
      if (!book) throw new Error(`Book ${item.bookId} not found`);
      if (book.stock < item.quantity) throw new Error(`Insufficient stock for book ${book.title}`);

      book.stock -= item.quantity;
      await book.save();

      await this.recordInventoryChange({
        bookId: item.bookId,
        changeAmount: -item.quantity,
        reason: `order #${order._id}`,
      });
    }

    await order.save();
    return order.toObject();
  }

  async updateOrderStatus(id: number, status: Order['status']): Promise<Order> {
    const order = await Order.findById(id);
    if (!order) throw new Error("Order not found");

    // If cancelling the order, restore the stock
    if (status === "cancelled" && order.status !== "cancelled") {
      for (const item of order.items) {
        const book = await Book.findById(item.bookId);
        if (!book) continue;

        book.stock += item.quantity;
        await book.save();

        await this.recordInventoryChange({
          bookId: item.bookId,
          changeAmount: item.quantity,
          reason: `order #${id} cancelled`,
        });
      }
    }

    order.status = status;
    await order.save();
    return order.toObject();
  }
}

export const storage = new MongoDBStorage();