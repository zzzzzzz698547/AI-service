import type { CSSProperties } from 'react'

type BrandMarkProps = {
  className?: string
  style?: CSSProperties
}

export function BrandMark({ className, style }: BrandMarkProps) {
  return (
    <img
      src="/logo.png"
      alt="將御 AI 客服"
      className={className ? `${className} object-contain` : 'object-contain'}
      style={style}
      role="img"
    />
  )
}
