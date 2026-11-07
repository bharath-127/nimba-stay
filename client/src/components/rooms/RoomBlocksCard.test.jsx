import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import RoomBlocksCard from './RoomBlocksCard.jsx';
import { ApiError } from '../../services/api.js';

const rooms = [
  { id: 'r1', roomNumber: 'DLX-201', category: 'Deluxe', isActive: true },
  { id: 'r2', roomNumber: 'DLX-203', category: 'Deluxe', isActive: true },
  { id: 'r3', roomNumber: 'OLD-999', category: 'Standard', isActive: false },
];
const blocks = [
  { id: 'k1', room: { id: 'r2', roomNumber: 'DLX-203', category: 'Deluxe' }, startDate: '2026-01-01', endDate: null, reason: 'Under maintenance' },
  { id: 'k2', room: { id: 'r1', roomNumber: 'DLX-201', category: 'Deluxe' }, startDate: '2026-11-25', endDate: '2026-11-27', reason: 'Plumbing' },
];

function setup(props = {}) {
  const onCreate = vi.fn().mockResolvedValue({ ok: true, block: { ...blocks[1], id: 'k3' } });
  const onLift = vi.fn().mockResolvedValue({ ok: true });
  render(<RoomBlocksCard blocks={blocks} rooms={rooms} loading={false} error={null} busyId={null} creating={false} onCreate={onCreate} onLift={onLift} onRefresh={() => {}} {...props} />);
  return { onCreate, onLift };
}

describe('RoomBlocksCard', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 20, 12, 0, 0));
  });
  afterEach(() => vi.useRealTimers());

  it('lists current and upcoming blocks with their period and reason', () => {
    setup();
    const list = within(screen.getByRole('list', { name: /room blocks/i }));
    expect(list.getAllByRole('listitem')).toHaveLength(2);
    expect(list.getByText(/Thu, 1 Jan 2026 → until lifted · Under maintenance/)).toBeInTheDocument();
    expect(list.getByText(/Wed, 25 Nov 2026 → Fri, 27 Nov 2026 · Plumbing/)).toBeInTheDocument();
  });

  it('offers only active rooms in the picker', () => {
    setup();
    const select = screen.getByLabelText(/^room$/i);
    expect(within(select).getByRole('option', { name: 'DLX-201 · Deluxe' })).toBeInTheDocument();
    expect(within(select).queryByRole('option', { name: /OLD-999/ })).not.toBeInTheDocument();
  });

  it('validates locally and submits the block with an optional end date', async () => {
    const { onCreate } = setup();
    fireEvent.click(screen.getByRole('button', { name: /block room/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/choose a room/i);
    expect(onCreate).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/^room$/i), { target: { value: 'r1' } });
    fireEvent.change(screen.getByLabelText(/^from$/i), { target: { value: '2026-11-25' } });
    fireEvent.change(screen.getByLabelText(/^until$/i), { target: { value: '2026-11-27' } });
    fireEvent.change(screen.getByLabelText(/^reason$/i), { target: { value: 'Plumbing' } });
    fireEvent.click(screen.getByRole('button', { name: /block room/i }));

    expect(onCreate).toHaveBeenCalledWith('r1', { startDate: '2026-11-25', endDate: '2026-11-27', reason: 'Plumbing' });
    expect(await screen.findByText(/Room DLX-201 blocked/)).toBeInTheDocument();
  });

  it('rejects an end date that is not after the start date', () => {
    const { onCreate } = setup();
    fireEvent.change(screen.getByLabelText(/^room$/i), { target: { value: 'r1' } });
    fireEvent.change(screen.getByLabelText(/^from$/i), { target: { value: '2026-11-25' } });
    fireEvent.change(screen.getByLabelText(/^until$/i), { target: { value: '2026-11-25' } });
    fireEvent.click(screen.getByRole('button', { name: /block room/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/after start date/i);
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('shows the guests in the way when the server refuses the block', async () => {
    const error = new ApiError({
      status: 409,
      code: 'BLOCK_CONFLICTS_WITH_BOOKINGS',
      message: 'Room DLX-201 has 1 booking in that period. Move or cancel them before blocking the room.',
      details: [{ bookingId: 'b9', guestName: 'Asha Mehta', checkIn: '2026-11-25', checkOut: '2026-11-28' }],
    });
    setup({ onCreate: vi.fn().mockResolvedValue({ ok: false, error }) });
    fireEvent.change(screen.getByLabelText(/^room$/i), { target: { value: 'r1' } });
    fireEvent.click(screen.getByRole('button', { name: /block room/i }));

    expect(await screen.findByText(/could not block the room/i)).toBeInTheDocument();
    expect(screen.getByText(/Asha Mehta · Wed, 25 Nov 2026 → Sat, 28 Nov 2026/)).toBeInTheDocument();
  });

  it('lifts a block only after confirmation', async () => {
    const { onLift } = setup();
    fireEvent.click(screen.getByRole('button', { name: /lift block on room DLX-203/i }));
    expect(onLift).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /yes, lift/i }));
    await waitFor(() => expect(onLift).toHaveBeenCalledWith('k1'));
  });

  it('shows the empty state when nothing is blocked', () => {
    setup({ blocks: [] });
    expect(screen.getByText(/no rooms are blocked/i)).toBeInTheDocument();
  });
});
