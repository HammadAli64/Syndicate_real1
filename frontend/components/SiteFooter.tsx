import Image from 'next/image'
import Link from 'next/link'

export default function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-amber-300/30 bg-[#02050b] px-4 py-10 sm:px-6 sm:py-12">
      <div className="pointer-events-none absolute inset-0">
        <video autoPlay muted loop playsInline preload="metadata" className="h-full w-full object-cover opacity-60">
          <source src="/Assets/v.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/62" />
      </div>
      <div className="relative z-10 mx-auto flex max-w-[1200px] flex-col gap-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(260px,1.15fr)_minmax(320px,1fr)] md:items-start md:gap-10">
          <div className="rounded-xl p-4 shadow-[0_0_16px_rgba(251,191,36,0.18)] sm:p-5">
            <Image
              src="/Assets/logo.png"
              alt="Onem logo"
              width={360}
              height={120}
              className="h-20 w-auto object-contain sm:h-24"
              priority={false}
            />
          </div>

          <div className="rounded-xl p-4 sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200/90 sm:text-xs">Quick Links</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-semibold text-amber-100 sm:text-base">
              <Link href="/" className="transition-colors hover:text-amber-200">Home</Link>
              <Link href="/what-you-get" className="transition-colors hover:text-amber-200">What You Get</Link>
              <Link href="/our-methods" className="transition-colors hover:text-amber-200">Our Methods</Link>
              <Link href="/programs" className="transition-colors hover:text-amber-200">Programs</Link>
            </div>
          </div>
        </div>

        <p className="border-t border-amber-300/25 pt-5 text-center text-[10px] tracking-[0.13em] text-amber-100/80 sm:text-xs">
          All content is made for educational purposes and is up to the individual to apply the knowledge. We do not guarantee any results.
        </p>
      </div>
    </footer>
  )
}
