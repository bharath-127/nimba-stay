import RoomCard from './RoomCard.jsx';
import Alert from '../ui/Alert.jsx';
import Badge, { categoryTone } from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import Icon from '../ui/Icon.jsx';
import { formatDisplayDate } from '../../utils/dates.js';
import { formatINR, pluralize } from '../../utils/format.js';

const rule = {
  Standard: 'bg-cat-standard/40',
  Deluxe: 'bg-cat-deluxe/40',
  Premium: 'bg-cat-premium/40',
  Suite: 'bg-cat-suite/50',
};

function SkeletonRow() {
  return (
    <div className="surface flex items-center justify-between p-5" aria-hidden="true">
      <div className="space-y-2.5">
        <div className="skeleton h-5 w-36 rounded-md" />
        <div className="skeleton h-3.5 w-56 rounded-md" />
      </div>
      <div className="flex items-center gap-5">
        <div className="skeleton h-7 w-20 rounded-md" />
        <div className="skeleton h-11 w-28 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Renders the availability search result in every state: idle, loading,
 * error, empty and populated. Rooms are grouped by category, most
 * expensive first, exactly as the API returns them.
 */
export default function RoomList({ status, data, error, selectedRoomId, onSelect, onRetry }) {
  if (status === 'idle') {
    return (
      <EmptyState
        title="Your free rooms will appear here"
        description="Pick check-in and check-out dates above, optionally a category, and search. Only rooms free for every night of the stay are shown."
      />
    );
  }

  if (status === 'loading') {
    return (
      <div className="space-y-3" aria-busy="true" aria-live="polite">
        <p className="text-sm text-ink-500">Checking every night of the stay…</p>
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <Alert
        tone="error"
        title={error?.isNetworkError ? 'Cannot reach the server' : 'Could not load availability'}
        action={
          <Button variant="secondary" size="sm" onClick={onRetry} icon={<Icon name="refresh" className="h-4 w-4" />}>
            Try again
          </Button>
        }
      >
        {error?.message}
      </Alert>
    );
  }

  const { rooms, groups = [], nights, checkIn, checkOut, category } = data;
  const dates = `${formatDisplayDate(checkIn)} → ${formatDisplayDate(checkOut)}`;
  const summary = `${dates} · ${pluralize(nights, 'night')}${category ? ` · ${category}` : ''}`;

  if (rooms.length === 0) {
    return (
      <EmptyState
        title="No rooms free for these dates"
        description={`${summary}. Try shifting the dates by a day or widening the category.`}
      />
    );
  }

  return (
    <div className="space-y-7" aria-live="polite">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-sm text-ink-600">
          <span className="font-display text-lg font-semibold text-ink-900">{pluralize(rooms.length, 'room')}</span>{' '}
          <span className="text-ink-500">available</span>
        </p>
        <p className="flex items-center gap-1.5 text-sm text-ink-500">
          <Icon name="calendar" className="h-4 w-4 text-ink-400" />
          {summary}
        </p>
      </div>

      {groups.map((group, gi) => (
        <section
          key={group.category}
          aria-labelledby={`group-${group.category}`}
          className={`space-y-3 rise-in ${gi > 0 ? `rise-in-delay-${Math.min(gi, 3)}` : ''}`}
        >
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
            <h3 id={`group-${group.category}`} className="flex items-center gap-2.5">
              <Badge tone={categoryTone(group.category)}>{group.category}</Badge>
              <span className="text-sm text-ink-500">{pluralize(group.count, 'room')}</span>
            </h3>
            <p className="tnum text-sm text-ink-500">
              {formatINR(group.pricePerNight)} per night ·{' '}
              <span className="font-medium text-ink-800">{formatINR(group.totalPrice)}</span> for the stay
            </p>
          </div>
          <div className={`h-px w-full ${rule[group.category] ?? 'bg-sand-200'}`} aria-hidden="true" />
          <ul className="space-y-3">
            {group.rooms.map((room) => (
              <li key={room.id}>
                <RoomCard room={room} selected={room.id === selectedRoomId} onSelect={onSelect} showCategory={false} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
