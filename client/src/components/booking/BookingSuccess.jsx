import { forwardRef } from 'react';
import Icon from '../ui/Icon.jsx';
import BookingStatusBadge from './BookingStatusBadge.jsx';
import { formatDisplayDate } from '../../utils/dates.js';
import { formatINR, pluralize } from '../../utils/format.js';

function Fact({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">{label}</dt>
      <dd className="mt-0.5 truncate text-sm font-medium text-ink-900">{value}</dd>
    </div>
  );
}

const BookingSuccess = forwardRef(function BookingSuccess({ booking }, headingRef) {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <div className="flex flex-col items-center px-2 pt-2 text-center rise-in">
        <span className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-700" aria-hidden="true">
          <span className="absolute inset-0 rounded-full bg-brand-200/60 motion-safe:animate-ping [animation-iteration-count:1]" />
          <Icon name="check" className="relative h-8 w-8" strokeWidth={2.4} />
        </span>
        <p ref={headingRef} tabIndex={-1} className="font-display text-2xl font-semibold text-ink-900 focus:outline-none">
          Booking confirmed
        </p>
        <p className="mt-1 max-w-sm text-sm text-ink-500">
          Room {booking.room?.roomNumber} is reserved for {booking.guestName}. The nights are locked — nobody else can take them.
        </p>
        <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-sand-100 px-3 py-1 font-mono text-[11px] text-ink-700 ring-1 ring-inset ring-sand-200">
          <Icon name="tag" className="h-3.5 w-3.5 text-ink-400" />
          Ref {booking.id}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl border border-sand-200 bg-sand-50/70 p-4 rise-in rise-in-delay-1">
        <Fact label="Guest" value={booking.guestName} />
        <Fact label="Mobile" value={booking.phone} />
        <Fact label="Room" value={`${booking.room?.roomNumber} · ${booking.room?.category}`} />
        <Fact label="Stay" value={pluralize(booking.nights, 'night')} />
        <Fact label="Check-in" value={formatDisplayDate(booking.checkIn)} />
        <Fact label="Check-out" value={formatDisplayDate(booking.checkOut)} />
        <div className="col-span-2 flex items-center justify-between border-t divider-sand pt-4">
          <dt className="text-sm font-medium text-ink-700">Total amount</dt>
          <dd className="flex items-center gap-3">
            <BookingStatusBadge status={booking.status} />
            <span className="font-display text-xl font-semibold text-ink-900 tnum">{formatINR(booking.totalPrice)}</span>
          </dd>
        </div>
      </dl>

      <p className="text-center text-xs text-ink-400">Collect a photo ID at check-in · payment is settled at the desk</p>
    </div>
  );
});

export default BookingSuccess;
