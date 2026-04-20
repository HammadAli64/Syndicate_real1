import CircularGallery from '@/components/CircularGallery'
import SyndicateFlowSection from '@/components/HomePageComponents/sections/SyndicateFlowSection'
import { HeroIntro } from '@/components/HeroIntro'
import { HeroPillars } from '@/components/HeroPillars'
import CertificatesSection from '@/sections/CertificatesSection'
import TestimonialsSection from '@/sections/TestimonialsSection'
import { HomeSections } from '@/components/HomeSections'

export default function Home() {
  return (
    <>
      <section id="heroSection" className="relative min-h-[calc(100dvh-8rem)] w-full bg-transparent px-3 pb-8 pt-2 sm:px-6 md:px-8">
        <div className="flex min-h-[calc(100dvh-9rem)] items-center">
          <div className="grid w-full items-center gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)] lg:gap-8">
            <HeroIntro />
            <div className="w-full lg:justify-self-end">
              <HeroPillars />
            </div>
          </div>
        </div>
      </section>
      <HomeSections />
      <SyndicateFlowSection />
      <TestimonialsSection />
      <CertificatesSection />
      <section className="bg-transparent px-3 pb-24 sm:px-6 md:px-8">
        <div className="relative h-[600px] overflow-hidden rounded-2xl bg-black/30">
          <CircularGallery
            bend={1}
            textColor="#ffffff"
            borderRadius={0.05}
            scrollSpeed={2}
            scrollEase={0.05}
          />
        </div>
      </section>
    </>
  )
}
