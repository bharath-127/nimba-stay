import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import RecentBookings from './RecentBookings.jsx';
import { stayPhase } from '../../utils/bookingStatus.js';

const base = { room: { id: 'r', roomNumber: 'DLX-201', category: 'Deluxe' }, nights: 2, pricePerNight: 5500, totalPrice: 11000, createdAt: '2026-11-07T09:00:00.000Z' };
const bookings = [
  { ...base, id: 'b1', guestName: 'Upcoming Guest', phone: '9000000001', checkIn: '2026-11-25', checkOut: '2026-11-27', status: 'confirmed' },
  { ...base, id: 'b2', guestName: 'In House Guest', phone: '9000000002', checkIn: '2026-11-19', checkOut: '2026-11-21', status: 'confirmed' },
  { ...base, id: 'b3', guestName: 'Cancelled Guest', phone: '9000000003', checkIn: '2026-11-20', checkOut: '2026-11-22', status: 'cancelled' },
];

function setup(props = {}) {
  const onCancel = vi.fn();
  render(
    <RecentBookings bookings={bookings} loading={false} error={null} cancellingId={null} cancelError={null} onCancel={onCancel} onRefresh={() => {}} {...props} />
  );
  return { onCancel };
}

// The table (md+) is the second rendering of the same rows; scope queries to it.
const table = () => screen.getByRole('table');

describe('stayPhase', () => {
  it('classifies stays relative to today using half-open ranges', () => {
    expect(stayPhase('2026-11-25', '2026-11-27', '2026-11-20')).toBe('upcoming');
    expect(stayPhase('2026-11-19', '2026-11-21', '2026-11-20')).toBe('in-house');
    expect(stayPhase('2026-11-20', '2026-11-21', '2026-11-20')).toBe('in-house');
    expect(stayPhase('2026-11-18', '2026-11-20', '2026-11-20')).toBe('checked-out');
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
    const t = within(table());
    expect(t.getAllByText('Confirmed')).toHaveLength(2);
    expect(t.getAllByText('Cancelled')).toHaveLength(1);
    expect(t.getByText('Upcoming')).toBeInTheDocument();
    expect(t.getByText('In-house')).toBeInTheDocument();
  });

  it('offers cancel only for confirmed bookings', () => {
    setup();
    const t = within(table());
    expect(t.getByRole('button', { name: /cancel booking for upcoming guest/i })).toBeInTheDocument();
    expect(t.getByRole('button', { name: /cancel booking for in house guest/i })).toBeInTheDocument();
    expect(t.queryByRole('button', { name: /cancel booking for cancelled guest/i })).not.toBeInTheDocument();
  });

  it('asks for confirmation before cancelling, then calls onCancel with the id', () => {
    const { onCancel } = setup();
    const t = within(table());
    fireEvent.click(t.getByRole('button', { name: /cancel booking for upcoming guest/i }));
    expect(onCancel).not.toHaveBeenCalled();
    fireEvent.click(t.getByRole('button', { name: /yes, cancel/i }));
    expect(onCancel).toHaveBeenCalledWith('b1');
  });

  it('"Keep" backs out without cancelling', () => {
    const { onCancel } = setup();
    const t = within(table());
    fireEvent.click(t.getByRole('button', { name: /cancel booking for upcoming guest/i }));
    fireEvent.click(t.getByRole('button', { name: /keep/i }));
    expect(onCancel).not.toHaveBeenCalled();
    expect(t.getByRole('button', { name: /cancel booking for upcoming guest/i })).toBeInTheDocument();
  });

  it('renders a mobile card list with the same bookings', () => {
    setup();
    const list = screen.getByRole('list', { name: /recent bookings/i });
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
  });

  it('shows the empty state', () => {
    setup({ bookings: [] });
    expect(screen.getByText(/no bookings yet/i)).toBeInTheDocument();
  });
});
