import Badge from '../ui/Badge.jsx';
import Icon from '../ui/Icon.jsx';
import { STAY_PHASE_LABEL } from '../../utils/bookingStatus.js';

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
