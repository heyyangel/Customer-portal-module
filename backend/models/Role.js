import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  permissions: [{ type: String }] // e.g., 'create_order', 'manage_orders', 'manage_inventory'
}, { timestamps: true });

export default mongoose.model('Role', roleSchema);
