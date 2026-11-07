import RoomCard from './RoomCard.jsx';
import Alert from '../ui/Alert.jsx';
import Button from '../ui/Button.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import { formatDisplayDate } from '../../utils/dates.js';
import { pluralize } from '../../utils/format.js';

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
 * Renders the availability search result in every state:
 * idle, loading, error, empty and populated.
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

  const { rooms, nights, checkIn, checkOut, category } = data;
  const summary = `${formatDisplayDate(checkIn)} → ${formatDisplayDate(checkOut)} · ${pluralize(nights, 'night')}${category ? ` · ${category}` : ''}`;

  if (rooms.length === 0) {
    return (
      <EmptyState
        title="No rooms available for these dates"
        description={`${summary}. Try different dates or another category.`}
      />
    );
  }

  return (
    <div className="space-y-3" aria-live="polite">
      <p className="text-sm text-slate-600">
        <span className="font-semibold text-slate-900">{pluralize(rooms.length, 'room')}</span> available · {summary}
      </p>
      <ul className="space-y-3">
        {rooms.map((room) => (
          <li key={room.id}>
            <RoomCard room={room} selected={room.id === selectedRoomId} onSelect={onSelect} />
          </li>
        ))}
      </ul>
    </div>
  );
}
