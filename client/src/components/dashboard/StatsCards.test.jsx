import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StatsCards from './StatsCards.jsx';
import { ApiError } from '../../services/api.js';

const stats = {
  checkIn: '2026-11-21',
  checkOut: '2026-11-23',
  nights: 2,
  totalRooms: 10,
  activeRooms: 9,
  inactiveRooms: 1,
  maintenanceRooms: 1,
  availableRooms: 6,
  occupiedRooms: 2,
  confirmedBookings: 5,
  currentOrUpcomingBookings: 3,
  inHouseTonight: 1,
};

describe('StatsCards', () => {
  it('renders the four figures exactly as returned by the API', () => {
    render(<StatsCards stats={stats} loading={false} error={null} range={{ checkIn: '2026-11-21', checkOut: '2026-11-23' }} onRetry={() => {}} />);
    expect(screen.getByTestId('stat-total')).toHaveTextContent('10');
    expect(screen.getByTestId('stat-available')).toHaveTextContent('6');
    expect(screen.getByTestId('stat-maintenance')).toHaveTextContent('1');
    expect(screen.getByTestId('stat-confirmed')).toHaveTextContent('5');
    expect(screen.getByText('9 in service · 1 inactive')).toBeInTheDocument();
    expect(screen.getByText('2 rooms occupied for these dates')).toBeInTheDocument();
    expect(screen.getByText('3 current or upcoming stays · 1 in house tonight')).toBeInTheDocument();
  });

  it('describes the searched dates, and labels availability for them', () => {
    render(<StatsCards stats={stats} loading={false} error={null} range={{ checkIn: '2026-11-21', checkOut: '2026-11-23' }} onRetry={() => {}} />);
    expect(screen.getByTestId('stats-range')).toHaveTextContent('Sat, 21 Nov 2026 → Mon, 23 Nov 2026 · 2 nights');
    expect(screen.getByText('Available for these dates')).toBeInTheDocument();
  });

  it('describes tonight before any search', () => {
    render(<StatsCards stats={{ ...stats, nights: 1 }} loading={false} error={null} range={null} onRetry={() => {}} />);
    expect(screen.getByTestId('stats-range')).toHaveTextContent('Tonight');
    expect(screen.getByText('Available tonight')).toBeInTheDocument();
    expect(screen.getByText('2 rooms occupied tonight')).toBeInTheDocument();
  });

  it('shows skeletons on first load', () => {
    render(<StatsCards stats={null} loading error={null} range={null} onRetry={() => {}} />);
    expect(screen.getByLabelText(/loading property summary/i)).toHaveAttribute('aria-busy', 'true');
  });

  it('shows an error with retry when the first load fails', () => {
    const onRetry = vi.fn();
    render(<StatsCards stats={null} loading={false} error={new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'Cannot reach the server' })} range={null} onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/could not load the property summary/i);
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('keeps the last figures visible when a refresh fails', () => {
    render(<StatsCards stats={stats} loading={false} error={new ApiError({ status: 500, code: 'X', message: 'Boom' })} range={null} onRetry={() => {}} />);
    expect(screen.getByTestId('stat-total')).toHaveTextContent('10');
    expect(screen.getByRole('alert')).toHaveTextContent(/could not be refreshed/i);
  });
});
