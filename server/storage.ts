import session from "express-session";
import createMemoryStore from "memorystore";
import { Book, Category, Order, User, InventoryHistory } from "./models";
import type { InsertUser, InsertBook, InsertOrder, InsertCategory, InsertInventoryHistory } from "@shared/schema";
import { log } from './vite';

const MemoryStore = createMemoryStore(session);

export class MongoDBStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  // User management
  async getUser(id: string): Promise<any> {
    try {
      const user = await User.findById(id).lean();
      return user || undefined;
    } catch (error) {
      log('Error getting user:', error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<any> {
    try {
      const user = await User.findOne({ username }).lean();
      return user || undefined;
    } catch (error) {
      log('Error getting user by username:', error);
      throw error;
    }
  }

  async createUser(insertUser: InsertUser): Promise<any> {
    try {
      const user = new User(insertUser);
      await user.save();
      return user.toObject();
    } catch (error) {
      log('Error creating user:', error);
      throw error;
    }
  }

  // Book management
  async getBooks(): Promise<any[]> {
    try {
      return await Book.find().lean();
    } catch (error) {
      log('Error getting books:', error);
      throw error;
    }
  }

  async getBook(id: string): Promise<any> {
    try {
      const book = await Book.findById(id).lean();
      return book || undefined;
    } catch (error) {
      log('Error getting book:', error);
      throw error;
    }
  }

  async createBook(insertBook: InsertBook): Promise<any> {
    try {
      const book = new Book(insertBook);
      await book.save();

      // Record initial stock
      await this.recordInventoryChange({
        bookId: book._id,
        changeAmount: insertBook.stock,
        reason: "initial stock",
      });

      return book.toObject();
    } catch (error) {
      log('Error creating book:', error);
      throw error;
    }
  }

  async updateBook(id: string, updateBook: Partial<InsertBook>): Promise<any> {
    try {
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
    } catch (error) {
      log('Error updating book:', error);
      throw error;
    }
  }

  async deleteBook(id: string): Promise<void> {
    try {
      await Book.findByIdAndDelete(id);
    } catch (error) {
      log('Error deleting book:', error);
      throw error;
    }
  }

  async getBooksWithLowStock(): Promise<any[]> {
    try {
      return await Book.find({
        $expr: {
          $lte: ["$stock", "$lowStockThreshold"]
        }
      }).lean();
    } catch (error) {
      log('Error getting low stock books:', error);
      throw error;
    }
  }

  // Category management
  async getCategories(): Promise<any[]> {
    try {
      return await Category.find().lean();
    } catch (error) {
      log('Error getting categories:', error);
      throw error;
    }
  }

  async getCategory(id: string): Promise<any> {
    try {
      const category = await Category.findById(id).lean();
      return category || undefined;
    } catch (error) {
      log('Error getting category:', error);
      throw error;
    }
  }

  async createCategory(insertCategory: InsertCategory): Promise<any> {
    try {
      const category = new Category(insertCategory);
      await category.save();
      return category.toObject();
    } catch (error) {
      log('Error creating category:', error);
      throw error;
    }
  }

  async updateCategory(id: string, updateCategory: Partial<InsertCategory>): Promise<any> {
    try {
      const category = await Category.findById(id);
      if (!category) throw new Error("Category not found");

      Object.assign(category, updateCategory);
      await category.save();
      return category.toObject();
    } catch (error) {
      log('Error updating category:', error);
      throw error;
    }
  }

  async deleteCategory(id: string): Promise<void> {
    try {
      await Category.findByIdAndDelete(id);
    } catch (error) {
      log('Error deleting category:', error);
      throw error;
    }
  }

  // Inventory history
  async getInventoryHistory(bookId: string): Promise<any[]> {
    try {
      return await InventoryHistory.find({ bookId })
        .sort({ createdAt: -1 })
        .lean();
    } catch (error) {
      log('Error getting inventory history:', error);
      throw error;
    }
  }

  async recordInventoryChange(insertHistory: InsertInventoryHistory): Promise<any> {
    try {
      const history = new InventoryHistory(insertHistory);
      await history.save();
      return history.toObject();
    } catch (error) {
      log('Error recording inventory change:', error);
      throw error;
    }
  }

  // Order management
  async getOrders(): Promise<any[]> {
    try {
      return await Order.find().lean();
    } catch (error) {
      log('Error getting orders:', error);
      throw error;
    }
  }

  async createOrder(insertOrder: InsertOrder): Promise<any> {
    try {
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
    } catch (error) {
      log('Error creating order:', error);
      throw error;
    }
  }

  async updateOrderStatus(id: string, status: Order['status']): Promise<any> {
    try {
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
    } catch (error) {
      log('Error updating order status:', error);
      throw error;
    }
  }
}

export const storage = new MongoDBStorage();