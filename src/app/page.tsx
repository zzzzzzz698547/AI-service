import Link from 'next/link'
import { ArrowRight, CheckCircle2, ShieldCheck, ShieldAlert, Sparkles, TrendingUp, MessageCircleMore } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { SiteNavbar } from '@/components/site-navbar'
import { LoanChatbot } from '@/components/loan-chatbot'
import { BrandMark } from '@/components/brand-mark'

const lineHref = 'https://line.me/ti/p/LU8wTJb3wF'

const plans = [
  {
    title: '信用貸款',
    description: '適合有薪轉、勞保或穩定收入者，快速了解可參考方案。',
    items: ['快速初審', '條件清楚', '可先試算']
  },
  {
    title: '汽車 / 機車貸款',
    description: '名下有車即可優先評估，靈活處理短期資金需求。',
    items: ['有車可評估', '可搭配增貸', '重視核准速度']
  },
  {
    title: '房屋二胎 / 整合負債',
    description: '資金需求較高或負債壓力較重時，提供更完整的初步方向。',
    items: ['資產條件加分', '協助整理月付', '可搭配人工覆核']
  }
]

const faqs = [
  {
    q: '這是正式核貸嗎？',
    a: '不是，這裡提供的是初步條件評估，協助你快速了解可參考方案。'
  },
  {
    q: '多久可以知道初審結果？',
    a: '送出後系統會立即完成規則初審，後台業務也能同步看到案件。'
  },
  {
    q: '資料會直接公開給外部嗎？',
    a: '不會，系統預留 Email、LINE 與 Telegram 通知模組，後續可依你的流程擴充。'
  }
]

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      <SiteNavbar />

      <section className="relative isolate border-b border-slate-200 bg-white">
        <div className="absolute inset-0 fin-grid opacity-60" />
        <div className="absolute right-0 top-0 h-[32rem] w-[32rem] translate-x-1/4 -translate-y-1/4 rounded-full bg-brand-100/60 blur-3xl" />
        <div className="absolute left-0 top-36 h-60 w-60 -translate-x-1/2 rounded-full bg-gold-100/70 blur-3xl" />
        <div className="mx-auto grid min-h-[calc(100svh-5rem)] max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-0">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-3 rounded-full border border-brand-100 bg-white/90 px-4 py-2 shadow-soft backdrop-blur">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white p-2 ring-1 ring-brand-100">
                <BrandMark className="h-full w-full scale-[0.92]" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-slate-900">貸款智能初審客服系統</div>
                <div className="text-xs text-slate-500">初步條件評估・快速了解可參考方案</div>
              </div>
            </div>
            <Badge variant="outline" className="mb-5 border-brand-200 bg-brand-50 text-brand-700">
              貸款官方網站・金融科技感介面
            </Badge>
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              讓客戶先完成初步條件評估，
              <span className="text-brand-700">再快速了解可參考方案。</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              以專業、乾淨、可信任的方式，把貸款諮詢流程前置化。讓每一位來訪者都能先看懂自己適合哪種方案，並直接進入高轉換的智能初審流程。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#evaluate">
                <Button size="lg" variant="brand">
                  立即評估
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <a href={lineHref} target="_blank" rel="noreferrer">
                <Button size="lg" variant="outline">
                  LINE 諮詢
                  <MessageCircleMore className="h-4 w-4" />
                </Button>
              </a>
            </div>
            <div className="mt-10 grid gap-4 text-sm text-slate-600 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-soft">
                <ShieldCheck className="h-4 w-4 text-brand-600" />
                明確規則初審
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-soft">
                <TrendingUp className="h-4 w-4 text-brand-600" />
                提升轉換效率
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-soft">
                <Sparkles className="h-4 w-4 text-brand-600" />
                支援 CRM 串接
              </div>
            </div>
          </div>

          <div className="relative z-10">
            <Card className="overflow-hidden border-slate-200 shadow-lift">
              <CardHeader className="bg-slate-950 text-white">
                <CardTitle className="text-white">智能初審儀表板</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 p-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ['初步評估', '30 秒完成'],
                    ['推薦方案', '即時顯示'],
                    ['風險判斷', '規則引擎'],
                    ['通知流程', '可預留擴充']
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs text-slate-500">{label}</div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">{value}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-brand-100 bg-brand-50 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-brand-800">建議方案</span>
                    <Badge variant="success">低風險</Badge>
                  </div>
                  <div className="mt-2 text-xl font-semibold text-slate-950">信用貸款 / 汽車增貸</div>
                  <p className="mt-1 text-sm text-slate-600">依收入、資產與負債條件，先給出可參考方向。</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="evaluate" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">方案介紹</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">依條件先篩選，再把合適方案交給業務。</h2>
            <p className="mt-4 text-slate-600">前台著重清楚轉換，後台著重精準分流。這套流程讓客戶更快知道下一步，團隊也能更快處理案件。</p>
          </div>
          <div className="hidden lg:flex">
            <Button variant="gold">
              <Link href="/login" className="inline-flex items-center gap-2">
                後台登入
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.title}>
              <CardContent className="space-y-4 p-6">
                <div>
                  <h3 className="text-xl font-semibold text-slate-950">{plan.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{plan.description}</p>
                </div>
                <Separator />
                <ul className="space-y-3 text-sm text-slate-700">
                  {plan.items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">核心亮點</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">從首頁就能建立信任感，並自然導向初審入口。</h2>
            <p className="mt-4 text-slate-600">
              以白底、深藍與藍綠點綴的金融科技語氣，搭配卡片式資訊層級，讓整體外觀看起來專業、穩定且容易轉換。
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['初步條件評估', '用規則引擎判斷，不靠 AI 亂猜。'],
              ['快速了解方案', '先看信用、車貸、房貸與整合負債方向。'],
              ['手機 / 桌機都順', '聊天入口固定在右下角，流程清楚。'],
              ['後台 CRM 對接', '進件、通知、跟進與指派全都有。']
            ].map(([title, text]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="text-base font-semibold text-slate-900">{title}</div>
                <div className="mt-2 text-sm leading-6 text-slate-600">{text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">常見問題</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">讓客戶在送件前，先把疑問釐清。</h2>
        </div>
        <div className="mt-8 grid gap-4">
          {faqs.map((faq) => (
            <Card key={faq.q}>
              <CardContent className="p-6">
                <div className="text-base font-semibold text-slate-950">{faq.q}</div>
                <div className="mt-2 text-sm leading-6 text-slate-600">{faq.a}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="contact" className="border-t border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:flex lg:items-center lg:justify-between lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-300">立即評估</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">把訪客變成案件，把案件交給你的 CRM。</h2>
            <p className="mt-4 text-slate-300">點右下角聊天入口即可開始多步驟初審，送出後會建立案件並預留通知擴充能力。</p>
          </div>
          <div className="mt-6 flex gap-3 lg:mt-0">
            <a href={lineHref} target="_blank" rel="noreferrer">
              <Button variant="gold" size="lg">
                <MessageCircleMore className="h-4 w-4" />
                LINE 諮詢
              </Button>
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-8">
          <div className="space-y-3">
            <div className="text-sm font-semibold tracking-wide text-slate-950">貸款智能初審客服系統</div>
            <p className="max-w-xl text-sm leading-6 text-slate-600">
              本網站提供初步條件評估與可參考方案資訊，實際核准結果仍以銀行或合作機構審核為準。
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />
                SSL 安全網站認證
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                資料僅供初審使用
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold text-slate-950">站內資訊</div>
            <div className="flex flex-col gap-2 text-sm text-slate-600">
              <Link href="/privacy-policy" className="transition hover:text-brand-700">
                隱私權聲明
              </Link>
              <a href="#faq" className="transition hover:text-brand-700">
                常見問題
              </a>
              <a href={lineHref} target="_blank" rel="noreferrer" className="transition hover:text-brand-700">
                LINE 諮詢
              </a>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold text-slate-950">聯絡方式</div>
            <div className="space-y-2 text-sm text-slate-600">
              <p>客服時間：週一至週五 09:00 - 18:00</p>
              <p>電子郵件：service@loanflow.tw</p>
              <p>LINE 官方帳號：@loanflow</p>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-200">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <p>© 2026 貸款智能初審客服系統. All rights reserved.</p>
            <p>本頁面採用 HTTPS / SSL 傳輸保護概念設計。</p>
          </div>
        </div>
      </footer>

      <LoanChatbot />
    </main>
  )
}
