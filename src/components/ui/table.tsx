import { cn } from '@/lib/utils'

export function Table({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft', className)}>{children}</div>
}

export function TableElement({ className, children }: { className?: string; children: React.ReactNode }) {
  return <table className={cn('w-full border-collapse text-left text-sm', className)}>{children}</table>
}

export function Thead({ className, children }: { className?: string; children: React.ReactNode }) {
  return <thead className={cn('bg-slate-50 text-xs uppercase tracking-wide text-slate-500', className)}>{children}</thead>
}

export function Tbody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <tbody className={cn('divide-y divide-slate-100', className)}>{children}</tbody>
}

export function Tr({ className, children }: { className?: string; children: React.ReactNode }) {
  return <tr className={cn('transition hover:bg-slate-50', className)}>{children}</tr>
}

export function Th({ className, children }: { className?: string; children: React.ReactNode }) {
  return <th className={cn('px-4 py-3 font-medium', className)}>{children}</th>
}

export function Td({ className, children }: { className?: string; children: React.ReactNode }) {
  return <td className={cn('px-4 py-4 align-top', className)}>{children}</td>
}
