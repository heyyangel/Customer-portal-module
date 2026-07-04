import mongoose from 'mongoose';

// Named, atomically-incrementing sequences used to generate collision-free
// human-readable IDs (order numbers, reservation IDs). Replaces the previous
// Math.random() scheme, which could collide (and hard-fail on the unique
// reservationId index).
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // sequence name, e.g. 'order-2026'
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model('Counter', counterSchema);

// Atomically increment and return the next value for a named sequence.
// findByIdAndUpdate with upsert is a single atomic op, so it is safe under
// concurrency. Pass a session to enlist it in an active transaction.
export const nextSequence = async (name, session = null) => {
  const doc = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true, ...(session ? { session } : {}) }
  );
  return doc.seq;
};

export default Counter;
