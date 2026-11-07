import Alert from '../ui/Alert.jsx';
import Button from '../ui/Button.jsx';
import { formatDisplayDate } from '../../utils/dates.js';
import { pluralize } from '../../utils/format.js';

const icons = {
  rooms: 'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21',
  available: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  maintenance: 'M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085',
  bookings: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
};

const tones = {
  brand: 'bg-brand-50 text-brand-700',
  green: 'bg-brand-100 text-brand-800',
  amber: 'bg-amber-50 text-amber-700',
  sky: 'bg-sky-50 text-sky-700',
};

/** "Tonight" or "Sat, 21 Nov → Sun, 22 Nov · 1 night" */
export function describeRange(stats, range) {
  if (!range) return 'Tonight';
  return `${formatDisplayDate(stats.checkIn)} → ${formatDisplayDate(stats.checkOut)} · ${pluralize(stats.nights, 'night')}`;
}

function buildItems(s, range) {
  const when = range ? 'for these dates' : 'tonight';
  return [
    {
      key: 'total',
      label: 'Total rooms',
      value: s.totalRooms,
      hint: s.inactiveRooms > 0 ? `${s.activeRooms} in service · ${s.inactiveRooms} inactive` : `${s.activeRooms} in service`,
      icon: 'rooms',
      tone: 'brand',
    },
    {
      key: 'available',
      label: range ? 'Available for these dates' : 'Available tonight',
      value: s.availableRooms,
      hint: `${pluralize(s.occupiedRooms, 'room')} occupied ${when}`,
      icon: 'available',
      tone: 'green',
    },
    {
      key: 'maintenance',
      label: 'Out of service',
      value: s.maintenanceRooms,
      hint: s.maintenanceRooms > 0 ? `Blocked ${when}` : `No rooms blocked ${when}`,
      icon: 'maintenance',
      tone: 'amber',
    },
    {
      key: 'confirmed',
      label: 'Confirmed bookings',
      value: s.confirmedBookings,
      hint: `${pluralize(s.currentOrUpcomingBookings, 'current or upcoming stay', 'current or upcoming stays')} · ${s.inHouseTonight} in house tonight`,
      icon: 'bookings',
      tone: 'sky',
    },
  ];
}

function StatSkeleton() {
  return (
    <div className="rounded-xl border border-sand-200 bg-white p-4 shadow-sm" aria-hidden="true">
      <div className="skeleton mb-3 h-3 w-24 rounded" />
      <div className="skeleton mb-2 h-7 w-12 rounded" />
      <div className="skeleton h-3 w-28 rounded" />
    </div>
  );
}

/**
 * Four compact property-summary cards for the searched dates (or tonight
 * before a search). Every number comes from GET /api/stats; nothing is
 * computed or hardcoded on the client.
 */
export default function StatsCards({ stats, loading, error, range, onRetry }) {
  if (!stats && loading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-busy="true" aria-label="Loading property summary">
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
      </div>
    );
  }

  if (!stats && error) {
    return (
      <Alert
        tone="error"
        title="Could not load the property summary"
        action={
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try again
          </Button>
        }
      >
        {error.message}
      </Alert>
    );
  }

  if (!stats) return null;

  return (
    <section aria-label="Property summary">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
        Summary · <span className="normal-case tracking-normal text-slate-700" data-testid="stats-range">{describeRange(stats, range)}</span>
      </p>
      <dl className={`grid grid-cols-2 gap-3 transition-opacity lg:grid-cols-4 ${loading ? 'opacity-70' : ''}`} aria-busy={loading || undefined}>
        {buildItems(stats, range).map((item) => (
          <div key={item.key} className="rounded-xl border border-sand-200 bg-white p-4 shadow-sm">
            <dt className="flex items-center justify-between gap-2 text-xs font-medium text-slate-500 sm:text-sm">
              <span>{item.label}</span>
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tones[item.tone]}`} aria-hidden="true">
                <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth="1.6" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d={icons[item.icon]} />
                </svg>
              </span>
            </dt>
            <dd className="mt-1">
              <span className="block text-2xl font-semibold tabular-nums text-slate-900 sm:text-3xl" data-testid={`stat-${item.key}`}>
                {item.value}
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">{item.hint}</span>
            </dd>
          </div>
        ))}
      </dl>
      {error && (
        <p className="mt-2 text-xs text-red-600" role="alert">
          Summary could not be refreshed: {error.message}{' '}
          <button type="button" className="font-medium underline underline-offset-2" onClick={onRetry}>
            Retry
          </button>
        </p>
      )}
    </section>
  );
}
