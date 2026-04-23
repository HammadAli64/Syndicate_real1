import Image from 'next/image'
import Link from 'next/link'
import { PricingPage } from '@/components/AnimatedPricingPage'
import CertificatesSection from '@/components/CertificatesSection'
import DomeGallery from '@/components/DomeGallery'
import FAQSection from '@/components/FAQSection'
import FeaturedLogosStrip from '@/components/FeaturedLogosStrip'
import LetterGlitch from '@/components/LetterGlitch'
import NeonTypingBadge from '@/components/NeonTypingBadge'
import SiteFooter from '@/components/SiteFooter'
import SyndicateReachSection from '@/components/SyndicateReachSection'

const FEATURED_LOGOS = [
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
]

const METHODS = [
  {
    title: 'Signal-Based Training',
    description:
      'Learn from real operating principles: weekly execution loops, operator scorecards, and decisions that compound over time.',
  },
  {
    title: 'Systems Over Motivation',
    description:
      'Replace random effort with repeatable systems for outreach, delivery, and cash flow so momentum does not rely on mood.',
  },
  {
    title: 'Network Accountability',
    description:
      'Use cohort pressure and peer review to maintain standards, cut procrastination, and keep your actions aligned with outcomes.',
  },
]

const PROGRAM_IMAGE_BASE = '/Assets/programs/cources%20imnages'
const courseImage = (fileName: string) => `${PROGRAM_IMAGE_BASE}/${encodeURIComponent(fileName)}`

const FEATURED_PROGRAM_IMAGES = [
  { src: courseImage('make_best_thumbnails_or_cover_image_of_program_wordpress_blog_dystopian_futuristc_cyber_vibes__56y25d9msuef6h5mvdp7_0.png'), alt: 'WordPress Blog' },
  { src: courseImage('make_best_thumbnails_or_cover_image_of_program_framer_crash_course__dystopian_futuristic_cyber__sv3m15ue62yv42axqzjz_3.png'), alt: 'Framer Crash Course' },
  { src: courseImage('make_best_thumbnails_or_cover_image_of_program_faceless_youtube_ai_content_creator_course_dystopian_6ilaa9szo8ti113v76xv_0.png'), alt: 'Faceless YouTube AI Creator' },
  { src: courseImage('make_best_thumbnails_or_cover_image_of_program_ai_automations_dystopian_futuristic_cyber__jo1dnkoktqk1eiv9foxm_2.png'), alt: 'AI Automations' },
  { src: courseImage('make_best_thumbnails_or_cover_image_of_program_crypto_trading_with_technical_analysis_course__dysto_jne4vbob12582s4qybop_2.png'), alt: 'Crypto Trading TA' },
  { src: courseImage('make_best_thumbnails_or_cover_image_of_program_print_on_demand_clothing___zxxqlpgl77cee8pe59ru_2.png'), alt: 'Print on Demand Clothing' },
  { src: courseImage('make_best_thumbnails_or_cover_image_of_program_python_programming__dystopian_cyber__pds64wpqtzleuu2ucwkp_0.png'), alt: 'Python Programming' },
  { src: courseImage('new-project (12).png'), alt: 'Building Apps using React JS' },
]

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
        <div className="absolute bottom-4 left-1/2 z-20 w-[min(94vw,1180px)] -translate-x-1/2 sm:bottom-6">
          <FeaturedLogosStrip logos={FEATURED_LOGOS} speedSeconds={16} compact />
        </div>
        <div className="relative z-10 h-screen w-screen" />
      </section>
      <section className="relative flex h-screen min-h-screen w-screen items-center overflow-hidden bg-[#050508] px-0 py-0">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <iframe
            src="https://player.vimeo.com/video/988922121?autoplay=1&muted=1&loop=1&background=1"
            className="h-full w-full scale-[1.22] opacity-60 grayscale saturate-0"
            allow="autoplay; fullscreen; picture-in-picture"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            title="Featured programs background video"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-black/72" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)' }} />

        <div className="relative z-10 h-full w-full px-0">
          <h2 className="mb-10 text-center text-2xl font-black uppercase sm:mb-12 sm:text-3xl md:text-4xl lg:text-5xl">
            <span className="bg-gradient-to-r from-amber-200 via-amber-300 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(251,191,36,0.35)]">
              Featured PROGRAMS
            </span>
          </h2>
          <div className="h-[calc(100vh-9rem)] min-h-[520px] w-full overflow-hidden rounded-none bg-black/30">
            <DomeGallery
              images={FEATURED_PROGRAM_IMAGES}
              fit={0.5}
              minRadius={300}
              segments={18}
              dragDampening={4.8}
              grayscale={false}
              autoRotateSpeedDeg={1.8}
              tileInsetPx={24}
            />
          </div>
        </div>
      </section>
      <CertificatesSection />
      <PricingPage />
      <FAQSection />
      <SyndicateReachSection />

      <section className="border-b border-fuchsia-300/20 bg-gradient-to-b from-[#0a0514] to-[#02050b] px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xs uppercase tracking-[0.24em] text-fuchsia-200/80">Our Methods</p>
          <h2 className="mt-3 text-3xl font-bold text-fuchsia-50 sm:text-4xl md:text-5xl">How we build disciplined operators</h2>
          <p className="mx-auto mt-4 max-w-3xl text-sm text-fuchsia-100/75 sm:text-base">
            Every method below is designed to move you from information overload to clear execution and measurable performance.
          </p>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {METHODS.map((method) => (
            <article
              key={method.title}
              className="rounded-xl border border-fuchsia-300/20 bg-fuchsia-950/10 p-6 shadow-[0_0_24px_rgba(217,70,239,0.12)]"
            >
              <h2 className="text-lg font-semibold text-fuchsia-100">{method.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-fuchsia-100/75">{method.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="mx-auto max-w-5xl rounded-2xl border border-fuchsia-300/20 bg-gradient-to-r from-fuchsia-900/20 via-black to-cyan-900/20 p-6 text-center sm:p-8">
          <h3 className="text-2xl font-semibold text-fuchsia-50">Execution beats theory</h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-fuchsia-100/75 sm:text-base">
            We teach methods that fit real-world constraints and reward consistency. You leave with playbooks, not just inspiration.
          </p>
        </div>
      </section>

      <section
        id="joinNowSection"
        className="relative overflow-hidden border-y border-amber-300/20 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.2),rgba(2,6,23,0.95))] px-4 py-16 sm:px-6 sm:py-20"
      >
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs uppercase tracking-[0.24em] text-amber-200/80">Join Now</p>
          <h2 className="mt-3 text-3xl font-bold text-amber-100 sm:text-4xl md:text-5xl">
            Start your journey with Syndicate
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-amber-50/80 sm:text-base">
            Pick the right path for your current level and build real systems for money, power, and freedom.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/programs"
              className="rounded-md border border-amber-300/60 bg-amber-300/10 px-5 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/20"
            >
              Explore Programs
            </Link>
            <Link
              href="/what-you-get"
              className="rounded-md border border-cyan-300/50 bg-cyan-300/10 px-5 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/20"
            >
              See Benefits
            </Link>
          </div>
        </div>
      </section>

      <FeaturedLogosStrip logos={FEATURED_LOGOS} speedSeconds={20} />
      <SiteFooter />
    </div>
  )
}
