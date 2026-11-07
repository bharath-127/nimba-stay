import { Room, RoomBlock, Booking } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { BOOKING_STATUS } from '../utils/constants.js';
import { todayIso } from '../utils/dates.js';

/** Mongo filter for blocks that cover any night of [checkIn, checkOut). */
export function blockOverlapFilter(checkIn, checkOut) {
  return { startDate: { $lt: checkOut }, $or: [{ endDate: null }, { endDate: { $gt: checkIn } }] };
}

/** Ids of the given rooms that are blocked for any night of the range. */
export async function blockedRoomIds(roomIds, checkIn, checkOut) {
  return RoomBlock.distinct('roomId', { roomId: { $in: roomIds }, ...blockOverlapFilter(checkIn, checkOut) });
}

/** Blocks still in effect or starting later (ended blocks are history). */
export async function listBlocks({ includeEnded = false } = {}) {
  const filter = includeEnded ? {} : { $or: [{ endDate: null }, { endDate: { $gt: todayIso() } }] };
  const blocks = await RoomBlock.find(filter).sort({ startDate: 1 }).populate('roomId', 'roomNumber category').lean();
  return blocks.map((b) => serializeBlock(b, b.roomId));
}

/**
 * Take a room out of service for a date range. Refused when a confirmed
 * guest is booked for any night of it — those guests must be moved first,
 * otherwise the block would silently strand them.
 */
export async function createBlock({ roomId, startDate, endDate = null, reason }) {
  const room = await Room.findById(roomId).lean();
  if (!room) throw AppError.notFound('ROOM_NOT_FOUND', 'Room not found');

  const stayFilter = { roomId: room._id, checkIn: endDate ? { $lt: endDate } : { $exists: true } };
  const clashing = await Booking.find({
    ...stayFilter,
    $or: [
      { status: BOOKING_STATUS.CONFIRMED, checkOut: { $gt: startDate } },
      { status: BOOKING_STATUS.CHECKED_OUT, checkedOutOn: { $gt: startDate } },
    ],
  })
    .sort({ checkIn: 1 })
    .lean();

  if (clashing.length > 0) {
    throw new AppError(
      409,
      'BLOCK_CONFLICTS_WITH_BOOKINGS',
      `Room ${room.roomNumber} has ${clashing.length} booking${clashing.length === 1 ? '' : 's'} in that period. Move or cancel them before blocking the room.`,
      clashing.map((b) => ({ bookingId: String(b._id), guestName: b.guestName, checkIn: b.checkIn, checkOut: b.checkOut }))
    );
  }

  const block = await RoomBlock.create({ roomId: room._id, startDate, endDate, reason });
  return serializeBlock(block.toObject(), room);
}

/**
 * Lift a block. A block that has not started yet is removed outright; one
 * already in effect is ended today so the history stays intact.
 */
export async function liftBlock(blockId) {
  const block = await RoomBlock.findById(blockId).populate('roomId', 'roomNumber category');
  if (!block) throw AppError.notFound('BLOCK_NOT_FOUND', 'Block not found');

  const today = todayIso();
  if (block.startDate >= today) {
    await block.deleteOne();
    return { ...serializeBlock(block.toObject(), block.roomId), lifted: 'removed' };
  }
  if (block.endDate && block.endDate <= today) {
    return { ...serializeBlock(block.toObject(), block.roomId), lifted: 'already-ended' };
  }
  block.endDate = today;
  await block.save();
  return { ...serializeBlock(block.toObject(), block.roomId), lifted: 'ended-today' };
}

export function serializeBlock(b, room) {
  return {
    id: String(b._id),
    roomId: String(room?._id ?? b.roomId),
    room: room ? { id: String(room._id), roomNumber: room.roomNumber, category: room.category } : null,
    startDate: b.startDate,
    endDate: b.endDate ?? null,
    reason: b.reason,
    createdAt: b.createdAt,
  };
}
