import Spinner from './Spinner.jsx';

const variants = {
  primary:
    'bg-brand-700 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.12)] hover:bg-brand-800 active:bg-brand-900 disabled:bg-brand-300',
  secondary:
    'bg-white text-brand-800 border border-brand-200 hover:border-brand-400 hover:bg-brand-50 disabled:text-ink-400 disabled:border-sand-200',
  tonal: 'bg-brand-100 text-brand-800 hover:bg-brand-200 disabled:bg-sand-100 disabled:text-ink-400',
  ghost: 'bg-transparent text-ink-700 hover:bg-sand-100 hover:text-ink-900 disabled:text-ink-400',
  danger: 'bg-white text-red-700 border border-red-200 hover:bg-red-50 hover:border-red-300 disabled:text-ink-400 disabled:border-sand-200',
  inverse: 'bg-white text-brand-800 hover:bg-sand-50 disabled:bg-white/60',
};

const sizes = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
  xl: 'h-12 px-6 text-base gap-2.5',
};

/**
 * Button with variants (primary · secondary · tonal · ghost · danger · inverse),
 * sizes (sm · md · lg · xl), optional leading icon and a loading state that
 * keeps the width stable and disables interaction.
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  icon = null,
  className = '',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-[background-color,border-color,color,transform] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 active:translate-y-px disabled:cursor-not-allowed disabled:active:translate-y-0 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? <Spinner className="h-4 w-4" /> : icon}
      {children}
    </button>
  );
}
