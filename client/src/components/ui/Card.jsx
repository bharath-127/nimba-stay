/**
 * Content surface. Optional header with eyebrow / title / subtitle / actions.
 * `padding="none"` lets a child (table, list) run edge to edge.
 */
export default function Card({ title, subtitle, eyebrow, actions, children, className = '', id, padding = 'md', headerClassName = '' }) {
  const pad = padding === 'none' ? '' : padding === 'sm' ? 'p-4' : 'p-5 sm:p-6';
  return (
    <section id={id} className={`surface ${className}`}>
      {(title || actions || eyebrow) && (
        <header className={`flex items-start justify-between gap-4 border-b divider-sand px-5 py-4 sm:px-6 ${headerClassName}`}>
          <div className="min-w-0">
            {eyebrow && <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">{eyebrow}</p>}
            {title && <h2 className="font-display text-lg font-semibold leading-tight text-ink-900">{title}</h2>}
            {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={pad}>{children}</div>
    </section>
  );
}
