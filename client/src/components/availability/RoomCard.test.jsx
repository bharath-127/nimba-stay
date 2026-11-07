import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RoomCard from './RoomCard.jsx';

const room = { id: 'r1', roomNumber: 'DLX-201', category: 'Deluxe', pricePerNight: 5500, nights: 3, totalPrice: 16500, status: 'available' };

describe('RoomCard', () => {
  it('shows room number, category, rate, nights, total and availability', () => {
    render(<RoomCard room={room} onSelect={() => {}} />);
    expect(screen.getByRole('heading', { name: /room DLX-201/i })).toBeInTheDocument();
    expect(screen.getByText('Deluxe')).toBeInTheDocument();
    expect(screen.getByText(/5,500 per night · 3 nights/)).toBeInTheDocument();
    expect(screen.getByText(/16,500/)).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('calls onSelect with the room when Book now is clicked', () => {
    const onSelect = vi.fn();
    render(<RoomCard room={room} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: /book now/i }));
    expect(onSelect).toHaveBeenCalledWith(room);
  });

  it('reflects the selected state', () => {
    render(<RoomCard room={room} selected onSelect={() => {}} />);
    expect(screen.getByRole('button', { name: /selected/i })).toHaveAttribute('aria-pressed', 'true');
  });
});
