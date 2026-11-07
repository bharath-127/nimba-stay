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
        className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition hover:brightness-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${s.tone}`}
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

const NAV = [
  { href: '#availability', label: 'Availability' },
  { href: '#bookings', label: 'Bookings' },
  { href: '#blocks', label: 'Blocks' },
];

export default function Header() {
  const health = useHealth();
  return (
    <header className="sticky top-0 z-40 border-b border-sand-200/80 bg-white/85 backdrop-blur-md supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <a href="#top" className="flex min-w-0 items-center gap-3 rounded-lg focus-ring">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.15)]"
            aria-hidden="true"
          >
            <svg viewBox="0 0 32 32" className="h-6 w-6">
              <path d="M16 6c-5 4-8 8-8 13a8 8 0 0 0 16 0c0-5-3-9-8-13z" fill="#dbe9d1" />
              <path d="M16 11v14" stroke="#2f4f2d" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block font-display text-[1.35rem] font-semibold tracking-tight text-brand-900">Nimba Stay</span>
            <span className="block truncate text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">
              Nimba Nature Cure · Front Desk
            </span>
          </span>
        </a>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink-700 transition hover:bg-sand-100 hover:text-ink-900 focus-ring"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <StatusPill health={health} />
      </div>
    </header>
  );
}
