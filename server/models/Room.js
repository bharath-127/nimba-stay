import mongoose from 'mongoose';

/**
 * A physical room. `category` is the name of its RoomType, which holds the
 * rate. Inactive rooms are never offered. Maintenance is NOT a flag here —
 * it is a dated RoomBlock, so a room can be out of service for a known
 * period and come back automatically.
 */
const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    category: { type: String, required: true, trim: true },
    bedCount: { type: Number, required: true, min: 1, default: 2 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Availability filters on isActive + category, then sorts by room number.
roomSchema.index({ isActive: 1, category: 1, roomNumber: 1 });

export const Room = mongoose.model('Room', roomSchema);
