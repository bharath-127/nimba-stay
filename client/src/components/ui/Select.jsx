export default function Select({ id, label, error, children, className = '', ...props }) {
  const errorId = `${id}-error`;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`h-10 w-full rounded-md border bg-white px-3 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-500 ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
            : 'border-slate-300 focus:border-brand-500 focus:ring-brand-200'
        }`}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
