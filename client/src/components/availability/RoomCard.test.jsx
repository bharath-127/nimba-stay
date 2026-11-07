import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RoomCard from './RoomCard.jsx';

const room = { id: 'r1', roomNumber: 'DLX-201', category: 'Deluxe', bedCount: 2, pricePerNight: 5500, nights: 3, chargedNights: 3, totalPrice: 16500, status: 'available' };

describe('RoomCard', () => {
  it('shows room number, category, guests, area, nightly rate and the stay total', () => {
    render(<RoomCard room={room} onSelect={() => {}} />);
    expect(screen.getByRole('heading', { name: /^DLX-201$/ })).toBeInTheDocument();
    expect(screen.getByText('Deluxe')).toBeInTheDocument();
    expect(screen.getByText('2 Guests')).toBeInTheDocument();
    expect(screen.getByText('250 sq.ft')).toBeInTheDocument();
    expect(screen.getByText('₹5,500')).toBeInTheDocument();
    expect(screen.getByText('/ night')).toBeInTheDocument();
    expect(screen.getByText('Total for 3 nights')).toBeInTheDocument();
    expect(screen.getByText('₹16,500')).toBeInTheDocument();
  });

  it('charges one night for a one-night stay and never mentions a minimum', () => {
    render(<RoomCard room={{ ...room, nights: 1, chargedNights: 1, totalPrice: 5500, bedCount: 1 }} onSelect={() => {}} />);
    expect(screen.queryByText(/minimum/i)).not.toBeInTheDocument();
    expect(screen.getByText('Total for 1 night')).toBeInTheDocument();
    expect(screen.getByText('1 Guest')).toBeInTheDocument();
    expect(screen.getAllByText('₹5,500')).toHaveLength(2); // rate and total
  });

  it('omits the area for a category it has no size for', () => {
    render(<RoomCard room={{ ...room, category: 'Penthouse' }} onSelect={() => {}} />);
    expect(screen.queryByText(/sq\.ft/)).not.toBeInTheDocument();
  });

  it('hides the category badge when asked', () => {
    render(<RoomCard room={room} onSelect={() => {}} showCategory={false} />);
    expect(screen.queryByText('Deluxe')).not.toBeInTheDocument();
  });

  it('calls onSelect with the room when Book Now is clicked', () => {
    const onSelect = vi.fn();
    render(<RoomCard room={room} onSelect={onSelect} />);
    const button = screen.getByRole('button', { name: /book now/i });
    expect(button).toHaveAttribute('aria-haspopup', 'dialog');
    fireEvent.click(button);
    expect(onSelect).toHaveBeenCalledWith(room);
  });

  it('reflects the selected state', () => {
    render(<RoomCard room={room} selected onSelect={() => {}} />);
    const button = screen.getByRole('button', { name: /selected/i });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('article')).toHaveAttribute('aria-selected', 'true');
  });
});
