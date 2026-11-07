export default function Card({ title, subtitle, eyebrow, actions, children, className = '', id }) {
  return (
    <section id={id} className={`rounded-xl border border-sand-200 bg-white shadow-sm ${className}`}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-4 border-b border-sand-100 px-5 py-4">
          <div>
            {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">{eyebrow}</p>}
            {title && <h2 className="text-base font-semibold text-slate-900">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
