import FlyingPosters from '@/components/ui/FlyingPosters'
import CertificatesSection from '@/sections/CertificatesSection'

export default function ModulesShowcasePage() {
  return (
    <main className="bg-black px-3 pb-16 pt-24 sm:px-6 md:px-8">
      <section className="mx-auto mb-12 w-full max-w-6xl">
        <h1 className="mb-3 text-3xl text-[color:var(--gold)] sm:text-4xl">UI Modules Showcase</h1>
        <p className="mb-6 text-slate-300">Flying Posters and Certificates section cloned as standalone modules.</p>
        <FlyingPosters
          items={['/images/IMG_1.png', '/images/IMG_3-2.png', '/images/13.png', '/images/Video%203%20Revised-Cover.jpg']}
          planeWidth={320}
          planeHeight={320}
          distortion={3}
          scrollEase={0.01}
          cameraFov={45}
          cameraZ={20}
          orbitSpeed={0.12}
        />
      </section>

      <section className="mx-auto w-full max-w-7xl">
        <CertificatesSection />
      </section>
    </main>
  )
}
