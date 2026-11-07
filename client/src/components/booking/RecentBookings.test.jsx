import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import RecentBookings from './RecentBookings.jsx';
import { stayPhase, bookingPhase, canCancel, canCheckOut } from '../../utils/bookingStatus.js';

const base = { room: { id: 'r', roomNumber: 'DLX-201', category: 'Deluxe' }, nights: 2, chargedNights: 3, pricePerNight: 5500, totalPrice: 16500, createdAt: '2026-11-07T09:00:00.000Z', checkedOutOn: null };
const bookings = [
  { ...base, id: 'b1', guestName: 'Upcoming Guest', phone: '9000000001', checkIn: '2026-11-25', checkOut: '2026-11-27', status: 'confirmed' },
  { ...base, id: 'b2', guestName: 'In House Guest', phone: '9000000002', checkIn: '2026-11-19', checkOut: '2026-11-21', status: 'confirmed' },
  { ...base, id: 'b3', guestName: 'Cancelled Guest', phone: '9000000003', checkIn: '2026-11-20', checkOut: '2026-11-22', status: 'cancelled' },
  { ...base, id: 'b4', guestName: 'Left Early Guest', phone: '9000000004', checkIn: '2026-11-18', checkOut: '2026-11-22', status: 'checked_out', checkedOutOn: '2026-11-19' },
];

function setup(props = {}) {
  const onCancel = vi.fn();
  const onCheckOut = vi.fn();
  render(
    <RecentBookings bookings={bookings} loading={false} error={null} busyId={null} actionError={null} onCancel={onCancel} onCheckOut={onCheckOut} onRefresh={() => {}} {...props} />
  );
  return { onCancel, onCheckOut };
}

// The table (md+) is the second rendering of the same rows; scope queries to it.
const table = () => within(screen.getByRole('table'));
const TODAY = '2026-11-20';

describe('booking phase helpers', () => {
  it('classifies stays relative to today using half-open ranges', () => {
    expect(stayPhase('2026-11-25', '2026-11-27', TODAY)).toBe('upcoming');
    expect(stayPhase('2026-11-19', '2026-11-21', TODAY)).toBe('in-house');
    expect(stayPhase('2026-11-20', '2026-11-21', TODAY)).toBe('in-house');
    expect(stayPhase('2026-11-18', '2026-11-20', TODAY)).toBe('checked-out');
  });

  it('honours an explicit early check-out', () => {
    expect(bookingPhase(bookings[3], TODAY)).toBe('checked-out');
  });

  it('only in-house confirmed guests can check out; confirmed stays that have not ended can be cancelled', () => {
    expect(canCheckOut(bookings[0], TODAY)).toBe(false); // upcoming
    expect(canCheckOut(bookings[1], TODAY)).toBe(true);
    expect(canCheckOut(bookings[3], TODAY)).toBe(false); // already out
    expect(canCancel(bookings[0], TODAY)).toBe(true);
    expect(canCancel(bookings[1], TODAY)).toBe(true);
    expect(canCancel(bookings[2], TODAY)).toBe(false);
    expect(canCancel(bookings[3], TODAY)).toBe(false);
  });
});

describe('RecentBookings', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 20, 12, 0, 0));
  });
  afterEach(() => vi.useRealTimers());

  it('shows a status badge for every booking and a stay phase for confirmed ones', () => {
    setup();
    const t = table();
    expect(t.getAllByText('Confirmed')).toHaveLength(2);
    expect(t.getAllByText('Cancelled')).toHaveLength(1);
    expect(t.getAllByText('Checked out')).toHaveLength(1);
    expect(t.getByText('Upcoming')).toBeInTheDocument();
    expect(t.getByText('In-house')).toBeInTheDocument();
    expect(t.getByText(/left early on Thu, 19 Nov 2026/i)).toBeInTheDocument();
  });

  it('notes when the minimum charge applied', () => {
    setup();
    expect(table().getAllByText(/charged for 3/).length).toBeGreaterThan(0);
  });

  it('offers check-out only for the guest in house, and cancel for confirmed stays', () => {
    setup();
    const t = table();
    expect(t.getByRole('button', { name: /check out in house guest/i })).toBeInTheDocument();
    expect(t.queryByRole('button', { name: /check out upcoming guest/i })).not.toBeInTheDocument();
    expect(t.getByRole('button', { name: /cancel booking for upcoming guest/i })).toBeInTheDocument();
    expect(t.getByRole('button', { name: /cancel booking for in house guest/i })).toBeInTheDocument();
    expect(t.queryByRole('button', { name: /cancelled guest/i })).not.toBeInTheDocument();
    expect(t.queryByRole('button', { name: /left early guest/i })).not.toBeInTheDocument();
  });

  it('asks for confirmation before cancelling, then calls onCancel with the id', () => {
    const { onCancel } = setup();
    const t = table();
    fireEvent.click(t.getByRole('button', { name: /cancel booking for upcoming guest/i }));
    expect(onCancel).not.toHaveBeenCalled();
    fireEvent.click(t.getByRole('button', { name: /yes, cancel/i }));
    expect(onCancel).toHaveBeenCalledWith('b1');
  });

  it('asks for confirmation before checking out, then calls onCheckOut with the id', () => {
    const { onCheckOut } = setup();
    const t = table();
    fireEvent.click(t.getByRole('button', { name: /check out in house guest/i }));
    expect(onCheckOut).not.toHaveBeenCalled();
    fireEvent.click(t.getByRole('button', { name: /yes, check out/i }));
    expect(onCheckOut).toHaveBeenCalledWith('b2');
  });

  it('"Keep" backs out without acting', () => {
    const { onCancel } = setup();
    const t = table();
    fireEvent.click(t.getByRole('button', { name: /cancel booking for upcoming guest/i }));
    fireEvent.click(t.getByRole('button', { name: /^keep$/i }));
    expect(onCancel).not.toHaveBeenCalled();
    expect(t.getByRole('button', { name: /cancel booking for upcoming guest/i })).toBeInTheDocument();
  });

  it('renders a mobile card list with the same bookings', () => {
    setup();
    const list = screen.getByRole('list', { name: /recent bookings/i });
    expect(within(list).getAllByRole('listitem')).toHaveLength(4);
  });

  it('shows the empty state', () => {
    setup({ bookings: [] });
    expect(screen.getByText(/no bookings yet/i)).toBeInTheDocument();
  });
});
