import { useHealth } from '../../hooks/useHealth.js';

const STATUS_STYLE = {
  checking: { dot: 'bg-slate-400', text: 'Checking API…', short: 'Checking', tone: 'text-slate-500 border-sand-200' },
  online: { dot: 'bg-brand-500', text: 'API online', short: 'Online', tone: 'text-brand-700 border-brand-200' },
  degraded: { dot: 'bg-amber-500', text: 'Database offline', short: 'DB offline', tone: 'text-amber-800 border-amber-200' },
  offline: { dot: 'bg-red-500', text: 'API offline', short: 'Offline', tone: 'text-red-700 border-red-200' },
};

function formatTime(date) {
  return date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
}

/** Live health indicator. Click to re-check immediately. */
export function StatusPill({ health }) {
  const s = STATUS_STYLE[health.status] ?? STATUS_STYLE.checking;
  const detail =
    health.status === 'online'
      ? `Database connected · transactions ${health.transactions}`
      : health.message ?? '';
  const title = [detail, health.checkedAt ? `Last checked ${formatTime(health.checkedAt)}` : '', 'Click to re-check']
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <button
        type="button"
        onClick={health.check}
        title={title}
        aria-label={`${s.text}. ${title}`}
        className={`inline-flex shrink-0 items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs font-medium transition hover:bg-sand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${s.tone}`}
      >
        <span className="relative flex h-2 w-2" aria-hidden="true">
          {health.status === 'online' && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${s.dot}`} />}
          <span className={`relative inline-flex h-2 w-2 rounded-full ${s.dot}`} />
        </span>
        <span className="sm:hidden">{s.short}</span>
        <span className="hidden sm:inline">{s.text}</span>
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {health.status === 'checking' ? '' : s.text}
      </span>
    </>
  );
}

export default function Header() {
  const health = useHealth();
  return (
    <header className="border-b border-sand-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <a href="#top" className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-700 text-white shadow-sm" aria-hidden="true">
            <svg viewBox="0 0 32 32" className="h-6 w-6">
              <path d="M16 6c-5 4-8 8-8 13a8 8 0 0 0 16 0c0-5-3-9-8-13z" fill="#dbe9d1" />
              <path d="M16 11v14" stroke="#2f4f2d" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
          <span className="min-w-0">
            <span className="block font-display text-xl font-semibold leading-tight tracking-tight text-brand-800">Nimba Stay</span>
            <span className="block truncate text-xs text-slate-500">Nimba Nature Cure · Front Desk</span>
          </span>
        </a>

        <nav aria-label="Primary" className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <a href="#availability" className="hover:text-brand-700">Availability</a>
          <a href="#bookings" className="hover:text-brand-700">Bookings</a>
        </nav>

        <StatusPill health={health} />
      </div>
    </header>
  );
}
