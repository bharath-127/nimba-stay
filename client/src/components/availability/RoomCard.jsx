import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import { formatINR, pluralize } from '../../utils/format.js';

const categoryTone = {
  Standard: 'bg-slate-100 text-slate-700',
  Deluxe: 'bg-sky-100 text-sky-800',
  Premium: 'bg-violet-100 text-violet-800',
  Suite: 'bg-amber-100 text-amber-800',
};

/** One available room with the server-computed price for the stay. */
export default function RoomCard({ room, selected = false, onSelect, showCategory = true }) {
  const charged = room.chargedNights ?? room.nights;
  const minimumApplied = charged > room.nights;

  return (
    <article
      aria-selected={selected}
      className={`flex flex-col gap-4 rounded-lg border p-4 transition sm:flex-row sm:items-center sm:justify-between ${
        selected ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200' : 'border-sand-200 bg-white hover:border-brand-300'
      }`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-slate-900">Room {room.roomNumber}</h3>
          {showCategory && (
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${categoryTone[room.category] ?? categoryTone.Standard}`}>{room.category}</span>
          )}
          <Badge tone="success">Available</Badge>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {formatINR(room.pricePerNight)} per night · {pluralize(room.nights, 'night')}
          {room.bedCount ? ` · ${pluralize(room.bedCount, 'bed')}` : ''}
        </p>
        {minimumApplied && <p className="mt-0.5 text-xs text-amber-700">Charged for the {charged}-night minimum</p>}
      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Total stay</p>
          <p className="text-lg font-semibold text-slate-900">{formatINR(room.totalPrice)}</p>
        </div>
        <Button
          variant={selected ? 'secondary' : 'primary'}
          onClick={() => onSelect(room)}
          aria-pressed={selected}
          aria-haspopup="dialog"
          className="shrink-0"
        >
          {selected ? 'Selected' : 'Book now'}
        </Button>
      </div>
    </article>
  );
}
