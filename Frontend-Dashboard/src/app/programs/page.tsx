import { NavApp } from '@/components/NavApp'
import GlobalBottomSections from '@/components/GlobalBottomSections'

export default function ProgramsPage() {
  return (
    <div className="min-h-[100dvh] w-full min-w-0 overflow-x-clip bg-black pt-[69px]">
      <NavApp />
      <section className="relative flex h-[100dvh] min-h-[100dvh] w-full min-w-0 items-center overflow-hidden border-b border-pink-300/20 px-[clamp(1rem,3.2vw,1.5rem)] py-[clamp(2.5rem,5vw,5rem)] sm:px-6 sm:py-20">
        <div className="pointer-events-none absolute inset-0">
          <iframe
            src="https://player.vimeo.com/video/988922121?muted=1&autoplay=1&loop=1&background=1&app_id=122963"
            className="h-[100dvh] w-full scale-[1.15]"
            allow="autoplay; fullscreen; picture-in-picture"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            title="Programs background video"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#150412]/78 to-[#02050b]/90" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-[1400px] text-center">
          <p className="text-xs uppercase tracking-[0.24em] text-pink-200/80">Programs</p>
          <h1 className="mt-3 text-3xl font-bold text-pink-50 sm:text-4xl md:text-5xl">Pick your current growth path</h1>
          <p className="mx-auto mt-4 max-w-3xl text-sm text-pink-100/75 sm:text-base">
            Choose a focused training track based on your current bottleneck and expand into advanced systems over time.
          </p>
        </div>
      </section>
      <GlobalBottomSections />
    </div>
  )
}
