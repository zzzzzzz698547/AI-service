import { AddSalesForm } from '@/components/add-sales-form'
import { getSession } from '@/lib/session'

export default function AddSalesPage() {
  const session = getSession()
  return <AddSalesForm canEdit={session?.role === 'ADMIN'} />
}
