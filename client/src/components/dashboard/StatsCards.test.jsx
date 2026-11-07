import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StatsCards from './StatsCards.jsx';
import { ApiError } from '../../services/api.js';

const stats = {
  date: '2026-11-20',
  totalRooms: 10,
  activeRooms: 9,
  maintenanceRooms: 1,
  availableTonight: 7,
  occupiedTonight: 2,
  confirmedBookings: 5,
  currentOrUpcomingBookings: 3,
};

describe('StatsCards', () => {
  it('renders the four figures exactly as returned by the API', () => {
    render(<StatsCards stats={stats} loading={false} error={null} onRetry={() => {}} />);
    expect(screen.getByTestId('stat-total')).toHaveTextContent('10');
    expect(screen.getByTestId('stat-available')).toHaveTextContent('7');
    expect(screen.getByTestId('stat-maintenance')).toHaveTextContent('1');
    expect(screen.getByTestId('stat-confirmed')).toHaveTextContent('5');
    expect(screen.getByText('9 in service')).toBeInTheDocument();
    expect(screen.getByText('2 occupied tonight')).toBeInTheDocument();
    expect(screen.getByText('3 current or upcoming stays')).toBeInTheDocument();
  });

  it('shows skeletons on first load', () => {
    render(<StatsCards stats={null} loading error={null} onRetry={() => {}} />);
    expect(screen.getByLabelText(/loading property summary/i)).toHaveAttribute('aria-busy', 'true');
  });

  it('shows an error with retry when the first load fails', () => {
    const onRetry = vi.fn();
    render(<StatsCards stats={null} loading={false} error={new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'Cannot reach the server' })} onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/could not load the property summary/i);
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('keeps the last figures visible when a refresh fails', () => {
    render(<StatsCards stats={stats} loading={false} error={new ApiError({ status: 500, code: 'X', message: 'Boom' })} onRetry={() => {}} />);
    expect(screen.getByTestId('stat-total')).toHaveTextContent('10');
    expect(screen.getByRole('alert')).toHaveTextContent(/could not be refreshed/i);
  });
});
