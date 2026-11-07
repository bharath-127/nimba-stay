import { Room, Booking } from '../models/index.js';
import { BOOKING_STATUS } from '../utils/constants.js';
import { addDays, countNights, todayIso } from '../utils/dates.js';
import { findAvailableRooms } from './availabilityService.js';
import { blockedRoomIds } from './roomBlockService.js';

/**
 * Dashboard summary for a stay range [checkIn, checkOut). With no range it
 * describes tonight. "Available" deliberately reuses findAvailableRooms(),
 * so the summary card can never disagree with the availability search for
 * the same dates.
 */
export async function getDashboardStats({ checkIn, checkOut, date } = {}) {
  const start = checkIn ?? date ?? todayIso();
  const end = checkOut ?? addDays(start, 1);
  const today = todayIso();

  const [rooms, confirmedBookings, currentOrUpcomingBookings, inHouseTonight, available] = await Promise.all([
    Room.find({}, { isActive: 1 }).lean(),
    Booking.countDocuments({ status: BOOKING_STATUS.CONFIRMED }),
    Booking.countDocuments({ status: BOOKING_STATUS.CONFIRMED, checkOut: { $gt: today } }),
    Booking.countDocuments({ status: BOOKING_STATUS.CONFIRMED, checkIn: { $lte: today }, checkOut: { $gt: today } }),
    findAvailableRooms({ checkIn: start, checkOut: end }),
  ]);

  const activeRooms = rooms.filter((r) => r.isActive);
  const blocked = await blockedRoomIds(activeRooms.map((r) => r._id), start, end);

  const totalRooms = rooms.length;
  const inactiveRooms = totalRooms - activeRooms.length;
  const maintenanceRooms = blocked.length;
  const availableRooms = available.count;
  const occupiedRooms = Math.max(activeRooms.length - maintenanceRooms - availableRooms, 0);

  return {
    checkIn: start,
    checkOut: end,
    nights: countNights(start, end),
    totalRooms,
    activeRooms: activeRooms.length,
    inactiveRooms,
    maintenanceRooms,
    availableRooms,
    occupiedRooms,
    confirmedBookings,
    currentOrUpcomingBookings,
    inHouseTonight,
  };
}
