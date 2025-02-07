import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true }, // stored in cents
  stock: { type: Number, required: true },
  lowStockThreshold: { type: Number, required: true, default: 5 },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  coverUrl: { type: String, required: true },
}, { timestamps: true });

// Add an index on title for faster searches
bookSchema.index({ title: 1 });

export const Book = mongoose.model('Book', bookSchema);
