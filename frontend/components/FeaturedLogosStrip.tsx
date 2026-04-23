'use client'

import Image from 'next/image'

type FeaturedLogo = {
  src: string
  alt: string
  href?: string
}

type FeaturedLogosStripProps = {
  logos: FeaturedLogo[]
  speedSeconds?: number
  compact?: boolean
  className?: string
}

export default function FeaturedLogosStrip({ logos, speedSeconds = 24, compact = false, className }: FeaturedLogosStripProps) {
  const safeLogos = logos.filter((logo) => logo.src.trim().length > 0 && logo.alt.trim().length > 0)
  const repeatCount = compact ? 10 : 6
  const trackLogos = Array.from({ length: repeatCount }, () => safeLogos).flat()

  return (
    <section
      className={[
        'testimonials-cyber-section relative overflow-hidden',
        compact ? 'py-3 sm:py-4' : 'py-8 sm:py-10',
        className ?? '',
      ].join(' ')}
      aria-label="Featured logos"
    >
      <div className="pointer-events-none absolute inset-0 z-20 px-3 sm:px-5">
        <div className="relative h-full w-full">
          <div className="absolute inset-x-0 top-0 h-px bg-amber-300/90" />
          <div className="absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-amber-200/18 to-transparent blur-md" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-amber-300/90" />
          <div className="absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-amber-200/18 to-transparent blur-md" />
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#030508]/90 via-[#030508]/45 to-transparent sm:w-14" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#030508]/90 via-[#030508]/45 to-transparent sm:w-14" />
        <div
          className={[
            'animate-marquee flex w-max items-center',
            compact ? 'gap-4 py-1.5 sm:gap-5 sm:py-2' : 'gap-6 py-4 sm:gap-9 sm:py-5',
          ].join(' ')}
          style={{ ['--duration' as string]: `${speedSeconds}s`, ['--gap' as string]: compact ? '1.25rem' : '2rem' }}
        >
          {trackLogos.map((logo, index) => (
            <article
              key={`${logo.src}-${index}`}
              className={[
                'flex items-center justify-center rounded-xl border border-amber-300/45 bg-[#030811]/78 shadow-[0_0_20px_rgba(251,191,36,0.08)] backdrop-blur-[2px]',
                compact ? 'px-3 py-1 sm:px-3.5 sm:py-1.5' : 'px-4 py-2.5 sm:px-5 sm:py-3',
              ].join(' ')}
              style={compact
                ? { minWidth: 'clamp(78px, 13vw, 108px)', height: 'clamp(30px, 5vw, 40px)' }
                : { minWidth: 'clamp(140px, 28vw, 180px)', height: 'clamp(66px, 12vw, 86px)' }}
            >
              {logo.href ? (
                <a href={logo.href} target="_blank" rel="noreferrer" aria-label={logo.alt} className="inline-flex">
                  <Image
                    src={logo.src}
                    alt={logo.alt}
                    width={compact ? 104 : 188}
                    height={compact ? 30 : 66}
                    loading="lazy"
                    className="w-auto object-contain opacity-95 transition-all duration-300 hover:opacity-100"
                    style={compact ? { height: 'clamp(14px, 2.7vw, 20px)' } : { height: 'clamp(30px, 6vw, 50px)' }}
                  />
                </a>
              ) : (
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={compact ? 104 : 188}
                  height={compact ? 30 : 66}
                  loading="lazy"
                  className="w-auto object-contain opacity-95"
                  style={compact ? { height: 'clamp(14px, 2.7vw, 20px)' } : { height: 'clamp(30px, 6vw, 50px)' }}
                />
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
