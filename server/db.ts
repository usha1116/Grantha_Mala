import mongoose from 'mongoose';
import { log } from './vite';
import { Book, Category, User } from './models';
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import dotenv from "dotenv";
dotenv.config();

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is not set");
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    log('Connected to MongoDB');

    // Seed initial data if necessary
    const categoryCount = await Category.countDocuments();
    const userCount = await User.countDocuments();

    if (userCount === 0) {
      log('Creating admin user...');
      try {
        await User.create({
          username: "admin",
          password: await hashPassword("admin123"),
          isAdmin: true
        });
        log('Admin user created successfully');
      } catch (error) {
        log('Error creating admin user:', error);
      }
    }

    if (categoryCount === 0) {
      log('Seeding initial data...');
      try {
        // Create categories
        const fiction = await Category.create({
          name: "Fiction",
          description: "Fictional literature"
        });

        const nonFiction = await Category.create({
          name: "Non-Fiction",
          description: "Educational and informative books"
        });

        const science = await Category.create({
          name: "Science",
          description: "Scientific publications"
        });

        // Create sample books
        await Book.create([
          {
            title: "The Evolution of Everything",
            author: "Matt Ridley",
            description: "How ideas emerge",
            price: 1999,
            stock: 10,
            lowStockThreshold: 5,
            categoryId: nonFiction._id,
            coverUrl: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73"
          },
          {
            title: "The Psychology of Money",
            author: "Morgan Housel",
            description: "Timeless lessons on wealth, greed, and happiness",
            price: 1499,
            stock: 15,
            lowStockThreshold: 7,
            categoryId: nonFiction._id,
            coverUrl: "https://images.unsplash.com/photo-1592496431122-2349e0fbc666"
          }
        ]);

        log('Initial data seeded successfully');
      } catch (error) {
        log('Error seeding initial data:', error);
      }
    }
  })
  .catch((error) => {
    log('MongoDB connection error:', error);
    process.exit(1);
  });

export const db = mongoose.connection;