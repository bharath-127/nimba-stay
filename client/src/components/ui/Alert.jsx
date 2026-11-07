const tones = {
  error: { box: 'border-red-200 bg-red-50 text-red-900', icon: 'text-red-500' },
  warning: { box: 'border-amber-200 bg-amber-50 text-amber-900', icon: 'text-amber-500' },
  success: { box: 'border-brand-200 bg-brand-50 text-brand-900', icon: 'text-brand-600' },
  info: { box: 'border-sky-200 bg-sky-50 text-sky-900', icon: 'text-sky-500' },
};

const icons = {
  error: 'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z',
  warning: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
  success: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  info: 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z',
};

/** Inline status message. `role="alert"` for errors so they are announced. */
export default function Alert({ tone = 'info', title, children, action, className = '' }) {
  const t = tones[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex gap-3 rounded-xl border p-4 text-sm ${t.box} ${className}`}>
      <svg className={`mt-0.5 h-5 w-5 shrink-0 ${t.icon}`} fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d={icons[tone]} />
      </svg>
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-0.5' : ''}>{children}</div>}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}
