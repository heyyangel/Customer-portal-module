import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['order', 'approval', 'inventory', 'reservation'],
    default: 'reservation'
  },
  read: { type: Boolean, default: false }
}, { timestamps: true });

// Index for query optimization
notificationSchema.index({ user: 1 });
notificationSchema.index({ createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
