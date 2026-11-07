import Button from '../ui/Button.jsx';
import Alert from '../ui/Alert.jsx';
import Icon from '../ui/Icon.jsx';
import { StatusChip } from './BookingStatusBadge.jsx';
import { todayIso } from '../../utils/dates.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-11-09" → "09 Nov" — compact, no weekday or year. */
export function shortDate(iso) {
  if (!iso) return '';
  const [, m, d] = iso.split('-');
  return `${d} ${MONTHS[Number(m) - 1]}`;
}

const MAX_ROWS = 5;

function SkeletonRows() {
  return (
    <tbody aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <tr key={i} className="border-t divider-sand">
          <td className="py-3 pr-3"><div className="skeleton h-4 w-24 rounded-md" /></td>
          <td className="py-3 pr-3"><div className="skeleton h-4 w-16 rounded-md" /></td>
          <td className="hidden py-3 pr-3 sm:table-cell"><div className="skeleton h-4 w-24 rounded-md" /></td>
          <td className="py-3"><div className="skeleton h-5 w-20 rounded-full" /></td>
        </tr>
      ))}
    </tbody>
  );
}

/**
 * Right-column summary of the latest bookings: guest, room, stay and a
 * one-glance status chip. Shows the five most recent; "View All" hands off
 * to the full bookings section, which has the check-out and cancel actions.
 */
export default function RecentBookingsCompact({ bookings = [], loading = false, error = null, onViewAll }) {
  const today = todayIso();
  const rows = bookings.slice(0, MAX_ROWS);
  const showSkeleton = loading && bookings.length === 0;

  return (
    <section className="surface rise-in" aria-labelledby="recent-bookings-compact-title">
      <header className="flex items-start justify-between gap-3 px-5 pt-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700" aria-hidden="true">
            <Icon name="calendar" className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <h2 id="recent-bookings-compact-title" className="font-display text-xl font-semibold leading-tight text-ink-900">
              Recent Bookings
            </h2>
            <p className="mt-0.5 text-sm text-ink-500">Latest bookings and status</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onViewAll} aria-label="View all bookings" className="-mr-2 shrink-0 text-brand-700 hover:text-brand-900">
          View All
          <Icon name="arrowRight" className="h-4 w-4" strokeWidth={2} />
        </Button>
      </header>

      <div className="px-5 pb-5 pt-4">
        {error ? (
          <Alert tone="error" title="Could not load bookings">
            {error.message}
          </Alert>
        ) : !showSkeleton && rows.length === 0 ? (
          <p className="py-4 text-sm text-ink-500">No bookings yet. Confirmed bookings will appear here.</p>
        ) : (
          <table className="w-full table-fixed text-left text-sm" aria-busy={showSkeleton || undefined}>
            <caption className="sr-only">Latest bookings, newest first</caption>
            <colgroup>
              <col className="w-[38%] sm:w-[32%]" />
              <col className="w-[26%] sm:w-[20%]" />
              <col className="hidden sm:table-column sm:w-[26%]" />
              <col className="w-[36%] sm:w-[22%]" />
            </colgroup>
            <thead>
              <tr className="text-xs font-medium text-ink-500">
                <th scope="col" className="pb-2 pr-3 font-medium">Guest</th>
                <th scope="col" className="pb-2 pr-3 font-medium">Room</th>
                <th scope="col" className="hidden pb-2 pr-3 font-medium sm:table-cell">Stay</th>
                <th scope="col" className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            {showSkeleton ? (
              <SkeletonRows />
            ) : (
              <tbody>
                {rows.map((b) => (
                  <tr key={b.id} className="border-t divider-sand align-middle">
                    <td className="break-words py-3.5 pr-3 font-semibold text-ink-900">{b.guestName}</td>
                    <td className="py-3.5 pr-3 font-medium text-ink-700">{b.room?.roomNumber ?? '—'}</td>
                    <td className="hidden whitespace-nowrap py-3.5 pr-3 text-ink-700 sm:table-cell">
                      {shortDate(b.checkIn)} – {shortDate(b.checkOut)}
                    </td>
                    <td className="py-3">
                      <StatusChip booking={b} today={today} />
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        )}
      </div>
    </section>
  );
}
