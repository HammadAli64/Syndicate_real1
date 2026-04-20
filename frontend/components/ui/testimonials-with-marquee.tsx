'use client'

import { cn } from '@/lib/utils'
import { TestimonialCard, type TestimonialAuthor } from '@/components/ui/testimonial-card'

export interface TestimonialItem {
  author: TestimonialAuthor
  text: string
  href?: string
}

interface TestimonialsWithMarqueeProps {
  title: string
  description: string
  testimonials: TestimonialItem[]
  className?: string
  rows?: number
}

export function TestimonialsWithMarquee({
  title,
  description,
  testimonials,
  className,
  rows = 2,
}: TestimonialsWithMarqueeProps) {
  return (
    <section className={cn('text-foreground px-0 py-12 sm:py-24 md:py-32', className)}>
      <div className="mx-auto flex max-w-container flex-col items-center gap-4 text-center sm:gap-16">
        <div className="flex flex-col items-center gap-4 px-4 sm:gap-8">
          <h2 className="testimonials-cyber-title max-w-[720px] text-3xl font-semibold leading-tight tracking-wide sm:text-5xl sm:leading-tight">
            {title}
          </h2>
          <p className="testimonials-cyber-desc text-md max-w-[600px] font-medium sm:text-xl">{description}</p>
        </div>

        <div className="relative flex w-full flex-col items-center justify-center gap-8 overflow-visible">
          {[...Array(rows)].map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="relative flex min-h-[180px] w-full flex-shrink-0 items-center justify-center overflow-hidden"
            >
              <div className="group flex w-full flex-row overflow-hidden p-2 [gap:var(--gap)] [--duration:40s] [--gap:1rem]">
                <div
                  className={cn(
                    'flex shrink-0 flex-row justify-around [gap:var(--gap)] group-hover:[animation-play-state:paused]',
                    rowIndex % 2 === 0 ? 'animate-marquee-reverse' : 'animate-marquee',
                  )}
                >
                  {[...Array(4)].map((_, setIndex) =>
                    testimonials.map((testimonial, i) => (
                      <TestimonialCard key={`${rowIndex}-${setIndex}-${i}`} {...testimonial} />
                    )),
                  )}
                </div>
              </div>
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-1/3 bg-gradient-to-r from-[#030508] to-transparent sm:block" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-1/3 bg-gradient-to-l from-[#030508] to-transparent sm:block" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
