import Badge from '../ui/Badge.jsx';
import Icon from '../ui/Icon.jsx';
import { STAY_PHASE_LABEL, bookingPhase } from '../../utils/bookingStatus.js';

const STATUS = {
  confirmed: { label: 'Confirmed', tone: 'success', icon: 'checkCircle' },
  checked_out: { label: 'Checked out', tone: 'info', icon: 'logout' },
  cancelled: { label: 'Cancelled', tone: 'neutral', icon: 'xCircle' },
};

const PHASE_DOT = {
  upcoming: 'bg-sky-500',
  'in-house': 'bg-brand-500',
  'checked-out': 'bg-ink-300',
};

/** Booking status pill: colour + icon + text, so it never relies on colour alone. */
export default function BookingStatusBadge({ status }) {
  const s = STATUS[status] ?? { label: status, tone: 'neutral', icon: 'info' };
  return (
    <Badge tone={s.tone} icon={<Icon name={s.icon} className="h-3.5 w-3.5" strokeWidth={2} />}>
      {s.label}
    </Badge>
  );
}

/** Secondary indicator for confirmed stays: upcoming / in-house / checked out. */
export function StayPhase({ phase }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-500">
      <span className={`h-1.5 w-1.5 rounded-full ${PHASE_DOT[phase] ?? PHASE_DOT['checked-out']}`} aria-hidden="true" />
      {STAY_PHASE_LABEL[phase]}
    </span>
  );
}

/**
 * One-glance status chip for compact lists: a confirmed stay that has not
 * started yet reads "Upcoming" (clock), a confirmed stay in progress reads
 * "Confirmed" (check), cancelled is red, checked out is sky.
 * Display only — the server's `status` is the source of truth.
 */
export function chipFor(booking, today) {
  if (booking.status === 'cancelled') return { label: 'Cancelled', tone: 'danger', icon: 'xCircle' };
  if (booking.status === 'checked_out') return { label: 'Checked out', tone: 'info', icon: 'logout' };
  if (booking.status === 'confirmed' && bookingPhase(booking, today) === 'upcoming') {
    return { label: 'Upcoming', tone: 'neutral', icon: 'clock' };
  }
  if (booking.status === 'confirmed') return { label: 'Confirmed', tone: 'success', icon: 'check' };
  return { label: booking.status, tone: 'neutral', icon: 'info' };
}

export function StatusChip({ booking, today }) {
  const c = chipFor(booking, today);
  return (
    <Badge tone={c.tone} icon={<Icon name={c.icon} className="h-3.5 w-3.5" strokeWidth={2.2} />} className="whitespace-nowrap">
      {c.label}
    </Badge>
  );
}
