import Alert from '../ui/Alert.jsx';
import Button from '../ui/Button.jsx';
import Icon from '../ui/Icon.jsx';
import { formatDisplayDate } from '../../utils/dates.js';
import { pluralize } from '../../utils/format.js';

const tones = {
  green: { card: 'from-brand-50 to-white border-brand-100', tile: 'bg-brand-100 text-brand-700' },
  amber: { card: 'from-amber-50 to-white border-amber-100', tile: 'bg-amber-100 text-amber-700' },
  sky: { card: 'from-sky-50 to-white border-sky-100', tile: 'bg-sky-100 text-sky-700' },
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
      label: 'Total Rooms',
      value: s.totalRooms,
      hint: s.inactiveRooms > 0 ? `${s.activeRooms} in service · ${s.inactiveRooms} inactive` : `${s.activeRooms} in service`,
      icon: 'bed',
      tone: 'green',
    },
    {
      key: 'available',
      label: 'Available Rooms',
      value: s.availableRooms,
      hint: `${s.occupiedRooms} occupied ${when}`,
      icon: 'building',
      tone: 'green',
    },
    {
      key: 'maintenance',
      label: 'Maintenance',
      value: s.maintenanceRooms,
      hint: s.maintenanceRooms > 0 ? `Blocked ${when}` : `None blocked ${when}`,
      icon: 'wrench',
      tone: 'amber',
    },
    {
      key: 'confirmed',
      label: 'Confirmed Bookings',
      value: s.confirmedBookings,
      suffix: `(${s.currentOrUpcomingBookings} upcoming)`,
      hint: `${s.inHouseTonight} in house tonight`,
      icon: 'calendar',
      tone: 'sky',
    },
  ];
}

function StatSkeleton() {
  return (
    <div className="surface flex items-center gap-4 p-4" aria-hidden="true">
      <div className="skeleton h-14 w-14 shrink-0 rounded-xl" />
      <div className="flex-1">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton mt-3 h-7 w-12 rounded" />
      </div>
    </div>
  );
}

/**
 * Four summary cards — tinted icon tile on the left, label and figure on
 * the right — for the searched dates (tonight before a search). Every
 * number comes from GET /api/stats; nothing is computed or hardcoded here.
 */
export default function StatsCards({ stats, loading, error, range, onRetry }) {
  if (!stats && loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" aria-busy="true" aria-label="Loading property summary">
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
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
        Summary ·{' '}
        <span className="normal-case tracking-normal text-ink-700" data-testid="stats-range">
          {describeRange(stats, range)}
        </span>
        {loading && (
          <span className="ml-2 normal-case tracking-normal text-ink-400" aria-hidden="true">
            Updating…
          </span>
        )}
      </p>

      <dl
        className={`grid grid-cols-2 gap-3 transition-opacity duration-200 sm:gap-4 xl:grid-cols-4 ${loading ? 'opacity-70' : ''}`}
        aria-busy={loading || undefined}
      >
        {buildItems(stats, range).map((item, i) => {
          const t = tones[item.tone];
          return (
            <div
              key={item.key}
              className={`flex items-center gap-3 rounded-[var(--radius-xl2)] border bg-gradient-to-br p-3.5 shadow-[var(--shadow-card)] sm:gap-4 sm:p-4 rise-in rise-in-delay-${Math.min(i, 3)} ${t.card}`}
            >
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:h-14 sm:w-14 ${t.tile}`} aria-hidden="true">
                <Icon name={item.icon} className="h-6 w-6 sm:h-7 sm:w-7" />
              </span>
              <div className="min-w-0">
                <dt className="truncate text-sm font-medium text-ink-700">{item.label}</dt>
                <dd className="mt-0.5">
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-display text-[1.75rem] font-semibold leading-none text-ink-900 tnum sm:text-[2rem]" data-testid={`stat-${item.key}`}>
                      {item.value}
                    </span>
                    {item.suffix && <span className="text-xs text-ink-500">{item.suffix}</span>}
                  </span>
                  <span className="mt-1 block truncate text-xs text-ink-500">{item.hint}</span>
                </dd>
              </div>
            </div>
          );
        })}
      </dl>

      {error && (
        <p className="mt-2 text-xs text-red-600" role="alert">
          Summary could not be refreshed: {error.message}{' '}
          <button type="button" className="rounded font-medium underline underline-offset-2 focus-ring" onClick={onRetry}>
            Retry
          </button>
        </p>
      )}
    </section>
  );
}
