import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import RecentBookingsCompact, { shortDate } from './RecentBookingsCompact.jsx';
import { ApiError } from '../../services/api.js';

const base = { room: { id: 'r', roomNumber: 'DLX-201', category: 'Deluxe' }, nights: 2, totalPrice: 11000, phone: '9000000000', checkedOutOn: null };
const bookings = [
  { ...base, id: 'b1', guestName: 'Upcoming Guest', room: { roomNumber: 'DLX-202', category: 'Deluxe' }, checkIn: '2026-11-25', checkOut: '2026-11-27', status: 'confirmed' },
  { ...base, id: 'b2', guestName: 'Asha Mehta', room: { roomNumber: 'STD-101', category: 'Standard' }, checkIn: '2026-11-09', checkOut: '2026-11-11', status: 'confirmed' },
  { ...base, id: 'b3', guestName: 'Test1', checkIn: '2026-11-08', checkOut: '2026-11-09', status: 'cancelled' },
  { ...base, id: 'b4', guestName: 'Left Early', checkIn: '2026-11-05', checkOut: '2026-11-12', status: 'checked_out', checkedOutOn: '2026-11-06' },
];

function setup(props = {}) {
  const onViewAll = vi.fn();
  render(<RecentBookingsCompact bookings={bookings} loading={false} error={null} onViewAll={onViewAll} {...props} />);
  return { onViewAll };
}

describe('shortDate', () => {
  it('formats an ISO date as dd Mon', () => {
    expect(shortDate('2026-11-09')).toBe('09 Nov');
    expect(shortDate('2026-01-01')).toBe('01 Jan');
    expect(shortDate('')).toBe('');
  });
});

describe('RecentBookingsCompact', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 10, 12, 0, 0)); // today = 10 Nov 2026
  });
  afterEach(() => vi.useRealTimers());

  it('renders guest, room and stay for each booking', () => {
    setup();
    const table = within(screen.getByRole('table'));
    expect(table.getByText('Asha Mehta')).toBeInTheDocument();
    expect(table.getByText('STD-101')).toBeInTheDocument();
    expect(table.getByText('09 Nov – 11 Nov')).toBeInTheDocument();
    expect(table.getByText('25 Nov – 27 Nov')).toBeInTheDocument();
  });

  it('shows Upcoming for a confirmed stay that has not started, Confirmed for one in progress', () => {
    setup();
    const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1); // skip header
    expect(within(rows[0]).getByText('Upcoming')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Confirmed')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Cancelled')).toBeInTheDocument();
    expect(within(rows[3]).getByText('Checked out')).toBeInTheDocument();
  });

  it('shows at most five rows', () => {
    const many = Array.from({ length: 7 }, (_, i) => ({ ...base, id: `m${i}`, guestName: `Guest ${i}`, checkIn: '2026-11-09', checkOut: '2026-11-11', status: 'confirmed' }));
    setup({ bookings: many });
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(6); // header + 5
  });

  it('"View All" calls onViewAll', () => {
    const { onViewAll } = setup();
    fireEvent.click(screen.getByRole('button', { name: /view all bookings/i }));
    expect(onViewAll).toHaveBeenCalledTimes(1);
  });

  it('shows skeleton rows while loading with nothing yet', () => {
    setup({ bookings: [], loading: true });
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
  });

  it('shows the empty state', () => {
    setup({ bookings: [] });
    expect(screen.getByText(/no bookings yet/i)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('shows an error message', () => {
    setup({ error: new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'Cannot reach the server' }) });
    expect(screen.getByRole('alert')).toHaveTextContent(/cannot reach the server/i);
  });

  it('has the card title and subtitle', () => {
    setup();
    expect(screen.getByRole('heading', { name: /recent bookings/i })).toBeInTheDocument();
    expect(screen.getByText('Latest bookings and status')).toBeInTheDocument();
  });
});
