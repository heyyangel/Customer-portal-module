import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  brand: {
    type: String,
    enum: ['Koken', 'BIX', 'IMADA'],
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Booked', 'Approved', 'Dispatched', 'Cancelled', 'Delivered'],
    default: 'Booked'
  },
  
  // Sheet columns
  orderTimestamp: { type: Date, default: null }, // Maps to 'Timestamp'
  company: { type: String, default: null }, // Maps to 'Company'
  role: { type: String, default: null }, // Maps to 'Role'
  orderId: { type: String, required: true }, // Maps to 'Order ID'
  date: { type: Date, default: null }, // Maps to 'Date'
  skuCode: { type: String, required: true }, // Maps to 'SKU Code'
  category: { type: String, default: null }, // Maps to 'Category'
  requestedQty: { type: Number, default: 0 }, // Maps to 'Requested Qty'
  poNumber: { type: String, default: null }, // Maps to 'PO Number'
  remarks: { type: String, default: null }, // Maps to 'Remarks'
  expiryNotified: { type: Boolean, default: false }, // Maps to 'Expiry Notified'
  uniqueId: { type: String, default: null }, // Maps to 'Unique ID'
  statusTimestamp: { type: Date, default: null }, // Maps to 'Status_Timestamp'
  msilCode: { type: String, default: null }, // Maps to 'MSIL CODE'
  poDate: { type: Date, default: null }, // Maps to 'PO Date'
  supplyByDate: { type: Date, default: null }, // Maps to 'SupplyByDate'
  boxNo: { type: String, default: null }, // Maps to 'boxNo'
  location: { type: String, default: null }, // Maps to 'Location'
  vendorCode: { type: String, default: null }, // Maps to 'Vendor code'
  emailId: { type: String, default: null }, // Maps to 'Email id'
  phoneNumber: { type: String, default: null } // Maps to 'Phone Number'
}, { timestamps: true });

// Compound indexes
orderSchema.index({ skuCode: 1, brand: 1 });
orderSchema.index({ company: 1, status: 1 });

export default mongoose.model('Order', orderSchema);
