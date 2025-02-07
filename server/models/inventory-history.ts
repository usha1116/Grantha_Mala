import mongoose from 'mongoose';

const inventoryHistorySchema = new mongoose.Schema({
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  changeAmount: { type: Number, required: true }, // positive for additions, negative for removals
  reason: { type: String, required: true }, // e.g. "sale", "restock", "adjustment"
}, { timestamps: true });

export const InventoryHistory = mongoose.model('InventoryHistory', inventoryHistorySchema);
