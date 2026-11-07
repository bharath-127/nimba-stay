/**
 * Labelled input with hint and accessible error. `leading` renders an icon
 * inside the field. `variant="hero"` is the larger field used in the search bar.
 */
export default function Input({ id, label, error, hint, leading = null, variant = 'default', className = '', labelClassName = '', ...props }) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;
  const hero = variant === 'hero';

  return (
    <div className={className}>
      <label htmlFor={id} className={`mb-1.5 block text-sm font-medium ${hero ? 'text-ink-700' : 'text-ink-700'} ${labelClassName}`}>
        {label}
      </label>
      <div className="relative">
        {leading && <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-400">{leading}</span>}
        <input
          id={id}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={`w-full rounded-lg border bg-white text-ink-900 shadow-sm transition placeholder:text-ink-300 focus:outline-none focus:ring-2 disabled:bg-sand-50 disabled:text-ink-400 ${
            hero ? 'h-12 text-base' : 'h-10 text-sm'
          } ${leading ? 'pl-10 pr-3' : 'px-3'} ${
            error ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-sand-300 hover:border-sand-400 focus:border-brand-500 focus:ring-brand-200'
          }`}
          {...props}
        />
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
