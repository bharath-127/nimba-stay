import { useEffect, useState } from 'react';
import Input from '../ui/Input.jsx';
import Button from '../ui/Button.jsx';
import Alert from '../ui/Alert.jsx';
import { formatDisplayDate } from '../../utils/dates.js';
import { formatINR, pluralize } from '../../utils/format.js';
import { validateGuest, hasErrors } from '../../utils/validation.js';

function Row({ label, value, strong = false }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`text-right ${strong ? 'text-base font-semibold text-slate-900' : 'font-medium text-slate-800'}`}>{value}</dd>
    </div>
  );
}

/**
 * Guest details for the selected room. Everything shown in the summary
 * (nights, rate, total) comes from the availability response — the client
 * never computes or submits a price.
 */
export default function BookingForm({ room, checkIn, checkOut, submitting, error, onSubmit, onCancel, onRefreshAvailability }) {
  const [values, setValues] = useState({ guestName: '', phone: '' });
  const [errors, setErrors] = useState({});

  // Merge server-side validation details into the field errors when they arrive.
  useEffect(() => {
    if (error?.isValidation) setErrors((prev) => ({ ...prev, ...error.fieldErrors }));
  }, [error]);

  const update = (field) => (e) => {
    const next = { ...values, [field]: e.target.value };
    setValues(next);
    if (errors[field]) setErrors(validateGuest(next));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (submitting) return;
    const nextErrors = validateGuest(values);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;
    onSubmit({ roomId: room.id, guestName: values.guestName.trim(), phone: values.phone.trim(), checkIn, checkOut });
  };

  const showBanner = error && !error.isValidation;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5" aria-label="Guest booking form">
      <dl className="rounded-lg border border-sand-200 bg-sand-50 px-4 py-2 divide-y divide-sand-200">
        <Row label="Room" value={`${room.roomNumber} · ${room.category}`} />
        <Row label="Check-in" value={formatDisplayDate(checkIn)} />
        <Row label="Check-out" value={formatDisplayDate(checkOut)} />
        <Row label="Rate" value={`${formatINR(room.pricePerNight)} × ${pluralize(room.nights, 'night')}`} />
        <Row label="Total booking amount" value={formatINR(room.totalPrice)} strong />
      </dl>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          id="guestName"
          label="Guest full name"
          type="text"
          autoComplete="name"
          placeholder="e.g. Asha Mehta"
          value={values.guestName}
          onChange={update('guestName')}
          error={errors.guestName}
          disabled={submitting}
          maxLength={80}
          required
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
          disabled={submitting}
          maxLength={10}
          required
        />
      </div>

      {showBanner && (
        <Alert
          tone={error.isConflict ? 'warning' : 'error'}
          title={
            error.isConflict
              ? 'This room was just booked by someone else'
              : error.isNetworkError
                ? 'Cannot reach the server'
                : 'Booking failed'
          }
          action={
            error.isConflict ? (
              <Button variant="secondary" size="sm" onClick={onRefreshAvailability}>
                Refresh availability
              </Button>
            ) : undefined
          }
        >
          {error.message}
        </Alert>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onCancel} disabled={submitting}>
          Back to rooms
        </Button>
        <Button type="submit" size="lg" loading={submitting}>
          {submitting ? 'Confirming…' : `Confirm booking · ${formatINR(room.totalPrice)}`}
        </Button>
      </div>
    </form>
  );
}
