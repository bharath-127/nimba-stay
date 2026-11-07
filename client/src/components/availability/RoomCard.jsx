import Badge, { categoryTone } from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import Icon from '../ui/Icon.jsx';
import { formatINR, pluralize } from '../../utils/format.js';

const accent = {
  Standard: 'bg-cat-standard',
  Deluxe: 'bg-cat-deluxe',
  Premium: 'bg-cat-premium',
  Suite: 'bg-cat-suite',
};

/** One available room with the server-computed price for the stay. */
export default function RoomCard({ room, selected = false, onSelect, showCategory = true }) {
  return (
    <article
      aria-selected={selected}
      className={`surface surface-interactive relative overflow-hidden ${
        selected ? 'border-brand-500 ring-2 ring-brand-200' : ''
      }`}
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${accent[room.category] ?? 'bg-ink-300'}`} aria-hidden="true" />

      <div className="flex flex-col gap-4 p-4 pl-5 sm:flex-row sm:items-center sm:justify-between sm:p-5 sm:pl-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-xl font-semibold leading-none text-ink-900">Room {room.roomNumber}</h3>
            {showCategory && <Badge tone={categoryTone(room.category)}>{room.category}</Badge>}
            <Badge tone="success" dot>
              Available
            </Badge>
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-500">
            <Icon name="bed" className="h-4 w-4 shrink-0 text-ink-400" />
            {formatINR(room.pricePerNight)} per night · {pluralize(room.nights, 'night')}
            {room.bedCount ? ` · ${pluralize(room.bedCount, 'bed')}` : ''}
          </p>
        </div>

        <div className="flex items-center justify-between gap-5 sm:justify-end">
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">Total stay</p>
            <p className="tnum font-display text-2xl font-semibold leading-tight text-ink-900">{formatINR(room.totalPrice)}</p>
          </div>
          <Button
            variant={selected ? 'secondary' : 'primary'}
            size="lg"
            onClick={() => onSelect(room)}
            aria-pressed={selected}
            aria-haspopup="dialog"
            icon={selected ? <Icon name="check" className="h-4 w-4" strokeWidth={2.2} /> : null}
            className="shrink-0"
          >
            {selected ? 'Selected' : 'Book now'}
          </Button>
        </div>
      </div>
    </article>
  );
}
