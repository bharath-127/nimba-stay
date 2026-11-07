import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BookingForm from './BookingForm.jsx';
import { ApiError } from '../../services/api.js';

const room = { id: 'r1', roomNumber: 'DLX-201', category: 'Deluxe', pricePerNight: 5500, nights: 3, totalPrice: 16500 };

function setup(props = {}) {
  const onSubmit = vi.fn();
  render(
    <BookingForm
      room={room}
      checkIn="2026-11-20"
      checkOut="2026-11-23"
      submitting={false}
      error={null}
      onSubmit={onSubmit}
      onCancel={() => {}}
      onRefreshAvailability={() => {}}
      {...props}
    />
  );
  return { onSubmit };
}

describe('BookingForm', () => {
  it('shows the selected room, dates and server-computed total', () => {
    setup();
    expect(screen.getByText('DLX-201 · Deluxe')).toBeInTheDocument();
    expect(screen.getByText(/20 Nov 2026/)).toBeInTheDocument();
    expect(screen.getByText(/23 Nov 2026/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm booking/i })).toHaveTextContent('16,500');
  });

  it('rejects an invalid phone locally and does not submit', () => {
    const { onSubmit } = setup();
    fireEvent.change(screen.getByLabelText(/guest full name/i), { target: { value: 'Asha Mehta' } });
    fireEvent.change(screen.getByLabelText(/mobile number/i), { target: { value: '12345' } });
    fireEvent.click(screen.getByRole('button', { name: /confirm booking/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/exactly 10 digits/i);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits trimmed guest details with the room and dates', () => {
    const { onSubmit } = setup();
    fireEvent.change(screen.getByLabelText(/guest full name/i), { target: { value: '  Asha Mehta ' } });
    fireEvent.change(screen.getByLabelText(/mobile number/i), { target: { value: '9876543210' } });
    fireEvent.click(screen.getByRole('button', { name: /confirm booking/i }));
    expect(onSubmit).toHaveBeenCalledWith({
      roomId: 'r1',
      guestName: 'Asha Mehta',
      phone: '9876543210',
      checkIn: '2026-11-20',
      checkOut: '2026-11-23',
    });
  });

  it('disables the form while submitting', () => {
    setup({ submitting: true });
    expect(screen.getByRole('button', { name: /confirming/i })).toBeDisabled();
    expect(screen.getByLabelText(/mobile number/i)).toBeDisabled();
  });

  it('shows a conflict message with a refresh action', () => {
    const error = new ApiError({ status: 409, code: 'ROOM_ALREADY_BOOKED', message: 'This room is no longer available for the selected dates' });
    setup({ error });
    expect(screen.getByRole('status')).toHaveTextContent(/just booked by someone else/i);
    expect(screen.getByRole('button', { name: /refresh availability/i })).toBeInTheDocument();
  });

  it('maps server validation details onto the fields', () => {
    const error = new ApiError({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Invalid request',
      details: [{ field: 'phone', message: 'Phone number must be exactly 10 digits' }],
    });
    setup({ error });
    expect(screen.getByRole('alert')).toHaveTextContent(/exactly 10 digits/i);
  });

  it('shows a network error banner', () => {
    const error = new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'Cannot reach the Nimba Stay server.' });
    setup({ error });
    expect(screen.getByRole('alert')).toHaveTextContent(/cannot reach the server/i);
  });
});
