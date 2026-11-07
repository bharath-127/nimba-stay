import { formatDisplayDate } from '../../utils/dates.js';
import { formatINR, pluralize } from '../../utils/format.js';

function Row({ label, value, strong = false, note }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 text-sm">
      <dt className="text-slate-500">
        {label}
        {note && <span className="block text-xs text-slate-400">{note}</span>}
      </dt>
      <dd className={`text-right ${strong ? 'text-base font-semibold text-slate-900' : 'font-medium text-slate-800'}`}>{value}</dd>
    </div>
  );
}

/**
 * Room, dates and price for the selected stay. Every figure comes from the
 * availability response the server computed — nothing is calculated here.
 * Optionally prefixed by the guest's details (review step).
 */
export default function StaySummary({ room, checkIn, checkOut, guest, className = '' }) {
  const charged = room.chargedNights ?? room.nights;
  const minimumApplied = charged > room.nights;

  return (
    <dl className={`divide-y divide-sand-200 rounded-lg border border-sand-200 bg-sand-50 px-4 ${className}`}>
      {guest && (
        <>
          <Row label="Guest name" value={guest.guestName} />
          <Row label="Mobile number" value={guest.phone} />
        </>
      )}
      <Row label="Room" value={`${room.roomNumber} · ${room.category}`} note={room.bedCount ? pluralize(room.bedCount, 'bed') : undefined} />
      <Row label="Check-in" value={formatDisplayDate(checkIn)} />
      <Row label="Check-out" value={formatDisplayDate(checkOut)} />
      <Row
        label="Rate"
        value={`${formatINR(room.pricePerNight)} × ${pluralize(charged, 'night')}`}
        note={minimumApplied ? `${pluralize(room.nights, 'night')} stay · charged for the ${charged}-night minimum` : undefined}
      />
      <Row label="Total booking amount" value={formatINR(room.totalPrice)} strong />
    </dl>
  );
}
