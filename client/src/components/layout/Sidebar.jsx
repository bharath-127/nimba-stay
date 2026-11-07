import Icon from '../ui/Icon.jsx';
import './sidebar.css';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', href: '#top', icon: 'home' },
  { id: 'availability', label: 'Availability', href: '#availability', icon: 'calendar' },
  { id: 'bookings', label: 'Bookings', href: '#bookings', icon: 'bookings' },
  { id: 'maintenance', label: 'Maintenance', href: '#maintenance', icon: 'wrench' },
];

/** Glyphs the shared Icon set does not have. */
const LOCAL_PATHS = {
  home: 'M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
  bookings: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5M9 15l2 2 4-4',
};

function NavGlyph({ name, className }) {
  if (LOCAL_PATHS[name]) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.7" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d={LOCAL_PATHS[name]} />
      </svg>
    );
  }
  return <Icon name={name} className={className} />;
}

/** Muted hills, trees and a cottage at the foot of the dark panel. */
function Scene() {
  return (
    <>
      <svg className="sidebar-dark__art" viewBox="0 0 230 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <defs>
          <linearGradient id="sbd-hill-far" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#4f7a49" />
            <stop offset="1" stopColor="#355a33" />
          </linearGradient>
          <linearGradient id="sbd-hill-near" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#3d6a3a" />
            <stop offset="1" stopColor="#264a25" />
          </linearGradient>
          <linearGradient id="sbd-ground" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#2f5a2e" />
            <stop offset="1" stopColor="#1b301b" />
          </linearGradient>
          <linearGradient id="sbd-tree" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#4f8249" />
            <stop offset="1" stopColor="#254a24" />
          </linearGradient>
        </defs>

        <path d="M0 150 C 40 120, 80 118, 120 138 S 190 150, 230 128 L 230 300 L 0 300 Z" fill="url(#sbd-hill-far)" />
        <path d="M0 192 C 50 160, 110 168, 150 186 S 210 196, 230 182 L 230 300 L 0 300 Z" fill="url(#sbd-hill-near)" />

        <g fill="#3f6b3b" opacity="0.9">
          <path d="M20 170 l10 -26 l10 26 z" />
          <path d="M44 176 l9 -22 l9 22 z" />
          <path d="M186 168 l11 -28 l11 28 z" />
          <path d="M208 176 l8 -20 l8 20 z" />
        </g>

        <g>
          <rect x="52" y="214" width="6" height="30" rx="2" fill="#3e2e1c" />
          <ellipse cx="55" cy="196" rx="30" ry="24" fill="url(#sbd-tree)" />
          <ellipse cx="38" cy="208" rx="18" ry="14" fill="#3b6b38" />
          <ellipse cx="72" cy="206" rx="20" ry="15" fill="#4f8249" />
        </g>

        <g>
          <path d="M118 226 l26 -22 l26 22 z" fill="#a8864f" />
          <path d="M118 226 l26 -22 l26 22" fill="none" stroke="#7f6239" strokeWidth="2" strokeLinejoin="round" />
          <rect x="124" y="226" width="40" height="26" fill="#e9dcc2" />
          <rect x="139" y="236" width="10" height="16" rx="1" fill="#4c3620" />
          <rect x="127" y="232" width="8" height="8" rx="1" fill="#f3d27a" />
          <rect x="153" y="232" width="8" height="8" rx="1" fill="#f3d27a" />
          <rect x="155" y="206" width="5" height="10" fill="#6d5234" />
        </g>

        <g>
          <rect x="190" y="222" width="5" height="24" rx="2" fill="#3e2e1c" />
          <ellipse cx="192" cy="208" rx="22" ry="18" fill="url(#sbd-tree)" />
          <ellipse cx="204" cy="216" rx="14" ry="11" fill="#4f8249" />
        </g>

        <path d="M0 248 C 60 236, 150 240, 230 232 L 230 300 L 0 300 Z" fill="url(#sbd-ground)" />
        <path d="M140 252 C 130 266, 118 280, 104 300 L 128 300 C 138 282, 146 268, 150 252 Z" fill="#b8a27d" opacity="0.5" />

        <g fill="#1f3d1f">
          <ellipse cx="20" cy="282" rx="38" ry="20" />
          <ellipse cx="212" cy="286" rx="42" ry="22" />
        </g>
        <g fill="#5d8f56" opacity="0.8">
          <path d="M28 266 c -4 -16 8 -26 18 -24 c 2 12 -6 22 -18 24z" />
          <path d="M200 270 c 4 -16 -8 -26 -18 -24 c -2 12 6 22 18 24z" />
        </g>
        <g fill="#e9c46a" opacity="0.9">
          <circle cx="12" cy="272" r="2.2" />
          <circle cx="40" cy="278" r="1.8" />
          <circle cx="224" cy="276" r="2" />
        </g>
      </svg>
      <div className="sidebar-dark__fade" aria-hidden="true" />

      <svg className="sidebar-dark__leaf right-4 top-28 h-12 w-12" viewBox="0 0 48 48" aria-hidden="true">
        <path d="M24 6c-9 7-14 15-14 24a14 14 0 0 0 28 0c0-9-5-17-14-24z" fill="#cfe2c3" />
        <path d="M24 14v28" stroke="#9dbd8f" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </>
  );
}

/**
 * Left navigation. A fixed, full-height dark forest-green panel with a muted
 * nature scene at its foot on `lg+`; a dark brand strip with a horizontally
 * scrollable nav below that.
 */
export default function Sidebar({ active = 'dashboard' }) {
  return (
    <aside className="sidebar-dark relative z-20 w-full overflow-hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-[230px]">
      <Scene />

      <div className="relative flex items-center gap-4 px-4 py-3 lg:block lg:px-5 lg:pb-6 lg:pt-8">
        <a
          href="#top"
          className="flex shrink-0 items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 lg:flex-col lg:items-center lg:gap-2 lg:text-center"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 lg:h-14 lg:w-14" aria-hidden="true">
            <svg viewBox="0 0 32 32" className="h-7 w-7 lg:h-9 lg:w-9">
              <path d="M16 5c-6 5-10 10-10 16a10 10 0 0 0 20 0c0-6-4-11-10-16z" fill="#9dbd8f" />
              <path d="M16 12v16" stroke="#1f331f" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M16 18c3-2 6-3 9-3M16 23c-3-2-6-3-9-3" stroke="#1f331f" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          <span className="leading-tight">
            <span className="block font-display text-[1.45rem] font-semibold tracking-tight text-white lg:text-[1.6rem]">Nimba Stay</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-sage-300">Nimba Nature Cure</span>
          </span>
        </a>

        <nav aria-label="Primary" className="-mx-1 min-w-0 flex-1 overflow-x-auto lg:mx-0 lg:mt-9 lg:overflow-visible">
          <ul className="flex items-center gap-1 px-1 lg:flex-col lg:items-stretch lg:gap-1.5 lg:px-0">
            {NAV.map((item) => {
              const isActive = item.id === active;
              return (
                <li key={item.id}>
                  <a
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 lg:px-3.5 lg:py-2.5 ${
                      isActive
                        ? 'bg-white/15 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.12)] ring-1 ring-inset ring-white/10'
                        : 'text-white/75 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <NavGlyph name={item.icon} className="h-5 w-5 shrink-0" />
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
