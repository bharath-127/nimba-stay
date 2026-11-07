import Alert from '../ui/Alert.jsx';
import Button from '../ui/Button.jsx';
import Icon from '../ui/Icon.jsx';
import { formatDisplayDate } from '../../utils/dates.js';
import { pluralize } from '../../utils/format.js';

const tones = {
  brand: { chip: 'bg-brand-100 text-brand-700', accent: 'from-brand-400/70' },
  green: { chip: 'bg-sage-200 text-brand-800', accent: 'from-brand-500/70' },
  amber: { chip: 'bg-amber-100 text-amber-700', accent: 'from-amber-400/70' },
  sky: { chip: 'bg-sky-100 text-sky-700', accent: 'from-sky-400/70' },
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
      icon: 'building',
      tone: 'brand',
    },
    {
      key: 'available',
      label: range ? 'Available for these dates' : 'Available tonight',
      value: s.availableRooms,
      hint: `${pluralize(s.occupiedRooms, 'room')} occupied ${when}`,
      icon: 'checkCircle',
      tone: 'green',
    },
    {
      key: 'maintenance',
      label: 'Out of service',
      value: s.maintenanceRooms,
      hint: s.maintenanceRooms > 0 ? `Blocked ${when}` : `No rooms blocked ${when}`,
      icon: 'wrench',
      tone: 'amber',
    },
    {
      key: 'confirmed',
      label: 'Confirmed bookings',
      value: s.confirmedBookings,
      hint: `${pluralize(s.currentOrUpcomingBookings, 'current or upcoming stay', 'current or upcoming stays')} · ${s.inHouseTonight} in house tonight`,
      icon: 'calendar',
      tone: 'sky',
    },
  ];
}

function StatSkeleton() {
  return (
    <div className="surface p-5" aria-hidden="true">
      <div className="flex items-start justify-between">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-9 w-9 rounded-xl" />
      </div>
      <div className="skeleton mt-4 h-8 w-14 rounded" />
      <div className="skeleton mt-2 h-3 w-32 rounded" />
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
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" aria-busy="true" aria-label="Loading property summary">
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
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
          Summary ·{' '}
          <span className="normal-case tracking-normal text-ink-700" data-testid="stats-range">
            {describeRange(stats, range)}
          </span>
        </p>
        {loading && (
          <span className="text-xs text-ink-400" aria-hidden="true">
            Updating…
          </span>
        )}
      </div>

      <dl
        className={`grid grid-cols-2 gap-3 transition-opacity duration-200 sm:gap-4 lg:grid-cols-4 ${loading ? 'opacity-70' : ''}`}
        aria-busy={loading || undefined}
      >
        {buildItems(stats, range).map((item, i) => {
          const t = tones[item.tone];
          return (
            <div
              key={item.key}
              className={`surface relative overflow-hidden p-4 sm:p-5 rise-in rise-in-delay-${Math.min(i, 3)}`}
            >
              <span className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${t.accent} to-transparent`} aria-hidden="true" />
              <dt className="flex items-start justify-between gap-3">
                <span className="text-xs font-medium text-ink-500 sm:text-sm">{item.label}</span>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${t.chip}`} aria-hidden="true">
                  <Icon name={item.icon} className="h-[18px] w-[18px]" />
                </span>
              </dt>
              <dd className="mt-2">
                <span
                  className="block font-display text-3xl font-semibold leading-none text-ink-900 tnum sm:text-[2.25rem]"
                  data-testid={`stat-${item.key}`}
                >
                  {item.value}
                </span>
                <span className="mt-2 block text-xs text-ink-500">{item.hint}</span>
              </dd>
            </div>
          );
        })}
      </dl>

      {error && (
        <p className="mt-2 text-xs text-red-600" role="alert">
          Summary could not be refreshed: {error.message}{' '}
          <button type="button" className="font-medium underline underline-offset-2 focus-ring rounded" onClick={onRetry}>
            Retry
          </button>
        </p>
      )}
    </section>
  );
}
