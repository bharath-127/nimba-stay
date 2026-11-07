import { useId } from 'react';

const TINT = {
  Standard: 'var(--color-cat-standard)',
  Deluxe: 'var(--color-cat-deluxe)',
  Premium: 'var(--color-cat-premium)',
  Suite: 'var(--color-cat-suite)',
};

/**
 * Illustrative "room art" — no image assets. A warm interior with a window,
 * headboard and bed; the headboard and throw take the category's accent so
 * Deluxe, Premium and Suite read differently at a glance. Decorative only.
 */
export default function RoomThumbnail({ category, className = '' }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const tint = TINT[category] ?? 'var(--color-brand-500)';
  const wallId = `wall-${uid}`;
  const floorId = `floor-${uid}`;
  const glowId = `glow-${uid}`;

  return (
    <svg
      viewBox="0 0 120 80"
      aria-hidden="true"
      focusable="false"
      className={`h-20 w-[7.5rem] shrink-0 overflow-hidden rounded-xl shadow-[inset_0_0_0_1px_rgb(31_51_31/0.06)] ${className}`}
    >
      <defs>
        <linearGradient id={wallId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f8f1e4" />
          <stop offset="1" stopColor="#e9dcc6" />
        </linearGradient>
        <linearGradient id={floorId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b48a5c" />
          <stop offset="1" stopColor="#8f6a43" />
        </linearGradient>
        <radialGradient id={glowId} cx="0.5" cy="0.5" r="0.6">
          <stop offset="0" stopColor="#fff2c4" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff2c4" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* wall + floor */}
      <rect width="120" height="80" fill={`url(#${wallId})`} />
      <rect y="58" width="120" height="22" fill={`url(#${floorId})`} />
      <rect y="58" width="120" height="2" fill="#6f5133" opacity="0.5" />

      {/* window with daylight */}
      <rect x="74" y="9" width="34" height="30" rx="2.5" fill="#cfe6f2" />
      <rect x="74" y="9" width="34" height="30" rx="2.5" fill="none" stroke="#f3eadb" strokeWidth="2.5" />
      <line x1="91" y1="9" x2="91" y2="39" stroke="#f3eadb" strokeWidth="2" />
      <line x1="74" y1="24" x2="108" y2="24" stroke="#f3eadb" strokeWidth="2" />
      <path d="M76 36c6-9 12-12 18-12s12 3 12 12z" fill="#9fcfa4" opacity="0.6" />
      <ellipse cx="91" cy="52" rx="24" ry="9" fill={`url(#${glowId})`} />

      {/* headboard + bed */}
      <rect x="12" y="27" width="54" height="24" rx="4" fill={tint} opacity="0.9" />
      <rect x="9" y="45" width="64" height="20" rx="4" fill="#fffaf2" />
      <rect x="9" y="54" width="64" height="11" rx="3" fill={tint} opacity="0.32" />
      <rect x="15" y="39" width="20" height="9" rx="3" fill="#ffffff" />
      <rect x="39" y="39" width="20" height="9" rx="3" fill="#ffffff" />
      <rect x="9" y="63" width="64" height="4" rx="1.5" fill="#d9c6a6" />

      {/* bedside lamp */}
      <rect x="99" y="44" width="12" height="14" rx="1.5" fill="#e3d2b3" />
      <path d="M100 44h10l-2-7h-6z" fill="#f6d98c" />
      <circle cx="105" cy="41" r="8" fill="#ffe9a8" opacity="0.35" />

      {/* plant */}
      <path d="M5 58c0-10 4-16 9-18-1 7-3 12-9 18z" fill="#6a9a61" />
      <path d="M8 58c3-9 8-13 13-13-3 6-7 10-13 13z" fill="#4b7c44" />
    </svg>
  );
}
