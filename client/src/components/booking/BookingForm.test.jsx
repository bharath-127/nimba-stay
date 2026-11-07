import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BookingForm, { BOOKING_FORM_ID } from './BookingForm.jsx';

const room = { id: 'r1', roomNumber: 'DLX-201', category: 'Deluxe', bedCount: 2, pricePerNight: 5500, nights: 3, chargedNights: 3, totalPrice: 16500 };

function setup(props = {}) {
  const onSubmit = vi.fn();
  const view = render(
    <>
      <BookingForm room={room} checkIn="2026-11-20" checkOut="2026-11-23" onSubmit={onSubmit} {...props} />
      <button type="submit" form={BOOKING_FORM_ID}>
        Review booking
      </button>
    </>
  );
  return { onSubmit, ...view };
}

describe('BookingForm (details step)', () => {
  it('shows the selected room, dates and server-computed total', () => {
    setup();
    expect(screen.getByText('DLX-201')).toBeInTheDocument();
    expect(screen.getByText('Deluxe')).toBeInTheDocument();
    expect(screen.getByText('Fri, 20 Nov 2026')).toBeInTheDocument();
    expect(screen.getByText('₹5,500 × 3 nights')).toBeInTheDocument();
    expect(screen.getByText('Mon, 23 Nov 2026')).toBeInTheDocument();
    expect(screen.getByText('₹16,500')).toBeInTheDocument();
  });

  it('rejects an invalid phone locally and does not submit', () => {
    const { onSubmit } = setup();
    fireEvent.change(screen.getByLabelText(/guest full name/i), { target: { value: 'Asha Mehta' } });
    fireEvent.change(screen.getByLabelText(/mobile number/i), { target: { value: '12345' } });
    fireEvent.click(screen.getByRole('button', { name: /review booking/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/exactly 10 digits/i);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects a blank name', () => {
    const { onSubmit } = setup();
    fireEvent.change(screen.getByLabelText(/mobile number/i), { target: { value: '9876543210' } });
    fireEvent.click(screen.getByRole('button', { name: /review booking/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/full name/i);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('passes trimmed guest details to the parent', () => {
    const { onSubmit } = setup();
    fireEvent.change(screen.getByLabelText(/guest full name/i), { target: { value: '  Asha Mehta ' } });
    fireEvent.change(screen.getByLabelText(/mobile number/i), { target: { value: '9876543210' } });
    fireEvent.click(screen.getByRole('button', { name: /review booking/i }));
    expect(onSubmit).toHaveBeenCalledWith({ guestName: 'Asha Mehta', phone: '9876543210' });
  });

  it('shows server field errors passed in by the panel', () => {
    setup({ serverErrors: { phone: 'Phone number must be exactly 10 digits' } });
    expect(screen.getByRole('alert')).toHaveTextContent(/exactly 10 digits/i);
  });

  it('prefills previously entered values', () => {
    setup({ initialValues: { guestName: 'Ravi Patel', phone: '9123456780' } });
    expect(screen.getByLabelText(/guest full name/i)).toHaveValue('Ravi Patel');
    expect(screen.getByLabelText(/mobile number/i)).toHaveValue('9123456780');
  });
});
