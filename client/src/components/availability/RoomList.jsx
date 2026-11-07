import RoomCard from './RoomCard.jsx';
import Alert from '../ui/Alert.jsx';
import Button from '../ui/Button.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import { formatDisplayDate } from '../../utils/dates.js';
import { formatINR, pluralize } from '../../utils/format.js';

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between rounded-lg border border-sand-200 bg-white p-4" aria-hidden="true">
      <div className="space-y-2">
        <div className="skeleton h-4 w-40 rounded" />
        <div className="skeleton h-3 w-56 rounded" />
      </div>
      <div className="skeleton h-9 w-24 rounded" />
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
        title="Search to see available rooms"
        description="Choose check-in and check-out dates, optionally a category, and search. Only rooms free for every night of the stay are shown."
      />
    );
  }

  if (status === 'loading') {
    return (
      <div className="space-y-3" aria-busy="true" aria-live="polite">
        <p className="text-sm text-slate-500">Checking availability…</p>
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
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try again
          </Button>
        }
      >
        {error?.message}
      </Alert>
    );
  }

  const { rooms, groups = [], nights, chargedNights, minChargedNights, checkIn, checkOut, category } = data;
  const summary = `${formatDisplayDate(checkIn)} → ${formatDisplayDate(checkOut)} · ${pluralize(nights, 'night')}${category ? ` · ${category}` : ''}`;
  const minimumApplied = chargedNights > nights;

  if (rooms.length === 0) {
    return (
      <EmptyState
        title="No rooms available for these dates"
        description={`${summary}. Try different dates or another category.`}
      />
    );
  }

  return (
    <div className="space-y-5" aria-live="polite">
      <div className="text-sm text-slate-600">
        <span className="font-semibold text-slate-900">{pluralize(rooms.length, 'room')}</span> available · {summary}
        {minimumApplied && (
          <p className="mt-1 text-xs text-amber-700">
            Stays shorter than {minChargedNights} nights are charged for {minChargedNights} nights.
          </p>
        )}
      </div>

      {groups.map((group) => (
        <section key={group.category} aria-labelledby={`group-${group.category}`} className="space-y-2">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-sand-200 pb-1.5">
            <h3 id={`group-${group.category}`} className="text-sm font-semibold text-slate-900">
              {group.category}
              <span className="ml-2 font-normal text-slate-500">{pluralize(group.count, 'room')}</span>
            </h3>
            <p className="text-xs text-slate-500">
              {formatINR(group.pricePerNight)} per night · <span className="font-medium text-slate-700">{formatINR(group.totalPrice)}</span> for the stay
            </p>
          </div>
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
