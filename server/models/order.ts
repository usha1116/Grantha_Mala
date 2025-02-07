import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  quantity: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({
  items: [orderItemSchema],
  customerName: { type: String, required: true },
  address: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending',
    required: true 
  },
}, { timestamps: true });

export const Order = mongoose.model('Order', orderSchema);
