import { forwardRef } from 'react';
import Alert from '../ui/Alert.jsx';
import Icon from '../ui/Icon.jsx';
import StaySummary from './StaySummary.jsx';

/**
 * Step 2 of the booking panel: everything the guest is agreeing to, shown
 * once more before the request is sent. The confirm button is in the panel
 * footer. Conflicts (409) and network failures are reported here.
 */
const BookingReview = forwardRef(function BookingReview({ room, checkIn, checkOut, guest, error }, headingRef) {
  return (
    <div className="space-y-5">
      <div className="rise-in">
        <h3 ref={headingRef} tabIndex={-1} className="font-display text-lg font-semibold text-ink-900 focus:outline-none">
          Confirm these details with the guest
        </h3>
        <p className="mt-1 text-sm text-ink-500">Read them back before you confirm — the room is only reserved once you do.</p>
      </div>

      <div className="rise-in rise-in-delay-1">
        <StaySummary room={room} checkIn={checkIn} checkOut={checkOut} guest={guest} />
      </div>

      <p className="flex items-center gap-2 text-xs text-ink-500">
        <Icon name="info" className="h-4 w-4 text-ink-400" />
        Total calculated by the server from the room&apos;s nightly rate.
      </p>

      {error && (
        <Alert
          tone={error.isConflict ? 'warning' : 'error'}
          title={
            error.isConflict
              ? 'This room is no longer available'
              : error.isNetworkError
                ? 'Cannot reach the server'
                : 'Booking failed'
          }
        >
          {error.isConflict
            ? `${error.message}. Another booking took these dates first — nothing was charged or saved. Pick another room from the refreshed list.`
            : error.message}
        </Alert>
      )}
    </div>
  );
});

export default BookingReview;
