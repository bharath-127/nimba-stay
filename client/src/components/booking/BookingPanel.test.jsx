import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import BookingPanel from './BookingPanel.jsx';
import { ApiError } from '../../services/api.js';

const room = { id: 'r1', roomNumber: 'DLX-201', category: 'Deluxe', bedCount: 2, pricePerNight: 5500, nights: 3, chargedNights: 3, totalPrice: 16500 };
const confirmed = {
  id: '6aeef3e678bcf59986415778',
  room: { id: 'r1', roomNumber: 'DLX-201', category: 'Deluxe' },
  guestName: 'Asha Mehta',
  phone: '9876543210',
  checkIn: '2026-11-20',
  checkOut: '2026-11-23',
  nights: 3,
  pricePerNight: 5500,
  totalPrice: 16500,
  status: 'confirmed',
};

function setup(props = {}) {
  const handlers = {
    onConfirm: vi.fn().mockResolvedValue({ ok: true, booking: confirmed }),
    onClose: vi.fn(),
    onChooseAnotherRoom: vi.fn(),
  };
  const utils = render(
    <BookingPanel room={room} checkIn="2026-11-20" checkOut="2026-11-23" submitting={false} {...handlers} {...props} />
  );
  return { ...handlers, ...utils };
}

function fillAndReview(name = 'Asha Mehta', phone = '9876543210') {
  fireEvent.change(screen.getByLabelText(/guest full name/i), { target: { value: name } });
  fireEvent.change(screen.getByLabelText(/mobile number/i), { target: { value: phone } });
  fireEvent.click(screen.getByRole('button', { name: /review booking/i }));
}

describe('BookingPanel', () => {
  it('opens as an accessible modal dialog labelled by its title, focused on the name field', () => {
    setup();
    const dialog = screen.getByRole('dialog', { name: /book room DLX-201/i });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByLabelText(/guest full name/i)).toHaveFocus();
  });

  it('shows a review of guest, room, dates and total before anything is sent', () => {
    const { onConfirm } = setup();
    fillAndReview();

    expect(screen.getByRole('dialog', { name: /review booking/i })).toBeInTheDocument();
    const summary = screen.getByText('Guest name').closest('dl');
    expect(within(summary).getByText('Asha Mehta')).toBeInTheDocument();
    expect(within(summary).getByText('9876543210')).toBeInTheDocument();
    expect(within(summary).getByText('DLX-201')).toBeInTheDocument();
    expect(within(summary).getByText('Deluxe')).toBeInTheDocument();
    expect(within(summary).getByText('Fri, 20 Nov 2026')).toBeInTheDocument();
    expect(within(summary).getByText('Mon, 23 Nov 2026')).toBeInTheDocument();
    expect(within(summary).getByText('₹16,500')).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('does not reach review with an invalid phone', () => {
    setup();
    fillAndReview('Asha Mehta', '98765');
    expect(screen.getByRole('dialog', { name: /book room/i })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/exactly 10 digits/i);
  });

  it('Edit details returns to the form with the values kept', () => {
    setup();
    fillAndReview();
    fireEvent.click(screen.getByRole('button', { name: /edit details/i }));
    expect(screen.getByLabelText(/guest full name/i)).toHaveValue('Asha Mehta');
  });

  it('confirms with the exact payload and shows the confirmation', async () => {
    const { onConfirm } = setup();
    fillAndReview();
    fireEvent.click(screen.getByRole('button', { name: /confirm booking/i }));

    expect(onConfirm).toHaveBeenCalledWith({
      roomId: 'r1',
      guestName: 'Asha Mehta',
      phone: '9876543210',
      checkIn: '2026-11-20',
      checkOut: '2026-11-23',
    });
    expect(await screen.findByRole('dialog', { name: /booking confirmed/i })).toBeInTheDocument();
    expect(screen.getByText(/Ref 6aeef3e678bcf59986415778/)).toBeInTheDocument();
  });

  it('on 409 shows the conflict and replaces confirm with "Choose another room"', async () => {
    const error = new ApiError({ status: 409, code: 'ROOM_ALREADY_BOOKED', message: 'This room is no longer available for the selected dates' });
    const { onChooseAnotherRoom } = setup({ onConfirm: vi.fn().mockResolvedValue({ ok: false, error }) });
    fillAndReview();
    fireEvent.click(screen.getByRole('button', { name: /confirm booking/i }));

    expect(await screen.findByText(/this room is no longer available$/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /confirm booking/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /choose another room/i }));
    expect(onChooseAnotherRoom).toHaveBeenCalled();
  });

  it('on 400 returns to the details step with the server field error', async () => {
    const error = new ApiError({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Invalid request',
      details: [{ field: 'phone', message: 'Phone number must be exactly 10 digits' }],
    });
    setup({ onConfirm: vi.fn().mockResolvedValue({ ok: false, error }) });
    fillAndReview();
    fireEvent.click(screen.getByRole('button', { name: /confirm booking/i }));

    await waitFor(() => expect(screen.getByRole('dialog', { name: /book room/i })).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent(/exactly 10 digits/i);
  });

  it('on a network error keeps the review step so confirm can be retried', async () => {
    const error = new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'Cannot reach the Nimba Stay server.' });
    setup({ onConfirm: vi.fn().mockResolvedValue({ ok: false, error }) });
    fillAndReview();
    fireEvent.click(screen.getByRole('button', { name: /confirm booking/i }));

    expect(await screen.findByText(/cannot reach the server/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm booking/i })).toBeEnabled();
  });

  it('cannot be closed or re-submitted while the request is in flight', () => {
    const { onClose, rerender, onConfirm } = setup();
    fillAndReview();
    rerender(
      <BookingPanel room={room} checkIn="2026-11-20" checkOut="2026-11-23" submitting onConfirm={onConfirm} onClose={onClose} onChooseAnotherRoom={() => {}} />
    );
    expect(screen.getByRole('button', { name: /confirming/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /close panel/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /edit details/i })).toBeDisabled();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('Escape closes the panel when idle', () => {
    const { onClose } = setup();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
