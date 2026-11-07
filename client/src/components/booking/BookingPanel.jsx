import { useEffect, useRef, useState } from 'react';
import Drawer from '../ui/Drawer.jsx';
import Button from '../ui/Button.jsx';
import Icon from '../ui/Icon.jsx';
import BookingForm, { BOOKING_FORM_ID } from './BookingForm.jsx';
import BookingReview from './BookingReview.jsx';
import BookingSuccess from './BookingSuccess.jsx';
import { formatINR } from '../../utils/format.js';

const GUEST_FIELDS = ['guestName', 'phone'];
const STEPS = ['Details', 'Review', 'Done'];
const STEP_INDEX = { details: 0, review: 1, success: 2 };

/**
 * Booking side panel:  details  →  review  →  confirmed
 *
 * Only the review step talks to the API. `onConfirm` must resolve to
 * `{ ok, booking }` or `{ ok: false, error }` (see useCreateBooking); the
 * panel reacts to the result directly instead of reading hook state, so a
 * conflict is handled in the same tick it happens.
 *
 *  - 201 → confirmed step
 *  - 400 → back to details with the server's field errors
 *  - 409 → stays on review; confirm is replaced by "Choose another room"
 *          (retrying cannot succeed — the nights are taken)
 *  - network / 5xx → stays on review with the message; confirm can be retried
 *
 * The panel cannot be closed while a request is in flight.
 */
export default function BookingPanel({ room, checkIn, checkOut, submitting, onConfirm, onClose, onChooseAnotherRoom }) {
  const [step, setStep] = useState('details');
  const [guest, setGuest] = useState({ guestName: '', phone: '' });
  const [serverErrors, setServerErrors] = useState({});
  const [serverMessage, setServerMessage] = useState(null);
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState(null);
  const headingRef = useRef(null);

  // Move focus to the new step's heading so keyboard and screen-reader users follow along.
  useEffect(() => {
    if (step !== 'details') headingRef.current?.focus();
  }, [step]);

  const handleDetails = (values) => {
    setGuest(values);
    setError(null);
    setServerErrors({});
    setServerMessage(null);
    setStep('review');
  };

  const handleConfirm = async () => {
    if (submitting) return;
    setError(null);
    const result = await onConfirm({ roomId: room.id, ...guest, checkIn, checkOut });
    if (!result || result.skipped) return;

    if (result.ok) {
      setBooking(result.booking);
      setStep('success');
      return;
    }

    const err = result.error;
    if (err?.isValidation) {
      const fieldErrors = err.fieldErrors;
      const hasGuestFieldError = GUEST_FIELDS.some((f) => fieldErrors[f]);
      setServerErrors(fieldErrors);
      setServerMessage(hasGuestFieldError ? null : err.details?.[0]?.message ?? err.message);
      setStep('details');
      return;
    }
    setError(err);
  };

  const conflict = error?.isConflict;

  const titles = {
    details: `Book room ${room.roomNumber}`,
    review: 'Review booking',
    success: 'Booking confirmed',
  };
  const descriptions = {
    details: 'Enter the guest’s details for this stay',
    review: 'Confirm with the guest before reserving',
    success: 'The room is reserved for these nights',
  };

  let footer;
  if (step === 'details') {
    footer = (
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" form={BOOKING_FORM_ID} size="xl" icon={<Icon name="arrowRight" className="h-4 w-4" />} className="sm:min-w-56 flex-row-reverse">
          Review booking
        </Button>
      </div>
    );
  } else if (step === 'review') {
    footer = (
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" onClick={() => setStep('details')} disabled={submitting}>
          Edit details
        </Button>
        {conflict ? (
          <Button size="xl" onClick={onChooseAnotherRoom} icon={<Icon name="refresh" className="h-4 w-4" />}>
            Choose another room
          </Button>
        ) : (
          <Button size="xl" onClick={handleConfirm} loading={submitting} className="sm:min-w-56">
            {submitting ? 'Confirming…' : `Confirm booking · ${formatINR(room.totalPrice)}`}
          </Button>
        )}
      </div>
    );
  } else {
    footer = (
      <div className="flex justify-end">
        <Button size="xl" onClick={onClose} icon={<Icon name="check" className="h-4 w-4" strokeWidth={2.2} />} className="sm:min-w-40">
          Done
        </Button>
      </div>
    );
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={titles[step]}
      description={descriptions[step]}
      footer={footer}
      closeDisabled={submitting}
      steps={STEPS}
      step={STEP_INDEX[step]}
    >
      {step === 'details' && (
        <BookingForm
          key={JSON.stringify(serverErrors)}
          room={room}
          checkIn={checkIn}
          checkOut={checkOut}
          initialValues={guest}
          serverErrors={serverErrors}
          serverMessage={serverMessage}
          onSubmit={handleDetails}
        />
      )}
      {step === 'review' && (
        <BookingReview ref={headingRef} room={room} checkIn={checkIn} checkOut={checkOut} guest={guest} error={error} />
      )}
      {step === 'success' && booking && <BookingSuccess ref={headingRef} booking={booking} />}
    </Drawer>
  );
}
