
import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  quantity: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({
  items: [orderItemSchema],
  customerName: { type: String, required: true },
  address: { type: String, required: true },
  paymentMethod: { 
    type: String, 
    enum: ['online', 'cod'],
    required: true 
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
    required: true 
  },
  totalAmount: { type: Number, required: true },
}, { timestamps: true });

export const Order = mongoose.model('Order', orderSchema);
