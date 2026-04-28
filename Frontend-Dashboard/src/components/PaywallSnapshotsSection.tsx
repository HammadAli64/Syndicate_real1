'use client'

import Image from 'next/image'
import Link from 'next/link'
import { syndicateOtpLoginHref } from '@/lib/syndicate-otp-paths'

type SnapshotItem = {
  src: string
  title: string
  description: string
}

const SNAPSHOTS: SnapshotItem[] = [
  {
    src: '/assets/paywall/programs-snapshot.png',
    title: 'PROGRAM EXECUTION HUB',
    description:
      'Access structured programs, actionable lessons, and progress systems from a personalized dashboard.',
  },
  {
    src: '/assets/paywall/syndicate-mode-snapshot.png',
    title: 'SYNDICATE MODE DASHBOARD',
    description:
      'Use curated pathways to pick skills that align with your style, goals, and execution level.',
  },
  {
    src: '/assets/paywall/dashboard-snapshot.png',
    title: 'MEMBER WORKSPACE OVERVIEW',
    description:
      'Stay ahead with trend-driven modules that help you identify opportunities before they saturate.',
  },
  {
    src: '/assets/paywall/methods-reference.png',
    title: 'LIVE CONTENT UPDATES',
    description:
      'Content, resources, and frameworks evolve continuously so your private workspace keeps compounding.',
  },
]

const CYBER_FRAME_STYLES = [
  'from-cyan-400 via-blue-500 to-fuchsia-500',
  'from-amber-300 via-orange-400 to-rose-500',
  'from-violet-400 via-indigo-500 to-cyan-400',
  'from-lime-300 via-emerald-400 to-cyan-400',
]

export default function PaywallSnapshotsSection() {
  return (
    <section className="relative min-h-[100dvh] w-full min-w-0 overflow-hidden bg-black">
      <div className="pointer-events-none absolute inset-0">
        <div className="relative h-full w-full">
          <Image
            src="/assets/cb.gif"
            alt=""
            aria-hidden
            fill
            sizes="100vw"
            className="object-cover opacity-30"
            unoptimized
          />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-black/60" />

      <div className="relative z-10 mx-auto w-full max-w-[1380px] px-4 py-14 sm:px-6 md:px-8 md:py-16">
        <div className="mx-auto mb-10 max-w-5xl text-center">
          <h2 className="text-4xl font-black uppercase tracking-[0.03em] text-white sm:text-5xl md:text-6xl">
            WHAT YOU CAN ACCESS
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {SNAPSHOTS.map((snapshot, index) => (
            <div
              key={snapshot.title}
              className={`group relative overflow-hidden bg-gradient-to-r p-[1px] shadow-[0_0_0_1px_rgba(255,255,255,0.22),0_0_30px_rgba(34,211,238,0.2),0_0_65px_rgba(217,70,239,0.16)] transition-transform duration-300 hover:scale-[1.01] [clip-path:polygon(14px_0,calc(100%-14px)_0,100%_14px,100%_calc(100%-14px),calc(100%-14px)_100%,14px_100%,0_calc(100%-14px),0_14px)] ${CYBER_FRAME_STYLES[index % CYBER_FRAME_STYLES.length]}`}
            >
              <span className="pointer-events-none absolute inset-[-1px] bg-inherit opacity-75 blur-[12px]" />
              <article className="relative overflow-hidden border border-white/20 bg-[#090b12]/86 [clip-path:polygon(14px_0,calc(100%-14px)_0,100%_14px,100%_calc(100%-14px),calc(100%-14px)_100%,14px_100%,0_calc(100%-14px),0_14px)]">
                <div className="relative p-5 sm:p-6">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,rgba(34,211,238,0.1),transparent_42%),radial-gradient(circle_at_84%_86%,rgba(217,70,239,0.08),transparent_48%)]" />
                  <h3 className="relative text-xl font-black uppercase leading-tight text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.35)] sm:text-2xl">
                    {snapshot.title}
                  </h3>
                  <p className="relative mt-2 text-base leading-relaxed text-slate-100 sm:text-[1.08rem]">
                    {snapshot.description}
                  </p>
                </div>
                <div className="px-5 pb-5 sm:px-6 sm:pb-6">
                  <div className="relative h-[220px] overflow-hidden border border-white/25 bg-black/75 shadow-[0_0_16px_rgba(34,211,238,0.18)] [clip-path:polygon(12px_0,calc(100%-12px)_0,100%_12px,100%_calc(100%-12px),calc(100%-12px)_100%,12px_100%,0_calc(100%-12px),0_12px)] sm:h-[260px] md:h-[280px]">
                    <Image
                      src={snapshot.src}
                      alt={snapshot.title}
                      fill
                      sizes="(max-width: 767px) 92vw, (max-width: 1200px) 46vw, 42vw"
                      className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/38 via-transparent to-transparent" />
                  </div>
                </div>
              </article>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-10 max-w-6xl text-center sm:mt-12">
          <h3 className="mx-auto max-w-[34ch] text-3xl font-black uppercase leading-[1.16] tracking-[0.05em] text-amber-100 drop-shadow-[0_0_16px_rgba(251,191,36,0.42)] sm:text-4xl md:text-5xl">
            <span className="mt-2 block">
              IF YOU WANT
              <span className="hamburger-attract mx-2 inline-block text-amber-200 drop-shadow-[0_0_28px_rgba(251,191,36,0.95)]">SUCCESS</span>
              JOIN
              <span className="hamburger-attract mx-2 inline-block text-amber-100 drop-shadow-[0_0_26px_rgba(251,191,36,0.9)]">THE SYNDICATE</span>
            </span>
          </h3>
          <div className="mt-8 flex flex-wrap justify-center gap-x-7 gap-y-4 sm:mt-10">
            <div className="group relative bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 p-[1px] [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)]">
              <span className="pointer-events-none absolute inset-[-1px] bg-inherit opacity-70 blur-[10px]" />
              <Link
                href={syndicateOtpLoginHref()}
                className="hamburger-attract relative inline-flex min-h-[56px] min-w-[220px] items-center justify-center bg-[#05070c]/90 px-8 py-3 text-base font-bold tracking-[0.08em] text-zinc-100 [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)] transition duration-300 hover:scale-[1.03] hover:bg-[#070b14]/94"
              >
                JOIN NOW
              </Link>
            </div>
            <div className="group relative bg-gradient-to-r from-amber-300 via-orange-400 to-rose-500 p-[1px] [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)]">
              <span className="pointer-events-none absolute inset-[-1px] bg-inherit opacity-70 blur-[10px]" />
              <Link
                href="/programs"
                className="hamburger-attract relative inline-flex min-h-[56px] min-w-[220px] items-center justify-center bg-[#05070c]/90 px-8 py-3 text-base font-bold tracking-[0.08em] text-zinc-100 [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)] transition duration-300 hover:scale-[1.03] hover:bg-[#070b14]/94"
              >
                EXPLORE PROGRAMS
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

