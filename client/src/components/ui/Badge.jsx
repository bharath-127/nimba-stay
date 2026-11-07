const tones = {
  success: 'bg-brand-100 text-brand-800 ring-brand-200',
  neutral: 'bg-sand-100 text-ink-700 ring-sand-200',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200',
  danger: 'bg-red-50 text-red-800 ring-red-200',
  info: 'bg-sky-50 text-sky-800 ring-sky-200',
  standard: 'bg-cat-standard-soft text-cat-standard ring-cat-standard/20',
  deluxe: 'bg-cat-deluxe-soft text-cat-deluxe ring-cat-deluxe/20',
  premium: 'bg-cat-premium-soft text-cat-premium ring-cat-premium/20',
  suite: 'bg-cat-suite-soft text-cat-suite ring-cat-suite/25',
};

const dots = {
  success: 'bg-brand-500',
  neutral: 'bg-ink-400',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-sky-500',
};

/** Tone for a room category name ("Deluxe" → "deluxe"); falls back to neutral. */
export function categoryTone(category) {
  const key = String(category ?? '').toLowerCase();
  return key in tones ? key : 'neutral';
}

/** Small status pill. `dot` adds a coloured dot; `icon` a leading glyph. */
export default function Badge({ tone = 'neutral', dot = false, icon = null, children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone] ?? tones.neutral} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dots[tone] ?? dots.neutral}`} aria-hidden="true" />}
      {icon}
      {children}
    </span>
  );
}
