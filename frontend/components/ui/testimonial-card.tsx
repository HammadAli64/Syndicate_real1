'use client'

import { cn } from '@/lib/utils'

export interface TestimonialAuthor {
  name: string
  handle: string
  avatar: string
}

export interface TestimonialCardProps {
  author: TestimonialAuthor
  text: string
  href?: string
  className?: string
}

export function TestimonialCard({ author, text, href, className }: TestimonialCardProps) {
  const inner = (
    <>
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-[rgba(0,245,255,0.25)]">
          <img src={author.avatar} alt={author.name} className="h-full w-full object-cover" loading="lazy" decoding="async" />
        </div>
        <div className="flex flex-col items-start">
          <h3 className="text-md font-semibold leading-none text-slate-100">{author.name}</h3>
          <p className="text-xs font-mono tracking-wider text-[#00f5ff]/80">{author.handle}</p>
        </div>
      </div>
      <p className="sm:text-md mt-4 text-sm leading-relaxed text-slate-300">{text}</p>
    </>
  )

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className={cn(
          'testimonial-card-cyber flex flex-col rounded-lg border',
          'bg-gradient-to-b from-[rgba(8,12,18,0.92)] to-[rgba(4,8,14,0.88)]',
          'p-4 text-start sm:p-6 backdrop-blur-sm',
          'hover:from-[rgba(12,18,28,0.95)] hover:to-[rgba(6,12,20,0.92)]',
          'max-w-[320px] sm:max-w-[320px]',
          'transition-all duration-300',
          'border-[rgba(0,245,255,0.35)] hover:border-[#00f5ff]',
          'shadow-[0_0_20px_rgba(0,245,255,0.06)] hover:shadow-[0_0_28px_rgba(0,245,255,0.15)]',
          className,
        )}
      >
        {inner}
      </a>
    )
  }

  return (
    <div
      className={cn(
        'testimonial-card-cyber flex flex-col rounded-lg border',
        'bg-gradient-to-b from-[rgba(8,12,18,0.92)] to-[rgba(4,8,14,0.88)]',
        'p-4 text-start sm:p-6 backdrop-blur-sm',
        'hover:from-[rgba(12,18,28,0.95)] hover:to-[rgba(6,12,20,0.92)]',
        'max-w-[320px] sm:max-w-[320px]',
        'transition-all duration-300',
        'border-[rgba(0,245,255,0.35)] hover:border-[#00f5ff]',
        'shadow-[0_0_20px_rgba(0,245,255,0.06)] hover:shadow-[0_0_28px_rgba(0,245,255,0.15)]',
        className,
      )}
    >
      {inner}
    </div>
  )
}
