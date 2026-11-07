import { STAY_PHASE_LABEL } from '../../utils/bookingStatus.js';

const STATUS = {
  confirmed: {
    label: 'Confirmed',
    className: 'bg-brand-100 text-brand-800 ring-brand-200',
    icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-slate-100 text-slate-600 ring-slate-200',
    icon: 'M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
};

const PHASE_DOT = {
  upcoming: 'bg-sky-500',
  'in-house': 'bg-brand-500',
  'checked-out': 'bg-slate-400',
};

/** Booking status pill: colour + icon + text, so it never relies on colour alone. */
export default function BookingStatusBadge({ status }) {
  const s = STATUS[status] ?? { label: status, className: 'bg-slate-100 text-slate-700 ring-slate-200', icon: STATUS.cancelled.icon };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${s.className}`}>
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
      </svg>
      {s.label}
    </span>
  );
}

/** Secondary indicator for confirmed stays: upcoming / in-house / checked out. */
export function StayPhase({ phase }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
      <span className={`h-1.5 w-1.5 rounded-full ${PHASE_DOT[phase]}`} aria-hidden="true" />
      {STAY_PHASE_LABEL[phase]}
    </span>
  );
}
