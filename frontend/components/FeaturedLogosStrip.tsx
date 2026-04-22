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
}

export default function FeaturedLogosStrip({ logos, speedSeconds = 24 }: FeaturedLogosStripProps) {
  const safeLogos = logos.filter((logo) => logo.src.trim().length > 0 && logo.alt.trim().length > 0)
  const trackLogos = [...safeLogos, ...safeLogos, ...safeLogos]

  return (
    <section className="testimonials-cyber-section relative overflow-hidden px-4 py-10 sm:px-6 sm:py-12" aria-label="Featured logos">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#030508] to-transparent sm:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#030508] to-transparent sm:w-24" />

      <div className="relative mx-auto max-w-[860px] overflow-hidden">
        <div
          className="animate-marquee flex w-max items-center gap-8 sm:gap-10"
          style={{ ['--duration' as string]: `${speedSeconds}s`, ['--gap' as string]: '2.25rem' }}
        >
          {trackLogos.map((logo, index) => (
            <article
              key={`${logo.src}-${index}`}
              className="flex items-center justify-center rounded-xl border border-cyan-300/20 bg-slate-950/60 px-5 py-3 shadow-[0_0_18px_rgba(34,211,238,0.12)] backdrop-blur-sm sm:px-8 sm:py-4"
              style={{ minWidth: 'clamp(190px, 44vw, 360px)', height: 'clamp(86px, 16vw, 128px)' }}
            >
              {logo.href ? (
                <a href={logo.href} target="_blank" rel="noreferrer" aria-label={logo.alt} className="inline-flex">
                  <Image
                    src={logo.src}
                    alt={logo.alt}
                    width={260}
                    height={96}
                    loading="lazy"
                    className="w-auto object-contain opacity-95 transition-opacity hover:opacity-100"
                    style={{ height: 'clamp(36px, 8vw, 64px)' }}
                  />
                </a>
              ) : (
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={260}
                  height={96}
                  loading="lazy"
                  className="w-auto object-contain opacity-95"
                  style={{ height: 'clamp(36px, 8vw, 64px)' }}
                />
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
