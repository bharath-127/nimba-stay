import { Room, Booking } from '../models/index.js';
import { ROOM_STATUS, BOOKING_STATUS } from '../utils/constants.js';
import { addDays, todayIso } from '../utils/dates.js';
import { findAvailableRooms } from './availabilityService.js';

/**
 * Dashboard summary for one calendar day (default: today, server time).
 *
 * "Available tonight" deliberately reuses findAvailableRooms() for the
 * one-night stay [date, date + 1), so the summary card can never disagree
 * with what the availability search would return: maintenance rooms are
 * excluded, cancelled bookings block nothing, and a guest checking out on
 * `date` does not occupy that night.
 */
export async function getDashboardStats({ date } = {}) {
  const day = date ?? todayIso();

  const [totalRooms, maintenanceRooms, confirmedBookings, currentOrUpcomingBookings, tonight] = await Promise.all([
    Room.countDocuments(),
    Room.countDocuments({ status: ROOM_STATUS.MAINTENANCE }),
    Booking.countDocuments({ status: BOOKING_STATUS.CONFIRMED }),
    Booking.countDocuments({ status: BOOKING_STATUS.CONFIRMED, checkOut: { $gt: day } }),
    findAvailableRooms({ checkIn: day, checkOut: addDays(day, 1) }),
  ]);

  const activeRooms = totalRooms - maintenanceRooms;

  return {
    date: day,
    totalRooms,
    activeRooms,
    maintenanceRooms,
    availableTonight: tonight.count,
    occupiedTonight: activeRooms - tonight.count,
    confirmedBookings,
    currentOrUpcomingBookings,
  };
}
