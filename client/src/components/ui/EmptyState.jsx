/** Leaf motif used by empty states — inline so it needs no asset request. */
export function LeafIllustration({ className = 'h-14 w-14' }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="32" r="30" className="fill-brand-50" />
      <path d="M32 12c-11 9-18 19-18 30a18 18 0 0 0 36 0c0-11-7-21-18-30z" className="fill-brand-100 stroke-brand-400" strokeWidth="1.5" />
      <path d="M32 22v30" className="stroke-brand-500" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M32 34c4-3 8-4 12-4M32 42c-4-3-8-4-12-4" className="stroke-brand-400" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function EmptyState({ title, description, action, illustration = <LeafIllustration />, compact = false }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-sand-300 bg-sand-50/70 px-6 text-center ${compact ? 'py-8' : 'py-14'}`}
    >
      <div className="mb-3">{illustration}</div>
      <p className="font-display text-base font-semibold text-ink-900">{title}</p>
      {description && <p className="mt-1 max-w-md text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
