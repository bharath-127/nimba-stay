export default function Select({ id, label, error, hint, variant = 'default', children, className = '', ...props }) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;
  const hero = variant === 'hero';

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-700">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={`w-full appearance-none rounded-lg border bg-white pl-3 pr-9 text-ink-900 shadow-sm transition focus:outline-none focus:ring-2 disabled:bg-sand-50 disabled:text-ink-400 ${
            hero ? 'h-12 text-base' : 'h-10 text-sm'
          } ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-sand-300 hover:border-sand-400 focus:border-brand-500 focus:ring-brand-200'}`}
          {...props}
        >
          {children}
        </select>
        <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </div>
      {hint && !error && (
        <p id={hintId} className="mt-1 text-xs text-ink-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
