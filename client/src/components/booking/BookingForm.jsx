import { useState } from 'react';
import Input from '../ui/Input.jsx';
import Alert from '../ui/Alert.jsx';
import StaySummary from './StaySummary.jsx';
import { validateGuest, hasErrors } from '../../utils/validation.js';

export const BOOKING_FORM_ID = 'booking-details-form';

/**
 * Step 1 of the booking panel: guest details for the selected stay.
 * Submitting validates locally and hands the trimmed values to the parent,
 * which moves to the review step — no request is sent from here. The submit
 * button lives in the panel footer and targets this form by id.
 *
 * `serverErrors` are field errors returned by the API (400) after a confirm
 * attempt; `serverMessage` covers 400s for fields not shown on this form.
 */
export default function BookingForm({ room, checkIn, checkOut, initialValues, serverErrors = {}, serverMessage, onSubmit }) {
  const [values, setValues] = useState(initialValues ?? { guestName: '', phone: '' });
  const [errors, setErrors] = useState(serverErrors);

  const update = (field) => (e) => {
    const next = { ...values, [field]: e.target.value };
    setValues(next);
    if (errors[field]) setErrors(validateGuest(next));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = validateGuest(values);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;
    onSubmit({ guestName: values.guestName.trim(), phone: values.phone.trim() });
  };

  return (
    <form id={BOOKING_FORM_ID} onSubmit={handleSubmit} noValidate className="space-y-5" aria-label="Guest details">
      <StaySummary room={room} checkIn={checkIn} checkOut={checkOut} />

      {serverMessage && (
        <Alert tone="error" title="Please check the booking details">
          {serverMessage}
        </Alert>
      )}

      <div className="space-y-4">
        <Input
          id="guestName"
          label="Guest full name"
          type="text"
          autoComplete="name"
          placeholder="e.g. Asha Mehta"
          value={values.guestName}
          onChange={update('guestName')}
          error={errors.guestName}
          maxLength={80}
          required
          data-autofocus
        />
        <Input
          id="phone"
          label="Mobile number"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="10-digit mobile number"
          value={values.phone}
          onChange={update('phone')}
          error={errors.phone}
          hint="Exactly 10 digits, no spaces"
          maxLength={10}
          required
        />
      </div>
    </form>
  );
}
