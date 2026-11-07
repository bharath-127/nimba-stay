import { useState } from 'react';
import Button from '../ui/Button.jsx';
import Alert from '../ui/Alert.jsx';
import Spinner from '../ui/Spinner.jsx';
import BookingStatusBadge, { StayPhase } from './BookingStatusBadge.jsx';
import { formatDisplayDate, formatTimestamp, todayIso } from '../../utils/dates.js';
import { formatINR, pluralize } from '../../utils/format.js';
import { bookingPhase, canCancel, canCheckOut } from '../../utils/bookingStatus.js';

/** Two-step inline confirmation — no native dialog, keyboard and screen-reader friendly. */
function ConfirmAction({ label, confirmLabel, prompt, variant = 'danger', ariaLabel, busy, onConfirm }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button variant={variant} size="sm" onClick={() => setConfirming(true)} aria-label={ariaLabel}>
        {label}
      </Button>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-end gap-2" role="group" aria-label={`Confirm: ${ariaLabel}`}>
      <span className="text-xs text-slate-500">{prompt}</span>
      <Button variant={variant} size="sm" loading={busy} onClick={onConfirm}>
        {confirmLabel}
      </Button>
      <Button variant="ghost" size="sm" disabled={busy} onClick={() => setConfirming(false)}>
        Keep
      </Button>
    </div>
  );
}

function Actions({ booking, today, busy, onCancel, onCheckOut }) {
  const actions = [];
  if (canCheckOut(booking, today)) {
    actions.push(
      <ConfirmAction
        key="checkout"
        label="Check out"
        confirmLabel="Yes, check out"
        prompt="Leaving today? Remaining nights are freed."
        variant="secondary"
        ariaLabel={`Check out ${booking.guestName}`}
        busy={busy}
        onConfirm={() => onCheckOut(booking.id)}
      />
    );
  }
  if (canCancel(booking, today)) {
    actions.push(
      <ConfirmAction
        key="cancel"
        label="Cancel"
        confirmLabel="Yes, cancel"
        prompt="Free the room?"
        ariaLabel={`Cancel booking for ${booking.guestName}`}
        busy={busy}
        onConfirm={() => onCancel(booking.id)}
      />
    );
  }
  if (actions.length === 0) return null;
  return <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div>;
}

function StatusCell({ booking, today }) {
  const phase = bookingPhase(booking, today);
  return (
    <div className="flex flex-col items-start gap-1">
      <BookingStatusBadge status={booking.status} />
      {booking.status === 'confirmed' && <StayPhase phase={phase} />}
      {booking.status === 'checked_out' && booking.checkedOutOn && booking.checkedOutOn < booking.checkOut && (
        <span className="text-xs text-slate-500">Left early on {formatDisplayDate(booking.checkedOutOn)}</span>
      )}
    </div>
  );
}

const muted = (b) => b.status !== 'confirmed';

/**
 * Latest bookings with clear status indicators, a check-out action for
 * guests in house, and a cancel action. Both call the API, which releases
 * the room's reserved nights — the dashboard then refreshes availability
 * and the summary cards. A table from `md` up; stacked cards on phones.
 */
