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

/**
 * One available room as a list row: thumbnail, number + category, guests
 * and area, then the server-computed pricing and Book Now. One row from
 * `md` up; on phones the price block stacks under the room details.
 */
export default function RoomCard({ room, selected = false, onSelect, showCategory = true }) {
  const area = areaSqFt(room.category);

  return (
    <article
      aria-selected={selected}
      className={`surface surface-interactive ${selected ? 'border-brand-500 ring-2 ring-brand-200' : ''}`}
    >
      <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:gap-6">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <RoomThumbnail category={room.category} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-[1.15rem] font-bold leading-tight tracking-tight text-ink-900">{room.roomNumber}</h3>
              {showCategory && <Badge tone={categoryTone(room.category)}>{room.category}</Badge>}
            </div>
            <p className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-ink-600">
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

        <div className="flex items-center justify-between gap-4 border-t divider-sand pt-4 md:justify-end md:gap-8 md:border-0 md:pt-0">
          <div className="md:min-w-[8.5rem]">
            <p className="leading-tight text-ink-900">
              <span className="tnum text-lg font-bold">{formatINR(room.pricePerNight)}</span>{' '}
              <span className="text-sm text-ink-500">/ night</span>
            </p>
            <p className="mt-1 text-xs text-ink-500">Total for {pluralize(room.nights, 'night')}</p>
            <p className="tnum mt-0.5 text-[1.6rem] font-bold leading-none tracking-tight text-ink-900">{formatINR(room.totalPrice)}</p>
          </div>
          <Button
            variant={selected ? 'secondary' : 'primary'}
            size="lg"
            onClick={() => onSelect(room)}
            aria-pressed={selected}
            aria-haspopup="dialog"
            icon={<Icon name={selected ? 'check' : 'calendar'} className="h-4 w-4" strokeWidth={2} />}
            className="shrink-0 px-5"
          >
            {selected ? 'Selected' : 'Book Now'}
          </Button>
        </div>
      </div>
    </article>
  );
}
