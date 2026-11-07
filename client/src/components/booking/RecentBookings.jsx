import { useState } from 'react';
import Button from '../ui/Button.jsx';
import Alert from '../ui/Alert.jsx';
import Badge, { categoryTone } from '../ui/Badge.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import Icon from '../ui/Icon.jsx';
import Spinner from '../ui/Spinner.jsx';
import BookingStatusBadge, { StayPhase } from './BookingStatusBadge.jsx';
import { formatDisplayDate, formatTimestamp, todayIso } from '../../utils/dates.js';
import { formatINR, pluralize } from '../../utils/format.js';
import { bookingPhase, canCancel, canCheckOut } from '../../utils/bookingStatus.js';

/** "Fri, 20 Nov" — the year is noise inside a table of recent stays. */
const shortDate = (iso) => formatDisplayDate(iso).replace(/ \d{4}$/, '');

/** "Asha Mehta" → "AM"; single names use their first two letters. */
export function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '·';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Avatar({ name, muted }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-1 ring-inset ${
        muted ? 'bg-sand-100 text-ink-400 ring-sand-200' : 'bg-brand-100 text-brand-800 ring-brand-200'
      }`}
    >
      {initials(name)}
    </span>
  );
}

/** Two-step inline confirmation — no native dialog, keyboard and screen-reader friendly. */
function ConfirmAction({ label, confirmLabel, prompt, variant = 'danger', icon, ariaLabel, busy, onConfirm }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button variant={variant} size="sm" icon={icon} onClick={() => setConfirming(true)} aria-label={ariaLabel}>
        {label}
      </Button>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 rounded-lg bg-sand-50 px-2 py-1.5 ring-1 ring-inset ring-sand-200" role="group" aria-label={`Confirm: ${ariaLabel}`}>
      <span className="text-xs text-ink-500">{prompt}</span>
      <Button variant={variant === 'danger' ? 'danger' : 'primary'} size="sm" loading={busy} onClick={onConfirm}>
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
        icon={<Icon name="logout" className="h-3.5 w-3.5" strokeWidth={2} />}
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

function StatusCell({ booking, today, align = 'start' }) {
  const phase = bookingPhase(booking, today);
  const leftEarly = booking.status === 'checked_out' && booking.checkedOutOn && booking.checkedOutOn < booking.checkOut;
  return (
    <div className={`flex flex-col gap-1 ${align === 'end' ? 'items-end text-right' : 'items-start'}`}>
      <BookingStatusBadge status={booking.status} />
      {booking.status === 'confirmed' && <StayPhase phase={phase} />}
      {leftEarly && <span className="text-xs text-ink-500">Left early on {formatDisplayDate(booking.checkedOutOn)}</span>}
    </div>
  );
}

function StayRange({ booking }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <Icon name="calendar" className="h-4 w-4 shrink-0 text-ink-400" />
      <span>
        {shortDate(booking.checkIn)} <span className="text-ink-400">→</span> {shortDate(booking.checkOut)}
        <span className="text-ink-400"> · </span>
        {pluralize(booking.nights, 'night')}
      </span>
    </span>
  );
}

const isMuted = (b) => b.status === 'cancelled';
const isCalm = (b) => b.status === 'checked_out';

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
      <Alert
        tone="error"
        title="Could not load bookings"
        action={
          <Button variant="secondary" size="sm" icon={<Icon name="refresh" className="h-4 w-4" />} onClick={onRefresh}>
            Try again
          </Button>
        }
      >
        {error.message}
      </Alert>
    );
  }

  if (loading && bookings.length === 0) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-ink-500">
        <Spinner className="h-4 w-4" /> Loading bookings…
      </div>
    );
  }

  if (bookings.length === 0) {
    return <EmptyState compact title="No bookings yet" description="Confirmed bookings will appear here as soon as a guest is booked in." />;
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
        {bookings.map((b, i) => {
          const muted = isMuted(b);
          return (
            <li key={b.id} className={`surface rise-in p-4 ${muted ? 'bg-sand-50/70' : ''}`} style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={b.guestName} muted={muted || isCalm(b)} />
                  <div className="min-w-0">
                    <p className={`truncate font-medium ${muted ? 'text-ink-400 line-through decoration-ink-300' : 'text-ink-900'}`}>{b.guestName}</p>
                    <p className="flex items-center gap-1 text-xs text-ink-500">
                      <Icon name="phone" className="h-3 w-3" /> {b.phone}
                    </p>
                  </div>
                </div>
                <StatusCell booking={b} today={today} align="end" />
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-400">Room</dt>
                  <dd className="mt-0.5 flex flex-wrap items-center gap-1.5 font-medium text-ink-800">
                    <span className="font-display">{b.room?.roomNumber ?? '—'}</span>
                    {b.room?.category && <Badge tone={categoryTone(b.room.category)}>{b.room.category}</Badge>}
                  </dd>
                </div>
                <div className="text-right">
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-400">Total</dt>
                  <dd className="tnum mt-0.5 font-semibold text-ink-900">{formatINR(b.totalPrice)}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-400">Stay</dt>
                  <dd className="mt-0.5 text-ink-800">
                    <StayRange booking={b} />
                  </dd>
                </div>
              </dl>

              <div className="mt-4 flex items-center justify-between gap-3 border-t divider-sand pt-3">
                <span className="text-xs text-ink-400">Booked {formatTimestamp(b.createdAt)}</span>
                <Actions booking={b} today={today} busy={busyId === b.id} onCancel={onCancel} onCheckOut={onCheckOut} />
              </div>
            </li>
          );
        })}
      </ul>

      {/* Tablet and up: table */}
      <div className="-mx-5 hidden overflow-x-auto px-5 sm:-mx-6 sm:px-6 md:block">
        <table className="min-w-full text-left text-sm">
          <caption className="sr-only">Recent bookings, newest first</caption>
          <thead>
            <tr className="border-b divider-sand text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
              <th scope="col" className="py-2.5 pr-4">Guest</th>
              <th scope="col" className="py-2.5 pr-4">Room</th>
              <th scope="col" className="py-2.5 pr-4">Stay</th>
              <th scope="col" className="py-2.5 pr-4 text-right">Total</th>
              <th scope="col" className="py-2.5 pr-4">Status</th>
              <th scope="col" className="py-2.5 pr-4">Booked</th>
              <th scope="col" className="py-2.5"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-100">
            {bookings.map((b) => {
              const muted = isMuted(b);
              return (
                <tr key={b.id} className={`group transition-colors ${muted ? 'bg-sand-50/50 text-ink-400' : isCalm(b) ? 'text-ink-600' : 'text-ink-800 hover:bg-sand-50/60'}`}>
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={b.guestName} muted={muted || isCalm(b)} />
                      <div className="min-w-0">
                        <p className={`font-medium ${muted ? 'line-through decoration-ink-300' : 'text-ink-900'}`}>{b.guestName}</p>
                        <p className="flex items-center gap-1 text-xs text-ink-500">
                          <Icon name="phone" className="h-3 w-3" /> {b.phone}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap py-3.5 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-base font-semibold">{b.room?.roomNumber ?? '—'}</span>
                      {b.room?.category && <Badge tone={categoryTone(b.room.category)}>{b.room.category}</Badge>}
                    </div>
                  </td>
                  <td className="whitespace-nowrap py-3.5 pr-4">
                    <StayRange booking={b} />
                  </td>
                  <td className="tnum whitespace-nowrap py-3.5 pr-4 text-right font-semibold text-ink-900">{formatINR(b.totalPrice)}</td>
                  <td className="py-3.5 pr-4">
                    <StatusCell booking={b} today={today} />
                  </td>
                  <td className="whitespace-nowrap py-3.5 pr-4 text-xs text-ink-400">{formatTimestamp(b.createdAt)}</td>
                  <td className="py-3.5 text-right">
                    <div className="transition-opacity md:opacity-70 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                      <Actions booking={b} today={today} busy={busyId === b.id} onCancel={onCancel} onCheckOut={onCheckOut} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
