import * as React from 'react'
import { cn } from '@/lib/utils'

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}
