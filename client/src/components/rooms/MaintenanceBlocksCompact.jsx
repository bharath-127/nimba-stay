import Button from '../ui/Button.jsx';
import Alert from '../ui/Alert.jsx';
import Badge, { categoryTone } from '../ui/Badge.jsx';
import Icon from '../ui/Icon.jsx';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-01-01" → "01 Jan 2026". */
export function longDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d} ${MONTHS[Number(m) - 1]} ${y}`;
}

const MAX_ROWS = 5;

function SkeletonRows() {
  return (
    <ul className="space-y-3" aria-hidden="true">
      {[0, 1].map((i) => (
        <li key={i} className="flex items-center justify-between gap-4 rounded-xl border border-sand-200 bg-white p-4">
          <div className="space-y-2">
            <div className="skeleton h-4 w-28 rounded-md" />
            <div className="skeleton h-3.5 w-40 rounded-md" />
          </div>
          <div className="skeleton h-6 w-32 rounded-full" />
        </li>
      ))}
    </ul>
  );
}

/**
 * Right-column summary of rooms currently out of service. Shows up to five
 * blocks; "View All" hands off to the full maintenance section, where
 * blocks are created and lifted.
 */
export default function MaintenanceBlocksCompact({ blocks = [], loading = false, error = null, onViewAll }) {
  const rows = blocks.slice(0, MAX_ROWS);
  const showSkeleton = loading && blocks.length === 0;

  return (
    <section className="surface rise-in rise-in-delay-1" aria-labelledby="maintenance-compact-title">
      <header className="flex items-start justify-between gap-3 px-5 pt-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700" aria-hidden="true">
            <Icon name="wrench" className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <h2 id="maintenance-compact-title" className="font-display text-xl font-semibold leading-tight text-ink-900">
              Maintenance Blocks
            </h2>
            <p className="mt-0.5 text-sm text-ink-500">Rooms currently out of service</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onViewAll} aria-label="View all maintenance blocks" className="-mr-2 shrink-0 text-brand-700 hover:text-brand-900">
          View All
          <Icon name="arrowRight" className="h-4 w-4" strokeWidth={2} />
        </Button>
      </header>

      <div className="px-5 pb-5 pt-4">
        {error ? (
          <Alert tone="error" title="Could not load maintenance blocks">
            {error.message}
          </Alert>
        ) : showSkeleton ? (
          <SkeletonRows />
        ) : rows.length === 0 ? (
          <p className="py-4 text-sm text-ink-500">No rooms out of service.</p>
        ) : (
          <ul className="space-y-3" aria-label="Rooms out of service">
            {rows.map((b) => (
              <li key={b.id} className="flex flex-col gap-3 rounded-xl border border-sand-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-lg font-semibold leading-none text-ink-900">{b.room?.roomNumber ?? '—'}</span>
                    {b.room?.category && <Badge tone={categoryTone(b.room.category)}>{b.room.category}</Badge>}
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-600">
                    <Icon name="calendar" className="h-4 w-4 shrink-0 text-ink-400" />
                    <span>
                      {longDate(b.startDate)} – {b.endDate ? longDate(b.endDate) : 'Until lifted'}
                    </span>
                  </p>
                </div>
                <Badge tone="warning" icon={<Icon name="wrench" className="h-3.5 w-3.5" strokeWidth={2} />} className="shrink-0 self-start px-3 py-1.5 sm:self-center">
                  Under Maintenance
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
