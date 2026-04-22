import Image from 'next/image'
import LetterGlitch from '@/components/LetterGlitch'
import NeonTypingBadge from '@/components/NeonTypingBadge'
import FeaturedLogosStrip from '@/components/FeaturedLogosStrip'
import SyndicateReachSection from '@/components/SyndicateReachSection'
import CertificatesSection from '@/components/CertificatesSection'
import CoursesGrid from '@/components/CoursesGrid'

export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      <section id="heroSection" className="relative h-screen w-screen overflow-hidden">
        <LetterGlitch
          glitchSpeed={70}
          centerVignette
          outerVignette
          smooth
          glitchColors={['#4a2b72', '#61dca3', '#61b3dc']}
          layerOpacity={0.3}
          className="absolute inset-0 h-screen w-screen"
        />
        <div
          className="pointer-events-none absolute left-1/2 z-20 w-full -translate-x-1/2 px-4"
          style={{ top: 'clamp(78px, 11vw, 96px)' }}
        >
          <div className="mx-auto flex w-full max-w-[900px] justify-center">
            <NeonTypingBadge
              phrases={[
                'HONOUR · MONEY · POWER · FREEDOM',
              ]}
              typingSpeed={78}
              deletingSpeed={44}
              pauseMs={1350}
            />
          </div>
        </div>
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-[19] -translate-x-1/2 -translate-y-1/2">
          <Image
            src="/Assets/logo.png"
            alt="ONEM Logo"
            width={1020}
            height={720}
            priority
            className="hamburger-attract block object-contain"
            style={{
              width: 'min(1020px, 92vw)',
              height: 'min(720px, 76vh)',
              maxWidth: '1020px',
              maxHeight: '720px',
              filter: 'drop-shadow(0 0 14px rgba(251, 191, 36, 0.35))',
            }}
          />
        </div>
        <div className="relative z-10 h-screen w-screen" />
      </section>
      <section className="relative m-0 h-screen w-screen overflow-hidden p-0">
        <Image
          src="/Assets/cb.gif"
          alt="Cyber neon animated visual"
          fill
          unoptimized
          className="object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-black/20" />
      </section>
      <CoursesGrid />
      <CertificatesSection />
      <SyndicateReachSection />
      <FeaturedLogosStrip
        logos={[
          {
            src: '/Assets/press-forbes.png',
            alt: 'Forbes logo',
            href: 'https://forbes.ge/en/how-the-syndicate-uses-mastery-and-empowerment-to-redefine-business/',
          },
          {
            src: '/Assets/press-luxury.png',
            alt: 'LLM logo',
            href: 'https://www.luxurylifestylemag.co.uk/money/how-the-syndicate-empowers-individuals-to-master-power-money-and-influence-in-the-money-mastery-course/',
          },
          {
            src: '/Assets/press-gq.png',
            alt: 'GQ logo',
            href: 'https://gq.co.za/wealth/2025-02-10-how-the-syndicate-can-disrupt-the-traditional-model-of-influence-and-education-in-the-digital-age/',
          },
        ]}
        speedSeconds={20}
      />

      <footer className="border-t border-cyan-400/15 bg-[#02050b] px-4 py-10 sm:px-6 sm:py-12">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(260px,1.15fr)_minmax(320px,1fr)] md:items-start md:gap-10">
            <div className="rounded-xl border border-cyan-300/15 bg-slate-950/45 p-4 shadow-[0_0_18px_rgba(34,211,238,0.08)] sm:p-5">
              <Image
                src="/Assets/logo.png"
                alt="Onem logo"
                width={360}
                height={120}
                className="h-20 w-auto object-contain sm:h-24"
                priority={false}
              />
            </div>

            <div className="rounded-xl border border-cyan-300/15 bg-slate-950/40 p-4 sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100/80 sm:text-xs">Quick Links</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-semibold text-cyan-50/90 sm:text-base">
                <span className="cursor-default transition-colors hover:text-cyan-300">What You Get</span>
                <span className="cursor-default transition-colors hover:text-cyan-300">Our Methods</span>
                <span className="cursor-default transition-colors hover:text-cyan-300">Our Courses</span>
                <span className="cursor-default transition-colors hover:text-cyan-300">Subscribe</span>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <button type="button" aria-label="YouTube icon (link coming soon)" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/30 bg-black/35 text-cyan-200 transition-all hover:border-cyan-200/70 hover:text-cyan-100 hover:shadow-[0_0_14px_rgba(34,211,238,0.26)]">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                    <path d="M21.8 8.2a3 3 0 0 0-2.1-2.1C17.8 5.5 12 5.5 12 5.5s-5.8 0-7.7.6A3 3 0 0 0 2.2 8.2C1.6 10.1 1.6 12 1.6 12s0 1.9.6 3.8a3 3 0 0 0 2.1 2.1c1.9.6 7.7.6 7.7.6s5.8 0 7.7-.6a3 3 0 0 0 2.1-2.1c.6-1.9.6-3.8.6-3.8s0-1.9-.6-3.8ZM10.1 15.1V8.9l5.3 3.1-5.3 3.1Z" />
                  </svg>
                </button>
                <button type="button" aria-label="X icon (link coming soon)" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/30 bg-black/35 text-cyan-200 transition-all hover:border-cyan-200/70 hover:text-cyan-100 hover:shadow-[0_0_14px_rgba(34,211,238,0.26)]">
                  <span className="text-sm font-bold leading-none">X</span>
                </button>
                <button type="button" aria-label="Instagram icon (link coming soon)" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/30 bg-black/35 text-cyan-200 transition-all hover:border-cyan-200/70 hover:text-cyan-100 hover:shadow-[0_0_14px_rgba(34,211,238,0.26)]">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                    <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.8A3.95 3.95 0 0 0 3.8 7.75v8.5a3.95 3.95 0 0 0 3.95 3.95h8.5a3.95 3.95 0 0 0 3.95-3.95v-8.5a3.95 3.95 0 0 0-3.95-3.95h-8.5Zm8.95 1.35a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8A3.2 3.2 0 1 0 12 15.2 3.2 3.2 0 0 0 12 8.8Z" />
                  </svg>
                </button>
                <button type="button" aria-label="Facebook icon (link coming soon)" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/30 bg-black/35 text-cyan-200 transition-all hover:border-cyan-200/70 hover:text-cyan-100 hover:shadow-[0_0_14px_rgba(34,211,238,0.26)]">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                    <path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.6 1.7-1.6h1.5V3.8c-.7-.1-1.4-.2-2.1-.2-2.1 0-3.5 1.3-3.5 3.8V10H8.6v3h2.5v8h2.4Z" />
                  </svg>
                </button>
                <button type="button" aria-label="TikTok icon (link coming soon)" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/30 bg-black/35 text-cyan-200 transition-all hover:border-cyan-200/70 hover:text-cyan-100 hover:shadow-[0_0_14px_rgba(34,211,238,0.26)]">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                    <path d="M14.2 3.4v10a3.8 3.8 0 1 1-2.5-3.6V3.4h2.5Zm3.9 2.3a5 5 0 0 0 2.3 1.3v2.5a7.4 7.4 0 0 1-2.3-.8v5.6a6.1 6.1 0 1 1-6.1-6.1c.2 0 .5 0 .7.1v2.6a3.5 3.5 0 1 0 2.9 3.4V3.4h2.5v2.3Z" />
                  </svg>
                </button>
              </div>

              <div className="mt-5 inline-flex items-center rounded-lg border border-cyan-300/20 bg-black/30 px-3 py-2">
                <span className="text-[11px] font-semibold tracking-[0.08em] text-cyan-100/75 sm:text-xs">
                  Company No - 15438754
                </span>
              </div>
            </div>
          </div>

          <p className="border-t border-cyan-300/15 pt-5 text-center text-[10px] tracking-[0.13em] text-cyan-100/65 sm:text-xs">
            All content is made for educational purposes and is up to the individual to apply the knowledge. We do not guarantee any results.
          </p>
        </div>
      </footer>
    </div>
  )
}
