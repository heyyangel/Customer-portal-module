import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
  reservationId: { type: String, required: true, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  skuCode: { type: String, required: true },
  msilCode: { type: String, required: true },
  quantity: { type: Number, required: true },
  reservationDate: { type: Date, default: Date.now },
  expiryDate: { type: Date, required: true },
  status: {
    type: String,
    enum: [
      'Draft', 'Reserved', 'Confirmed', 'Expired', 'Cancelled',
      'Pending Approval', 'Approved', 'Processing', 'Completed'
    ],
    default: 'Reserved'
  },
  reservedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  confirmedAt: Date,
  expiredAt: Date,
  lastReminderSent: { type: String, default: null } // e.g. 'day5', 'day7'
}, { timestamps: true });

// Add index for fast querying
reservationSchema.index({ customerId: 1 });
reservationSchema.index({ status: 1 });
reservationSchema.index({ expiryDate: 1 });

export default mongoose.model('Reservation', reservationSchema);
