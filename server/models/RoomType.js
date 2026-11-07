import mongoose from 'mongoose';

/**
 * A room category ("Deluxe", "Suite", …). Owns the nightly rate, so changing
 * a tariff is one update rather than one per room. Inactive types are never
 * offered, even if their rooms are active.
 */
const roomTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    pricePerNight: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const RoomType = mongoose.model('RoomType', roomTypeSchema);
