import Link from 'next/link'
import { NavApp } from '@/components/NavApp'
import GlobalBottomSections from '@/components/GlobalBottomSections'

const VALUE_PILLARS = [
  {
    title: 'Practical Training Systems',
    description:
      'Structured modules focused on execution, positioning, and leverage so every lesson translates into action.',
  },
  {
    title: 'Elite Operator Frameworks',
    description:
      'Battle-tested decision tools that help you prioritize high-value moves and avoid wasted effort.',
  },
  {
    title: 'Ethical Power Blueprint',
    description:
      'Methods to build wealth and influence with integrity, discipline, and long-term control.',
  },
  {
    title: 'Strategic Growth Environment',
    description:
      'A focused ecosystem designed to keep your standards high, your momentum stable, and your outcomes measurable.',
  },
]

const DELIVERY_FLOW = [
  {
    step: '01',
    title: 'Access & Orientation',
    description:
      'Get immediate platform access and a clear operating map so you know exactly where to begin.',
  },
  {
    step: '02',
    title: 'Implementation Phases',
    description:
      'Move through practical phases built to turn insight into execution from day one.',
  },
  {
    step: '03',
    title: 'Performance Refinement',
    description:
      'Optimize your systems with repeatable workflows, strategic feedback loops, and real-world adaptation.',
  },
]

const INCLUDED_RESOURCES = [
  'Execution-focused training videos and implementation frameworks',
  'Step-by-step playbooks for building money and influence systems',
  'Advanced mindset and business psychology modules',
  'Performance structure to improve consistency and decision quality',
  'Long-term mastery principles rooted in ethics and responsibility',
  'A clear path from foundational discipline to strategic dominance',
]

const NETWORK_ALLIANCE_PARAGRAPHS = [
  'The path to success is not meant to be walked alone.',
  'Joining a powerful alliance, an elite organisation of like-minded individuals, becomes not just a choice but a necessity for those who seek to transcend the difficult struggles for power and possession. Within the sanctity of this alliance, you not only find refuge but a crucible for growth, where your strengths are honed and your weaknesses fortified by the collective wisdom of those who share your values and desires.',
  'This is not merely a network, it is an alliance forged on a sacred moral code. Its members abide by principles of integrity, mutual respect, and unwavering honour, creating an environment where strength is sharpened and weaknesses are transformed into fortitude.',
  "The Syndicate; it's where money and power meet mastery. Join The Syndicate today! Make the commitment now!",
]

const MONEY_POWER_MASTERY_PARAGRAPHS = [
  'The Syndicate philosophy teaches that money and power go hand in hand. They are like two sides of the same coin. Money and power, if not correctly wielded, has the potential to completely corrupt you, leading you down a dark path of corrupt, degenerate and hedonistic behaviour.',
  "The Syndicate's mission goes beyond attaining money, power and influence. Its elite training programmes aim to redefine how individuals perceive power and influence, emphasising the importance of moral strength and societal impact. Members are taught to master money and power systems without succumbing to their enslavement or morally corrupting properties.",
  'This is the definition of true success and greatness. This is the true meaning of money, power and life mastery.',
]

