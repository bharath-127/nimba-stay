import RoomCard from './RoomCard.jsx';
import Alert from '../ui/Alert.jsx';
import Button from '../ui/Button.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import Icon from '../ui/Icon.jsx';
import { formatDisplayDate } from '../../utils/dates.js';
import { pluralize } from '../../utils/format.js';

/** "10 Nov 2026" — the card subtitle reads better without the weekday. */
const shortDate = (iso) => formatDisplayDate(iso).replace(/^\w{3}, /, '');

function SkeletonRow() {
  return (
    <div className="surface flex items-center gap-4 p-4" aria-hidden="true">
      <div className="skeleton h-[84px] w-[135px] shrink-0 rounded-xl" />
      <div className="flex-1 space-y-2.5">
        <div className="skeleton h-5 w-32 rounded-md" />
        <div className="skeleton h-3.5 w-48 rounded-md" />
      </div>
      <div className="hidden items-center gap-8 md:flex">
        <div className="space-y-2">
          <div className="skeleton h-4 w-24 rounded-md" />
          <div className="skeleton h-7 w-20 rounded-md" />
        </div>
        <div className="skeleton h-11 w-32 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * The "Available Rooms" card. Renders its own surface and header so the
 * page can drop it in directly. Rows are a flat list in the order the API
 * returns them (category groups, most expensive first), each with a
 * category badge. Covers idle, loading, error, empty and populated states.
 */
export default function RoomList({ status, data, error, selectedRoomId, onSelect, onRetry }) {
  const success = status === 'success' && data;
  const nights = success ? data.nights : null;

  let subtitle = 'Search above to see which rooms are free';
  if (status === 'loading') subtitle = 'Checking every night of the stay…';
  if (status === 'error') subtitle = 'Availability could not be loaded';
  if (success) {
    subtitle = `${pluralize(data.rooms.length, 'room')} available · ${pluralize(nights, 'night')} (${shortDate(data.checkIn)} – ${shortDate(
      data.checkOut
    )})${data.category ? ` · ${data.category}` : ''}`;
  }

  let body;
  if (status === 'idle') {
    body = (
      <EmptyState
        title="Your free rooms will appear here"
        description="Pick check-in and check-out dates above, optionally a category, and search. Only rooms free for every night of the stay are shown."
      />
    );
  } else if (status === 'loading') {
    body = (
      <div className="space-y-3" aria-busy="true" aria-live="polite">
        <p className="sr-only">Checking availability</p>
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  } else if (status === 'error') {
    body = (
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
  } else if (data.rooms.length === 0) {
    body = (
      <EmptyState
        title="No rooms free for these dates"
        description={`${shortDate(data.checkIn)} – ${shortDate(data.checkOut)}${data.category ? ` · ${data.category}` : ''}. Try shifting the dates by a day or widening the category.`}
      />
    );
  } else {
    body = (
      <ul className="space-y-3" aria-live="polite" aria-label="Available rooms">
        {data.rooms.map((room, i) => (
          <li key={room.id} className={`rise-in ${i > 0 ? `rise-in-delay-${Math.min(i, 3)}` : ''}`}>
            <RoomCard room={room} selected={room.id === selectedRoomId} onSelect={onSelect} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section className="surface" aria-labelledby="available-rooms-title">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b divider-sand px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700" aria-hidden="true">
            <Icon name="bed" className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h2 id="available-rooms-title" className="font-display text-xl font-semibold leading-tight text-ink-900">
              Available Rooms
            </h2>
            <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>
          </div>
        </div>
        {success && (
          <span className="tnum inline-flex items-center rounded-lg bg-brand-100 px-3.5 py-2 text-sm font-semibold text-brand-800 ring-1 ring-inset ring-brand-200/60">
            {pluralize(nights, 'night')}
          </span>
        )}
      </header>
      <div className="p-4 sm:p-5">{body}</div>
    </section>
  );
}
