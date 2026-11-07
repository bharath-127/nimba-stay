import { forwardRef } from 'react';
import BookingStatusBadge from './BookingStatusBadge.jsx';
import { formatDisplayDate } from '../../utils/dates.js';
import { formatINR, pluralize } from '../../utils/format.js';

const BookingSuccess = forwardRef(function BookingSuccess({ booking }, headingRef) {
  return (
    <div className="space-y-5" role="status" aria-live="polite">
      <div className="flex items-start gap-3 rounded-lg border border-brand-200 bg-brand-50 p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
        <div className="min-w-0">
          <p ref={headingRef} tabIndex={-1} className="font-semibold text-brand-900 focus:outline-none">
            Booking confirmed
          </p>
          <p className="mt-0.5 text-sm text-brand-800">
            Room {booking.room?.roomNumber} is reserved for {booking.guestName}.
          </p>
          <p className="mt-1 break-all font-mono text-xs text-brand-700">Ref {booking.id}</p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div>
          <dt className="text-slate-500">Guest</dt>
          <dd className="font-medium text-slate-900">{booking.guestName}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Mobile</dt>
          <dd className="font-medium text-slate-900">{booking.phone}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Room</dt>
          <dd className="font-medium text-slate-900">
            {booking.room?.roomNumber} · {booking.room?.category}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Stay</dt>
          <dd className="font-medium text-slate-900">{pluralize(booking.nights, 'night')}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Check-in</dt>
          <dd className="font-medium text-slate-900">{formatDisplayDate(booking.checkIn)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Check-out</dt>
          <dd className="font-medium text-slate-900">{formatDisplayDate(booking.checkOut)}</dd>
        </div>
        <div className="col-span-2 flex items-center justify-between border-t border-sand-200 pt-3">
          <dt className="text-slate-500">Total amount</dt>
          <dd className="flex items-center gap-3">
            <BookingStatusBadge status={booking.status} />
            <span className="text-lg font-semibold text-slate-900">{formatINR(booking.totalPrice)}</span>
          </dd>
        </div>
      </dl>
    </div>
  );
});

export default BookingSuccess;
