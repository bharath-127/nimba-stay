import mongoose from 'mongoose';
import { ROOM_CATEGORIES, ROOM_STATUS } from '../utils/constants.js';

const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    category: { type: String, required: true, enum: ROOM_CATEGORIES },
    pricePerNight: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: Object.values(ROOM_STATUS),
      default: ROOM_STATUS.ACTIVE,
    },
  },
  { timestamps: true }
);

// Availability filters on status + category, then sorts by room number.
roomSchema.index({ status: 1, category: 1, roomNumber: 1 });

export const Room = mongoose.model('Room', roomSchema);