export default function RecentBookings({ bookings, loading, error, busyId, actionError, onCancel, onCheckOut, onRefresh }) {
  const today = todayIso();

  if (error) {
    return (
      <Alert tone="error" title="Could not load bookings" action={<Button variant="secondary" size="sm" onClick={onRefresh}>Try again</Button>}>
        {error.message}
      </Alert>
    );
  }

  if (loading && bookings.length === 0) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
        <Spinner className="h-4 w-4" /> Loading bookings…
      </div>
    );
  }

  if (bookings.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-500">No bookings yet. Confirmed bookings will appear here.</p>;
  }

  return (
    <div className="space-y-3">
      {actionError && (
        <Alert tone="error" title="Could not update the booking">
          {actionError.message}
        </Alert>
      )}

      {/* Phones: stacked cards */}
      <ul className="space-y-3 md:hidden" aria-label="Recent bookings">
        {bookings.map((b) => (
          <li key={b.id} className={`rounded-lg border p-4 ${muted(b) ? 'border-slate-200 bg-slate-50' : 'border-sand-200 bg-white'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className={`font-medium ${b.status === 'cancelled' ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-900'}`}>{b.guestName}</p>
                <p className="text-xs text-slate-500">{b.phone}</p>
              </div>
              <StatusCell booking={b} today={today} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Room</dt>
                <dd className="font-medium text-slate-800">
                  {b.room?.roomNumber ?? '—'} <span className="font-normal text-slate-500">· {b.room?.category}</span>
                </dd>
              </div>
              <div className="text-right">
                <dt className="text-xs text-slate-500">Total</dt>
                <dd className="font-semibold text-slate-900">{formatINR(b.totalPrice)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-slate-500">
                  Stay · {pluralize(b.nights, 'night')}
                  {b.chargedNights > b.nights ? ` · charged ${b.chargedNights}` : ''}
                </dt>
                <dd className="text-slate-800">
                  {formatDisplayDate(b.checkIn)} → {formatDisplayDate(b.checkOut)}
                </dd>
              </div>
            </dl>
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-sand-100 pt-3">
              <span className="text-xs text-slate-400">Booked {formatTimestamp(b.createdAt)}</span>
              <Actions booking={b} today={today} busy={busyId === b.id} onCancel={onCancel} onCheckOut={onCheckOut} />
            </div>
          </li>
        ))}
      </ul>

      {/* Tablet and up: table */}
      <div className="-mx-5 hidden overflow-x-auto px-5 md:block">
        <table className="min-w-full text-left text-sm">
          <caption className="sr-only">Recent bookings, newest first</caption>
          <thead>
            <tr className="border-b border-sand-200 text-[11px] uppercase tracking-wide text-slate-500">
              <th scope="col" className="py-2 pr-4 font-semibold">Guest</th>
              <th scope="col" className="py-2 pr-4 font-semibold">Room</th>
              <th scope="col" className="py-2 pr-4 font-semibold">Stay</th>
              <th scope="col" className="py-2 pr-4 text-right font-semibold">Total</th>
              <th scope="col" className="py-2 pr-4 font-semibold">Status</th>
              <th scope="col" className="py-2 pr-4 font-semibold">Booked</th>
              <th scope="col" className="py-2 font-semibold"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-100">
            {bookings.map((b) => (
              <tr key={b.id} className={muted(b) ? 'bg-slate-50/60 text-slate-500' : 'text-slate-800'}>
                <td className="py-3 pr-4">
                  <p className={`font-medium ${b.status === 'cancelled' ? 'line-through decoration-slate-300' : ''}`}>{b.guestName}</p>
                  <p className="text-xs text-slate-500">{b.phone}</p>
                </td>
                <td className="whitespace-nowrap py-3 pr-4">
                  {b.room?.roomNumber ?? '—'}
                  <span className="block text-xs text-slate-500">{b.room?.category}</span>
                </td>
                <td className="whitespace-nowrap py-3 pr-4">
                  {formatDisplayDate(b.checkIn)} → {formatDisplayDate(b.checkOut)}
                  <span className="block text-xs text-slate-500">
                    {pluralize(b.nights, 'night')}
                    {b.chargedNights > b.nights ? ` · charged for ${b.chargedNights}` : ''}
                  </span>
                </td>
                <td className="whitespace-nowrap py-3 pr-4 text-right font-medium">{formatINR(b.totalPrice)}</td>
                <td className="py-3 pr-4">
                  <StatusCell booking={b} today={today} />
                </td>
                <td className="whitespace-nowrap py-3 pr-4 text-xs text-slate-500">{formatTimestamp(b.createdAt)}</td>
                <td className="py-3 text-right">
                  <Actions booking={b} today={today} busy={busyId === b.id} onCancel={onCancel} onCheckOut={onCheckOut} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
