import { useId } from 'react';

const TINT = {
  Standard: 'var(--color-cat-standard)',
  Deluxe: 'var(--color-cat-deluxe)',
  Premium: 'var(--color-cat-premium)',
  Suite: 'var(--color-cat-suite)',
};

/**
 * Illustrative "room photo" — no image assets. A warm interior: graded
 * wall, a large bright window spilling daylight across the floor, a bed
 * with a white duvet and a headboard tinted by the category, a glowing
 * bedside lamp and a plant. Decorative only (aria-hidden). 135×84.
 */
export default function RoomThumbnail({ category, className = '' }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const tint = TINT[category] ?? 'var(--color-brand-500)';
  const id = (n) => `${n}-${uid}`;

  return (
    <svg
      viewBox="0 0 135 84"
      aria-hidden="true"
      focusable="false"
      className={`h-[84px] w-[135px] shrink-0 overflow-hidden rounded-xl shadow-[inset_0_0_0_1px_rgb(31_51_31/0.08)] ${className}`}
    >
      <defs>
        <linearGradient id={id('wall')} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#f9f3e8" />
          <stop offset="0.55" stopColor="#efe3cf" />
          <stop offset="1" stopColor="#e2d2b7" />
        </linearGradient>
        <linearGradient id={id('floor')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c69d6c" />
          <stop offset="0.5" stopColor="#a67b4e" />
          <stop offset="1" stopColor="#80593a" />
        </linearGradient>
        <linearGradient id={id('sky')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dbeefb" />
          <stop offset="1" stopColor="#f3f8fb" />
        </linearGradient>
        <linearGradient id={id('duvet')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#efe8dc" />
        </linearGradient>
        <linearGradient id={id('head')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tint} stopOpacity="0.95" />
          <stop offset="1" stopColor={tint} stopOpacity="0.7" />
        </linearGradient>
        <radialGradient id={id('spill')} cx="0.5" cy="0.35" r="0.65">
          <stop offset="0" stopColor="#fff6d6" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff6d6" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('lamp')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffe9a3" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffe9a3" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('shade')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.28" />
        </linearGradient>
      </defs>

      {/* wall, skirting, floor */}
      <rect width="135" height="84" fill={`url(#${id('wall')})`} />
      <rect y="60" width="135" height="24" fill={`url(#${id('floor')})`} />
      <rect y="59" width="135" height="2.5" fill="#f4ecdd" />
      <g opacity="0.22" stroke="#6b4b2e" strokeWidth="0.6">
        <line x1="0" y1="68" x2="135" y2="66" />
        <line x1="0" y1="76" x2="135" y2="73" />
      </g>

      {/* window: frame, sky, garden, mullions */}
      <rect x="83" y="7" width="42" height="36" rx="3" fill="#fbf7ee" />
      <rect x="86" y="10" width="36" height="30" rx="2" fill={`url(#${id('sky')})`} />
      <path d="M86 40c7-10 13-14 19-14s12 4 17 14z" fill="#a9d4a0" opacity="0.75" />
      <path d="M86 40c4-5 8-8 12-8s8 3 12 8z" fill="#7fb87a" opacity="0.6" />
      <line x1="104" y1="10" x2="104" y2="40" stroke="#fbf7ee" strokeWidth="2.2" />
      <line x1="86" y1="25" x2="122" y2="25" stroke="#fbf7ee" strokeWidth="2.2" />
      {/* curtain */}
      <path d="M78 5h7v41h-7c3-8 3-30 0-41z" fill="#e8dcc6" />
      <path d="M78 5c2 10 2 31 0 41" stroke="#d6c6a8" strokeWidth="0.8" fill="none" />
      {/* light spill onto floor */}
      <ellipse cx="104" cy="66" rx="30" ry="12" fill={`url(#${id('spill')})`} />

      {/* framed picture */}
      <rect x="28" y="12" width="22" height="14" rx="1.5" fill="#fbf7ee" />
      <rect x="30.5" y="14.5" width="17" height="9" fill="#9fbf9a" opacity="0.7" />

      {/* headboard */}
      <rect x="10" y="29" width="62" height="25" rx="4" fill={`url(#${id('head')})`} />
      <rect x="10" y="29" width="62" height="25" rx="4" fill={`url(#${id('shade')})`} opacity="0.5" />
      <g opacity="0.25" stroke="#fff" strokeWidth="0.8">
        <line x1="30" y1="29" x2="30" y2="54" />
        <line x1="51" y1="29" x2="51" y2="54" />
      </g>

      {/* mattress + duvet */}
      <rect x="7" y="48" width="70" height="22" rx="4" fill={`url(#${id('duvet')})`} />
      <path d="M7 58h70v9a4 4 0 0 1-4 4H11a4 4 0 0 1-4-4z" fill={tint} opacity="0.28" />
      <path d="M7 58c20-2 50-2 70 0" stroke="#e5dccd" strokeWidth="1" fill="none" />
      {/* pillows */}
      <rect x="14" y="40" width="23" height="10" rx="3" fill="#ffffff" />
      <rect x="41" y="40" width="23" height="10" rx="3" fill="#ffffff" />
      <rect x="14" y="40" width="23" height="10" rx="3" fill={`url(#${id('shade')})`} opacity="0.15" />
      <rect x="41" y="40" width="23" height="10" rx="3" fill={`url(#${id('shade')})`} opacity="0.15" />
      {/* bed base */}
      <rect x="7" y="68" width="70" height="4" rx="1.5" fill="#c9b494" />
      <rect x="7" y="70" width="70" height="6" rx="1" fill="#000" opacity="0.08" />

      {/* bedside table + lamp */}
      <rect x="112" y="47" width="16" height="15" rx="1.5" fill="#d7c3a1" />
      <rect x="112" y="52" width="16" height="1" fill="#b89d78" />
      <circle cx="120" cy="36" r="13" fill={`url(#${id('lamp')})`} />
      <path d="M113 45h14l-2.5-9h-9z" fill="#f7dc93" />
      <rect x="119" y="45" width="2" height="4" fill="#9c8156" />

      {/* plant */}
      <path d="M4 60c0-11 4-18 10-20-1 8-3 14-10 20z" fill="#6a9a61" />
      <path d="M7 60c3-10 9-15 15-15-3 7-8 12-15 15z" fill="#4b7c44" />
      <rect x="2" y="59" width="9" height="6" rx="1" fill="#b5856a" />
    </svg>
  );
}
