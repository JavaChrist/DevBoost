const variants = {
  primary:
    'bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-400',
  secondary:
    'bg-slate-800 text-slate-100 hover:bg-slate-700 active:bg-slate-900 disabled:bg-slate-900 disabled:text-slate-500',
  danger: 'bg-rose-500 text-slate-950 hover:bg-rose-400 active:bg-rose-600',
  ghost: 'bg-transparent text-slate-300 hover:bg-slate-800/60',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-base',
  lg: 'px-6 py-3.5 text-lg',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}) {
  return (
    <button
      type="button"
      className={[
        'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold tracking-tight transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70',
        variants[variant] ?? variants.primary,
        sizes[size] ?? sizes.md,
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}
