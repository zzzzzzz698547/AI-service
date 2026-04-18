import { cn } from '@/lib/utils'

export function Badge({
  className,
  variant = 'default',
  children
}: {
  className?: string
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger'
  children: React.ReactNode
}) {
  const classes: Record<NonNullable<typeof variant>, string> = {
    default: 'bg-slate-900 text-white',
    secondary: 'bg-slate-100 text-slate-700',
    outline: 'border border-slate-200 text-slate-700 bg-white',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200'
  }

  return <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-medium', classes[variant], className)}>{children}</span>
}
