import Link from 'next/link'
import { RevealOnScroll } from '@/components/RevealOnScroll'

export function OurMethodsSection() {
  return (
    <section id="ourMethodsSection" className="bg-black px-3 pb-24 pt-6 sm:px-6 md:px-8">
      <div className="mx-auto w-full max-w-none">
        <RevealOnScroll>
          <article className="min-h-[calc(100dvh-10rem)] rounded-2xl bg-black/95 px-6 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.75)]">
            <p className="text-sm uppercase tracking-[0.25em] text-[color:var(--gold-muted)]">OUR METHODS</p>
            <h2 className="text-xxl mt-3 text-[color:var(--gold-light)]">BREAK FREE FROM THE SYSTEM</h2>
            <div className="mx-auto mt-6 h-40 max-w-2xl rounded-xl bg-black sm:h-52" />
            <div className="mx-auto mt-6 max-w-none space-y-5 text-lg leading-8 text-slate-100">
              <p>
                The Syndicate stands as an elite and exclusive organisation of individuals committed to achieving the zenith
                of power, wealth, and mastery. This private network is for those who yearn for true greatness and the ability
                to shape their destiny.
              </p>
              <p>
                At its core, The Syndicate is about breaking free from the shackles of the capitalist system that often leaves
                individuals as mere cogs in a vast economic and political machine. This is not a get rich quick scheme.
              </p>
              <p>
                This is not for the faint hearted. It is an elite organisation of individuals dedicated to attaining mastery
                over themselves and the capitalist system.
              </p>
              <p>True power lies in unity, integrity, and strategic alliances.</p>
            </div>
            <Link
              href="/login"
              className="cta-nav-button mt-8 text-sm"
            >
              JOIN NOW
            </Link>
          </article>
        </RevealOnScroll>
      </div>
    </section>
  )
}
