import Badge, { categoryTone } from '../ui/Badge.jsx';
import Icon from '../ui/Icon.jsx';
import { formatDisplayDate } from '../../utils/dates.js';
import { formatINR, pluralize } from '../../utils/format.js';

function Fact({ icon, label, value }) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">
        {icon && <Icon name={icon} className="h-3.5 w-3.5" />}
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-sm font-medium text-ink-900">{value}</dd>
    </div>
  );
}

/**
 * The "stay card": room, dates and price for the selected stay, optionally
 * headed by the guest's details (review step). Every figure comes from the
 * availability response the server computed — nothing is calculated here.
 * Rendered as one <dl> so the whole summary is a single description list.
 */
export default function StaySummary({ room, checkIn, checkOut, guest, className = '' }) {
  return (
    <dl className={`overflow-hidden rounded-xl border border-sand-200 bg-sand-50/70 ${className}`}>
      {guest && (
        <div className="grid grid-cols-2 gap-4 border-b divider-sand bg-white/60 px-4 py-3">
          <Fact icon="user" label="Guest name" value={guest.guestName} />
          <Fact icon="phone" label="Mobile number" value={guest.phone} />
        </div>
      )}

      <div className="px-4 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">Room</dt>
            <dd className="mt-0.5 flex flex-wrap items-center gap-2">
              <span className="font-display text-2xl font-semibold leading-none text-ink-900">{room.roomNumber}</span>
              <Badge tone={categoryTone(room.category)}>{room.category}</Badge>
            </dd>
          </div>
          {room.bedCount ? (
            <div className="shrink-0 text-right">
              <dt className="sr-only">Beds</dt>
              <dd className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-ink-700 ring-1 ring-inset ring-sand-200">
                <Icon name="bed" className="h-3.5 w-3.5 text-ink-400" />
                {pluralize(room.bedCount, 'bed')}
              </dd>
            </div>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Fact icon="calendar" label="Check-in" value={formatDisplayDate(checkIn)} />
          <Fact icon="calendar" label="Check-out" value={formatDisplayDate(checkOut)} />
          <Fact icon="moon" label="Rate" value={`${formatINR(room.pricePerNight)} × ${pluralize(room.nights, 'night')}`} />
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-4 border-t divider-sand bg-white/60 px-4 py-3">
        <dt className="text-sm font-medium text-ink-700">Total booking amount</dt>
        <dd className="font-display text-2xl font-semibold leading-none text-ink-900 tnum">{formatINR(room.totalPrice)}</dd>
      </div>
    </dl>
  );
}
