import Image from 'next/image'
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

const CYBER_PANEL_STYLES = [
  'from-cyan-400 via-blue-500 to-fuchsia-500',
  'from-fuchsia-400 via-pink-500 to-violet-500',
  'from-emerald-400 via-cyan-400 to-blue-500',
  'from-amber-300 via-orange-400 to-rose-500',
  'from-violet-400 via-indigo-500 to-cyan-400',
  'from-lime-300 via-emerald-400 to-cyan-400',
]

export default function WhatYouGetPage() {
  return (
    <div className="min-h-[100dvh] bg-black">
      <NavApp />
      <section className="relative flex h-[100dvh] min-h-[100dvh] w-full items-center overflow-hidden px-4 pb-14 pt-[96px] sm:px-6 sm:pb-16 sm:pt-[110px]">
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

      <section className="relative flex h-[100dvh] min-h-[100dvh] w-full items-center overflow-hidden px-4 py-10 sm:px-6 sm:py-12">
        <div className="pointer-events-none absolute inset-0">
          <Image
            src="/assets/g.gif"
            alt=""
            aria-hidden
            fill
            unoptimized
            sizes="100vw"
            className="object-cover opacity-34"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_20%,rgba(251,191,36,0.15),transparent_35%),radial-gradient(circle_at_86%_82%,rgba(34,211,238,0.12),transparent_35%)]" />
          <div className="absolute inset-0 bg-black/54" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-[min(1860px,99vw)]">
          <div className="mb-5">
            <h2 className="mt-2 text-5xl font-black text-amber-100 drop-shadow-[0_0_22px_rgba(251,191,36,0.42)] sm:text-6xl lg:text-7xl">
              Built for operators who want structure, not noise
            </h2>
            <p className="mt-3 max-w-5xl text-lg leading-relaxed text-zinc-200/90 sm:text-xl">
              A complete system for money, power, and life mastery designed to create clarity, execution, and long-term momentum.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.18fr_0.82fr]">
            <div className="grid auto-rows-fr gap-4 md:grid-cols-2 lg:gap-5">
            {VALUE_PILLARS.map((pillar, index) => (
              <div
                key={pillar.title}
                className={`cyber-chip-animate methods-fade-up group relative bg-gradient-to-r p-[1px] [clip-path:polygon(12px_0,calc(100%-12px)_0,100%_12px,100%_calc(100%-12px),calc(100%-12px)_100%,12px_100%,0_calc(100%-12px),0_12px)] transition duration-500 hover:-translate-y-2 hover:scale-[1.02] ${CYBER_PANEL_STYLES[index % CYBER_PANEL_STYLES.length]}`}
                style={{ animationDelay: `${index * 0.16}s` }}
              >
                <span className="pointer-events-none absolute inset-[-1px] bg-inherit opacity-70 blur-[12px]" />
                <article className="relative min-h-[clamp(250px,31vh,340px)] overflow-hidden bg-gradient-to-b from-[#120d1d]/82 via-[#080b12]/90 to-[#04060b]/94 p-6 [clip-path:polygon(12px_0,calc(100%-12px)_0,100%_12px,100%_calc(100%-12px),calc(100%-12px)_100%,12px_100%,0_calc(100%-12px),0_12px)] sm:p-7">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent opacity-80 group-hover:opacity-100" />
                  <h3 className="text-2xl font-semibold text-amber-100 sm:text-3xl">{pillar.title}</h3>
                  <p className="mt-3 text-lg leading-relaxed text-zinc-200/88">{pillar.description}</p>
                </article>
              </div>
            ))}
            </div>
            <div className="cyber-chip-animate group relative bg-gradient-to-r from-violet-400 via-indigo-500 to-cyan-400 p-[1px] [clip-path:polygon(12px_0,calc(100%-12px)_0,100%_12px,100%_calc(100%-12px),calc(100%-12px)_100%,12px_100%,0_calc(100%-12px),0_12px)]">
              <span className="pointer-events-none absolute inset-[-1px] bg-inherit opacity-70 blur-[12px]" />
              <div className="relative bg-gradient-to-b from-[#0f1021]/86 via-[#090b16]/92 to-[#04060b]/96 p-6 [clip-path:polygon(12px_0,calc(100%-12px)_0,100%_12px,100%_calc(100%-12px),calc(100%-12px)_100%,12px_100%,0_calc(100%-12px),0_12px)] sm:p-7">
                <p className="text-base uppercase tracking-[0.24em] text-amber-200/85">Delivery Process</p>
                <div className="mt-4 space-y-3">
                  {DELIVERY_FLOW.map((item, index) => (
                    <div
                      key={item.step}
                      className={`cyber-chip-animate methods-fade-up relative bg-gradient-to-r p-[1px] [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)] transition duration-300 hover:-translate-y-1 hover:scale-[1.01] ${CYBER_PANEL_STYLES[(index + 2) % CYBER_PANEL_STYLES.length]}`}
                      style={{ animationDelay: `${index * 0.2}s` }}
                    >
                      <span className="pointer-events-none absolute inset-[-1px] bg-inherit opacity-60 blur-[10px]" />
                      <article className="relative bg-[#060a12]/92 p-5 [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)]">
                        <p className="text-base font-semibold tracking-[0.2em] text-amber-200/85">{item.step}</p>
                        <h3 className="mt-1 text-xl font-semibold text-amber-100 sm:text-2xl">{item.title}</h3>
                        <p className="mt-2 text-base leading-relaxed text-zinc-200/90 sm:text-lg">{item.description}</p>
                      </article>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative flex h-[100dvh] min-h-[100dvh] w-full items-center overflow-hidden px-4 py-12 sm:px-6 sm:py-14">
        <div className="pointer-events-none absolute inset-0">
          <Image
            src="/assets/tt.gif"
            alt=""
            aria-hidden
            fill
            unoptimized
            sizes="100vw"
            className="object-cover opacity-34"
          />
          <div className="absolute inset-0 bg-black/56" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-[min(1860px,99vw)]">
          <div className="cyber-chip-animate group relative bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 p-[1px] [clip-path:polygon(14px_0,calc(100%-14px)_0,100%_14px,100%_calc(100%-14px),calc(100%-14px)_100%,14px_100%,0_calc(100%-14px),0_14px)]">
            <span className="pointer-events-none absolute inset-[-1px] bg-inherit opacity-75 blur-[14px]" />
            <article className="relative min-h-[clamp(500px,68vh,780px)] overflow-hidden bg-gradient-to-b from-[#151005]/42 to-black/74 p-8 [clip-path:polygon(14px_0,calc(100%-14px)_0,100%_14px,100%_calc(100%-14px),calc(100%-14px)_100%,14px_100%,0_calc(100%-14px),0_14px)] sm:p-12">
            <p className="text-base uppercase tracking-[0.24em] text-amber-200/85">Access to a Powerful Network and Alliance</p>
            <h2 className="mt-3 text-4xl font-bold text-amber-100 sm:text-5xl lg:text-6xl">The path to success is not meant to be walked alone</h2>
            <div className="mt-6 space-y-5 text-lg leading-relaxed text-zinc-200/90 sm:text-xl">
              <p>
                Joining a powerful alliance of disciplined operators is not optional for those who want sustained power and meaningful growth.
              </p>
              <p>
                The Syndicate culture is built on integrity, standards, and strategic accountability so strengths are sharpened and weaknesses are transformed.
              </p>
            </div>
            </article>
          </div>
        </div>
      </section>

      <GlobalBottomSections />

    </div>
  )
}

