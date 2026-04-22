import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, IBM_Plex_Mono } from 'next/font/google'
import { cn } from '@/lib/utils'

import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta'
})

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono'
})

export const metadata: Metadata = {
  title: '貸款智能初審客服系統',
  description: '專業、乾淨、高轉換的貸款初審客服與 CRM 系統',
  keywords: ['貸款', '初審', 'CRM', 'LINE 諮詢', '金融科技'],
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png'
  }
}

export const viewport: Viewport = {
  themeColor: '#155956'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant" className={`${jakarta.variable} ${mono.variable}`}>
      <body className={cn('min-h-screen bg-slate-50 font-sans text-slate-900')}>
        {children}
      </body>
    </html>
  )
}
