import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BrandMark } from '@/components/brand-mark'

const lineHref = 'https://line.me/ti/p/LU8wTJb3wF'

export function SiteNavbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white p-2 shadow-soft ring-1 ring-brand-100">
            <BrandMark className="h-full w-full scale-[0.92]" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-wide text-slate-900">貸款智能初審客服系統</div>
            <div className="text-xs text-slate-500">初步條件評估・快速了解可參考方案</div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 sm:inline">
            後台登入
          </Link>
          <a href="#faq">
            <Button variant="outline" size="sm">常見問題</Button>
          </a>
          <a href={lineHref} target="_blank" rel="noreferrer">
            <Button variant="brand" size="sm">LINE 諮詢</Button>
          </a>
        </div>
      </div>
    </header>
  )
}
