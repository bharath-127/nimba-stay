import { useHealth } from '../../hooks/useHealth.js';

function StatusPill() {
  const health = useHealth();
  const map = {
    checking: { dot: 'bg-slate-400', text: 'Checking API…', tone: 'text-slate-500' },
    online: { dot: 'bg-brand-500', text: 'API online', tone: 'text-brand-700' },
    offline: { dot: 'bg-red-500', text: 'API offline', tone: 'text-red-700' },
  };
  const s = map[health.status];
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border border-sand-200 bg-white px-3 py-1 text-xs font-medium ${s.tone}`} title={health.transactions ? `Transactions: ${health.transactions}` : undefined}>
      <span className={`h-2 w-2 rounded-full ${s.dot} ${health.status === 'online' ? 'animate-pulse' : ''}`} aria-hidden="true" />
      {s.text}
    </span>
  );
}

export default function Header() {
  return (
    <header className="border-b border-sand-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <a href="#top" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-700 text-white shadow-sm" aria-hidden="true">
            <svg viewBox="0 0 32 32" className="h-6 w-6">
              <path d="M16 6c-5 4-8 8-8 13a8 8 0 0 0 16 0c0-5-3-9-8-13z" fill="#dbe9d1" />
              <path d="M16 11v14" stroke="#2f4f2d" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
          <span>
            <span className="block font-display text-xl font-semibold leading-tight tracking-tight text-brand-800">Nimba Stay</span>
            <span className="block text-xs text-slate-500">Nimba Nature Cure · Front Desk</span>
          </span>
        </a>

        <nav aria-label="Primary" className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <a href="#availability" className="hover:text-brand-700">Availability</a>
          <a href="#bookings" className="hover:text-brand-700">Bookings</a>
        </nav>

        <StatusPill />
      </div>
    </header>
  );
}
