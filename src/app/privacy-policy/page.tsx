import Link from 'next/link'
import { ArrowLeft, ShieldCheck, LockKeyhole, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
              返回首頁
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <LockKeyhole className="h-5 w-5 text-brand-600" />
              隱私權聲明
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-sm leading-7 text-slate-700">
            <p>
              本網站重視使用者隱私，僅於初步條件評估、案件建立與後續聯繫所需範圍內蒐集必要資料。
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 font-semibold text-slate-950">
                  <FileText className="h-4 w-4 text-brand-600" />
                  蒐集目的
                </div>
                <p>用於初審評估、案件建立、客服聯繫與服務改善。</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 font-semibold text-slate-950">
                  <ShieldCheck className="h-4 w-4 text-brand-600" />
                  保護方式
                </div>
                <p>採用權限控管、傳輸加密與最小必要原則管理資料。</p>
              </div>
            </div>
            <p>
              使用者可透過客服管道聯繫我們，查詢、修正或要求停止使用其資料。實際條款可依正式營運需求補充。
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
