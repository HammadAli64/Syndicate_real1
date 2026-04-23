import CertificatesSection from '@/components/CertificatesSection'
import FeaturedLogosStrip from '@/components/FeaturedLogosStrip'
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

export default function WhatYouGetPage() {
  return (
    <div className="min-h-screen bg-black pt-[69px]">
      <section className="relative overflow-hidden border-b border-cyan-300/20 px-4 py-14 sm:px-6 sm:py-16">
        <div className="pointer-events-none absolute inset-0">
          <iframe
            src="https://player.vimeo.com/video/988922121?autoplay=1&muted=1&loop=1&background=1"
            className="h-full w-full scale-[1.18]"
            allow="autoplay; fullscreen; picture-in-picture"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            title="What You Get background video"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/80 to-[#02050b]/90" />
        </div>
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">What You Get</p>
          <h1 className="mt-3 text-3xl font-bold text-cyan-50 sm:text-4xl md:text-5xl">Tools, credentials, and global network access</h1>
          <p className="mx-auto mt-4 max-w-3xl text-sm text-cyan-100/75 sm:text-base">
            This page includes the outcomes you unlock after joining: recognized certifications, strategic partnerships, and credibility signals.
          </p>
        </div>
      </section>
      <CertificatesSection />
      <SyndicateReachSection />
      <FeaturedLogosStrip logos={FEATURED_LOGOS} speedSeconds={20} />
      <SiteFooter />
    </div>
  )
}