export default function WhatYouGetPage() {
  return (
    <div className="min-h-[100dvh] bg-black">
      <NavApp />
      <section className="relative h-[100dvh] min-h-[100dvh] w-full overflow-hidden border-b border-cyan-300/20 px-4 pb-14 pt-[96px] sm:px-6 sm:pb-16 sm:pt-[110px]">
        <div className="pointer-events-none absolute inset-0">
          <video autoPlay muted loop playsInline preload="metadata" className="h-[100dvh] w-full object-cover opacity-100">
            <source src="/assets/video.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/84 to-[#02050b]/92" />
        </div>
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <h1 className="mt-3 text-3xl font-bold text-cyan-50 sm:text-4xl md:text-5xl">Access to a powerful network and alliance.</h1>
          <p className="mx-auto mt-4 max-w-3xl text-sm text-cyan-100/75 sm:text-base">
            You unlock a complete execution ecosystem: strategy, implementation systems, and structured growth frameworks designed for real-world outcomes.
          </p>
        </div>
      </section>

      <section className="relative px-4 py-12 sm:px-6 sm:py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(34,211,238,0.12),transparent_35%),radial-gradient(circle_at_82%_84%,rgba(251,191,36,0.1),transparent_34%)]" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="mb-6">
            <h2 className="mt-2 text-2xl font-semibold text-cyan-100 sm:text-3xl">Built for operators who want structure, not noise</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {VALUE_PILLARS.map((pillar, index) => (
              <article
                key={pillar.title}
                className={`methods-fade-up group relative overflow-hidden rounded-2xl border p-5 shadow-[0_0_20px_rgba(34,211,238,0.1)] transition duration-300 hover:-translate-y-1 ${
                  index % 2 === 0
                    ? 'border-cyan-300/35 bg-gradient-to-b from-cyan-950/25 via-[#040b14] to-black hover:shadow-[0_0_28px_rgba(34,211,238,0.2)]'
                    : 'border-fuchsia-300/30 bg-gradient-to-b from-fuchsia-950/20 via-[#140613] to-black hover:shadow-[0_0_28px_rgba(217,70,239,0.2)]'
                }`}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent opacity-70 group-hover:opacity-100" />
                <h3 className="text-lg font-semibold text-cyan-100">{pillar.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-200/85">{pillar.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 rounded-2xl border border-amber-300/30 bg-gradient-to-r from-[#0a1014] via-black to-[#130d05] p-6 shadow-[0_0_32px_rgba(251,191,36,0.1)] sm:p-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h2 className="mt-2 text-2xl font-semibold text-amber-100 sm:text-3xl">A complete system for money, power, and life mastery</h2>
            <ul className="mt-6 space-y-3 text-sm text-zinc-200/88 sm:text-base">
              {INCLUDED_RESOURCES.map((item, index) => (
                <li
                  key={item}
                  className={`rounded-lg border px-4 py-3 transition ${
                    index % 2 === 0
                      ? 'border-amber-300/25 bg-black/35 hover:border-amber-200/40'
                      : 'border-cyan-300/25 bg-[#031016]/45 hover:border-cyan-200/40'
                  }`}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">Delivery Process</p>
            {DELIVERY_FLOW.map((item, index) => (
              <article
                key={item.step}
                className={`methods-fade-up rounded-xl border p-4 transition hover:-translate-y-0.5 ${
                  index === 1
                    ? 'border-amber-300/35 bg-[#130e05]/45 shadow-[0_0_18px_rgba(251,191,36,0.14)]'
                    : 'border-cyan-300/30 bg-black/45 shadow-[0_0_18px_rgba(34,211,238,0.12)]'
                }`}
              >
                <p className="text-xs font-semibold tracking-[0.2em] text-cyan-200/80">{item.step}</p>
                <h3 className="mt-1 text-base font-semibold text-cyan-100">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-200/85">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.08fr_0.92fr]">
          <article className="relative overflow-hidden rounded-2xl border border-amber-300/30 bg-gradient-to-b from-[#151005]/45 to-black p-6 shadow-[0_0_24px_rgba(251,191,36,0.14)] sm:p-8">
            <div className="pointer-events-none absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-amber-200/80 via-amber-300/40 to-transparent" />
            <p className="text-xs uppercase tracking-[0.24em] text-amber-200/80">Access to a Powerful Network and Alliance</p>
            <h2 className="mt-2 text-2xl font-semibold text-amber-100 sm:text-3xl">The path to success is not meant to be walked alone</h2>
            <div className="mt-5 space-y-4 text-sm leading-relaxed text-zinc-200/88 sm:text-base">
              {NETWORK_ALLIANCE_PARAGRAPHS.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>

          <article className="relative overflow-hidden rounded-2xl border border-cyan-300/30 bg-gradient-to-b from-cyan-950/25 to-black p-6 shadow-[0_0_24px_rgba(34,211,238,0.14)] sm:p-8">
            <div className="pointer-events-none absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-cyan-200/80 via-cyan-300/40 to-transparent" />
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">Money and Power Mastery</p>
            <h2 className="mt-2 text-2xl font-semibold text-cyan-100 sm:text-3xl">Master the tools without becoming enslaved by them</h2>
            <div className="mt-5 space-y-4 text-sm leading-relaxed text-zinc-200/88 sm:text-base">
              {MONEY_POWER_MASTERY_PARAGRAPHS.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="border-y border-amber-300/30 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.14),rgba(2,6,23,0.95))] px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.08fr_0.92fr]">
          <div>
            <h2 className="mt-3 text-2xl font-bold text-amber-100 sm:text-4xl">You leave with clarity, discipline, and executable systems</h2>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-200/85 sm:text-base">
              This is not generic education. Every module is engineered to produce practical leverage in your business, finances, and personal leadership.
              You are trained to think strategically, execute precisely, and scale responsibly.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-300/30 bg-gradient-to-b from-[#1a1306]/45 to-black/70 p-5 shadow-[0_0_20px_rgba(251,191,36,0.12)]">
            <p className="text-sm uppercase tracking-[0.16em] text-amber-200/80">Best next actions</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/programs" className="cta-nav-button text-xs font-semibold">
                Explore Programs
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-cyan-300/65 bg-cyan-300/10 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.2)] transition hover:bg-cyan-300/20"
              >
                Join Now
              </Link>
            </div>
          </div>
        </div>
      </section>
      <GlobalBottomSections />

    </div>
  )
}

