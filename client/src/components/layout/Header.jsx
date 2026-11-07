import { useHealth } from '../../hooks/useHealth.js';

const STATUS_STYLE = {
  checking: { dot: 'bg-ink-400', text: 'Checking API…', short: 'Checking', tone: 'text-ink-500 border-sand-200 bg-white' },
  online: { dot: 'bg-brand-500', text: 'API online', short: 'Online', tone: 'text-brand-800 border-brand-200 bg-brand-50' },
  degraded: { dot: 'bg-amber-500', text: 'Database offline', short: 'DB offline', tone: 'text-amber-900 border-amber-200 bg-amber-50' },
  offline: { dot: 'bg-red-500', text: 'API offline', short: 'Offline', tone: 'text-red-800 border-red-200 bg-red-50' },
};

function formatTime(date) {
  return date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
}

/** Live health indicator. Click to re-check immediately. */
export function StatusPill({ health }) {
  const s = STATUS_STYLE[health.status] ?? STATUS_STYLE.checking;
  const detail =
    health.status === 'online' ? `Database connected · transactions ${health.transactions}` : health.message ?? '';
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
        className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition hover:brightness-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${s.tone}`}
      >
        <span className="relative flex h-2 w-2" aria-hidden="true">
          {health.status === 'online' && (
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${s.dot}`} />
          )}
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

function initials(name) {
  return (
    String(name)
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('') || 'FD'
  );
}

/** Faint leaf sprig decorating the top-right of the bar. */
function LeafDecoration() {
  return (
    <svg
      className="pointer-events-none absolute -top-2 right-[26%] hidden h-24 w-48 text-brand-300/40 lg:block"
      viewBox="0 0 192 96"
      fill="none"
      aria-hidden="true"
    >
      <path d="M12 86c40-30 80-50 168-72" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M60 60c-2-16 8-28 22-30 2 14-6 26-22 30z" fill="currentColor" />
      <path d="M96 44c-2-16 8-28 22-30 2 14-6 26-22 30z" fill="currentColor" />
      <path d="M134 30c-2-16 8-28 22-30 2 14-6 26-22 30z" fill="currentColor" />
      <path d="M84 70c14 2 24-8 24-22-14-2-24 8-24 22z" fill="currentColor" opacity="0.8" />
    </svg>
  );
}

/**
 * Top bar over the dashboard: page title, live API status, notifications
 * and the staff chip. The staff name comes from VITE_STAFF_NAME (there is
 * no login in this tool).
 */
export default function Header() {
  const health = useHealth();
  const staffName = import.meta.env.VITE_STAFF_NAME || 'Front Desk';

  return (
    <header className="relative z-10 border-b border-sand-200/80 bg-white/90 backdrop-blur-md">
      <LeafDecoration />
      <div className="relative flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-[1.9rem]">
            Front Desk Dashboard
          </h1>
          <p className="mt-0.5 text-sm text-ink-500">Room availability, bookings and maintenance management</p>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <StatusPill health={health} />

          <span className="hidden h-8 w-px bg-sand-200 sm:block" aria-hidden="true" />

          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-sand-200 bg-white text-ink-700 transition hover:bg-sand-50 focus-ring"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.7" stroke="currentColor" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
              />
            </svg>
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" aria-hidden="true" />
          </button>

          <span className="hidden h-8 w-px bg-sand-200 sm:block" aria-hidden="true" />

          <div className="flex items-center gap-2.5" aria-label={`Signed in as ${staffName}`}>
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-700 text-sm font-semibold text-white"
              aria-hidden="true"
            >
              {initials(staffName)}
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-sm font-semibold text-ink-900">{staffName}</span>
              <span className="block text-xs text-ink-500">Front Desk</span>
            </span>
            <svg className="hidden h-4 w-4 text-ink-400 sm:block" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>
    </header>
  );
}
