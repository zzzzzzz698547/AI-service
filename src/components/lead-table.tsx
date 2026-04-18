import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableElement, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import type { LeadStatus } from '@/lib/types'
import { ArrowUpRight } from 'lucide-react'

export type LeadRow = {
  id: string
  fullName: string
  phone: string
  createdAt: string
  status: LeadStatus
  primaryRecommendation: string
  riskLevel: string
  score: number
  assignedSalesId: string | null
  fundingNeed: number
}

export function LeadsTable({ leads }: { leads: LeadRow[] }) {
  return (
    <Table>
      <TableElement>
        <Thead>
          <tr>
            <Th>客戶</Th>
            <Th>方案</Th>
            <Th>狀態</Th>
            <Th>風險</Th>
            <Th>金額</Th>
            <Th>建立時間</Th>
            <Th className="text-right">操作</Th>
          </tr>
        </Thead>
        <Tbody>
          {leads.map((lead) => (
            <Tr key={lead.id}>
              <Td>
                <div className="font-medium text-slate-950">{lead.fullName}</div>
                <div className="text-xs text-slate-500">{lead.phone}</div>
              </Td>
              <Td>
                <Badge variant="secondary">{lead.primaryRecommendation}</Badge>
              </Td>
              <Td>
                <Badge variant={statusVariant(lead.status)}>{lead.status}</Badge>
              </Td>
              <Td>
                <Badge variant={riskVariant(lead.riskLevel)}>{lead.riskLevel}</Badge>
              </Td>
              <Td className="font-medium text-slate-950">{formatCurrency(lead.fundingNeed)}</Td>
              <Td className="text-slate-600">{formatDateTime(lead.createdAt)}</Td>
              <Td className="text-right">
                <Link href={`/dashboard/leads/${lead.id}`}>
                  <Button variant="outline" size="sm">
                    查看
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </TableElement>
    </Table>
  )
}

function statusVariant(status: LeadStatus) {
  if (status === 'CONVERTED') return 'success'
  if (status === 'REVIEWING' || status === 'CONTACT_PENDING') return 'warning'
  if (status === 'DECLINED') return 'danger'
  return 'secondary'
}

function riskVariant(riskLevel: string) {
  if (riskLevel === 'LOW') return 'success'
  if (riskLevel === 'MEDIUM') return 'warning'
  if (riskLevel === 'HIGH') return 'danger'
  return 'default'
}
