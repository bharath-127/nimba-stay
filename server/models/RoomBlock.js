import mongoose from 'mongoose';
import { ISO_DATE_REGEX } from '../utils/dates.js';

/**
 * A room taken out of service for a date range (maintenance, deep clean,
 * inspection …). Like a stay it is half-open: [startDate, endDate).
 * `endDate: null` means "until someone lifts the block".
 */
const roomBlockSchema = new mongoose.Schema(
  {
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    startDate: { type: String, required: true, match: ISO_DATE_REGEX },
    endDate: { type: String, default: null, match: ISO_DATE_REGEX },
    reason: { type: String, trim: true, maxlength: 200, default: 'Maintenance' },
  },
  { timestamps: true }
);

roomBlockSchema.pre('validate', function enforceDateOrder() {
  if (this.endDate && !(this.endDate > this.startDate)) {
    this.invalidate('endDate', 'endDate must be after startDate');
  }
});

// Overlap query: { roomId: {$in}, startDate: {$lt: out}, $or: [{endDate: null}, {endDate: {$gt: in}}] }
roomBlockSchema.index({ roomId: 1, startDate: 1, endDate: 1 });

export const RoomBlock = mongoose.model('RoomBlock', roomBlockSchema);
