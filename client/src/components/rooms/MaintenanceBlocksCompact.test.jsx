import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import MaintenanceBlocksCompact, { longDate } from './MaintenanceBlocksCompact.jsx';
import { ApiError } from '../../services/api.js';

const blocks = [
  { id: 'k1', room: { id: 'r1', roomNumber: 'STE-402', category: 'Suite' }, startDate: '2026-01-01', endDate: null, reason: 'Under maintenance' },
  { id: 'k2', room: { id: 'r2', roomNumber: 'PRM-301', category: 'Premium' }, startDate: '2026-11-05', endDate: '2026-11-15', reason: 'Plumbing' },
];

function setup(props = {}) {
  const onViewAll = vi.fn();
  render(<MaintenanceBlocksCompact blocks={blocks} loading={false} error={null} onViewAll={onViewAll} {...props} />);
  return { onViewAll };
}

describe('longDate', () => {
  it('formats an ISO date as dd Mon yyyy', () => {
    expect(longDate('2026-01-01')).toBe('01 Jan 2026');
    expect(longDate('2026-11-15')).toBe('15 Nov 2026');
  });
});

describe('MaintenanceBlocksCompact', () => {
  it('lists each blocked room with its category, period and an Under Maintenance chip', () => {
    setup();
    const list = within(screen.getByRole('list', { name: /rooms out of service/i }));
    expect(list.getAllByRole('listitem')).toHaveLength(2);
    expect(list.getByText('STE-402')).toBeInTheDocument();
    expect(list.getByText('Suite')).toBeInTheDocument();
    expect(list.getByText('01 Jan 2026 – Until lifted')).toBeInTheDocument();
    expect(list.getByText('05 Nov 2026 – 15 Nov 2026')).toBeInTheDocument();
    expect(list.getAllByText('Under Maintenance')).toHaveLength(2);
  });

  it('shows at most five blocks', () => {
    const many = Array.from({ length: 7 }, (_, i) => ({ ...blocks[0], id: `m${i}` }));
    setup({ blocks: many });
    expect(within(screen.getByRole('list', { name: /rooms out of service/i })).getAllByRole('listitem')).toHaveLength(5);
  });

  it('"View All" calls onViewAll', () => {
    const { onViewAll } = setup();
    fireEvent.click(screen.getByRole('button', { name: /view all maintenance blocks/i }));
    expect(onViewAll).toHaveBeenCalledTimes(1);
  });

  it('shows the empty state', () => {
    setup({ blocks: [] });
    expect(screen.getByText(/no rooms out of service/i)).toBeInTheDocument();
  });

  it('shows an error message', () => {
    setup({ error: new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'Cannot reach the server' }) });
    expect(screen.getByRole('alert')).toHaveTextContent(/cannot reach the server/i);
  });

  it('has the card title and subtitle', () => {
    setup();
    expect(screen.getByRole('heading', { name: /maintenance blocks/i })).toBeInTheDocument();
    expect(screen.getByText('Rooms currently out of service')).toBeInTheDocument();
  });
});
