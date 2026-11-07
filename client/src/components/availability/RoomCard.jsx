import Badge, { categoryTone } from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import Icon from '../ui/Icon.jsx';
import RoomThumbnail from './RoomThumbnail.jsx';
import { formatINR, pluralize } from '../../utils/format.js';
import { areaSqFt } from '../../utils/roomMeta.js';

/** Outward arrows — "floor area". Local because the shared icon set has no area glyph. */
function AreaIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.7" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
    </svg>
  );
}

/** One available room as a list row with the server-computed price for the stay. */
export default function RoomCard({ room, selected = false, onSelect, showCategory = true }) {
  const area = areaSqFt(room.category);

  return (
    <article
      aria-selected={selected}
      className={`surface surface-interactive ${selected ? 'border-brand-500 ring-2 ring-brand-200' : ''}`}
    >
      <div className="flex flex-col gap-4 p-3 sm:flex-row sm:items-center sm:gap-5 sm:p-4">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <RoomThumbnail category={room.category} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold leading-tight text-ink-900">{room.roomNumber}</h3>
              {showCategory && <Badge tone={categoryTone(room.category)}>{room.category}</Badge>}
            </div>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500">
              <span className="inline-flex items-center gap-1.5">
                <Icon name="user" className="h-4 w-4 text-ink-400" />
                {pluralize(room.bedCount ?? 0, 'Guest')}
              </span>
              {area != null && (
                <span className="inline-flex items-center gap-1.5">
                  <AreaIcon className="h-4 w-4 text-ink-400" />
                  {area} sq.ft
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-t divider-sand pt-3 sm:justify-end sm:gap-6 sm:border-0 sm:pt-0">
          <div className="sm:text-right">
            <p className="text-base leading-tight text-ink-900">
              <span className="tnum font-bold">{formatINR(room.pricePerNight)}</span>{' '}
              <span className="text-sm text-ink-500">/ night</span>
            </p>
            <p className="mt-0.5 text-xs text-ink-500">Total for {pluralize(room.nights, 'night')}</p>
            <p className="tnum font-display text-2xl font-semibold leading-tight text-ink-900">{formatINR(room.totalPrice)}</p>
          </div>
          <Button
            variant={selected ? 'secondary' : 'primary'}
            size="lg"
            onClick={() => onSelect(room)}
            aria-pressed={selected}
            aria-haspopup="dialog"
            icon={<Icon name={selected ? 'check' : 'calendar'} className="h-4 w-4" strokeWidth={2} />}
            className="shrink-0"
          >
            {selected ? 'Selected' : 'Book Now'}
          </Button>
        </div>
      </div>
    </article>
  );
}
