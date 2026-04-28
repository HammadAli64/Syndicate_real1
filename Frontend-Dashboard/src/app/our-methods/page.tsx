import Link from 'next/link'
import { NavApp } from '@/components/NavApp'
import GlobalBottomSections from '@/components/GlobalBottomSections'

const METHOD_PILLARS = [
  {
    title: 'Strategic Clarity',
    description:
      'Cut through noise and focus on high-leverage decisions that directly impact income, influence, and execution quality.',
  },
  {
    title: 'Disciplined Execution',
    description:
      'Build non-negotiable routines and repeatable operating systems that keep momentum consistent under pressure.',
  },
  {
    title: 'Ethical Power',
    description:
      'Learn to use money and influence with moral responsibility so growth strengthens your life instead of corrupting it.',
  },
]

const EXECUTION_STEPS = [
  {
    step: '01',
    title: 'Learn The System',
    description:
      'Absorb elite frameworks designed for practical implementation, not passive theory.',
  },
  {
    step: '02',
    title: 'Apply Immediately',
    description:
      'Execute each lesson straight away with clear actions that produce measurable movement.',
  },
  {
    step: '03',
    title: 'Compound Results',
    description:
      'Scale your outcomes through disciplined repetition, strategic refinement, and long-term consistency.',
  },
]

const SYSTEM_FEATURES = [
  {
    title: 'Execution Blueprints',
    detail: 'Battle-tested playbooks with step-by-step actions for business, positioning, and leverage.',
  },
  {
    title: 'Decision Filters',
    detail: 'Simple frameworks to separate high-value moves from distractions and low-return activity.',
  },
  {
    title: 'Accountability Rhythm',
    detail: 'Structured check-ins and standards that keep performance consistent, even under pressure.',
  },
  {
    title: 'Influence Strategy',
    detail: 'Practical communication and positioning methods to build authority without losing integrity.',
  },
]

const OUTCOME_METRICS = [
  { label: 'Practical Lessons', value: '100%' },
  { label: 'Immediate Application', value: 'Day 1' },
  { label: 'Systems Thinking Focus', value: 'High' },
]

const SAFEGUARDS = [
  'Power without discipline leads to self-destruction.',
  'Wealth without ethics leads to corruption.',
  'Influence without purpose leads to emptiness.',
  'The Syndicate method builds all three with moral control.',
]

const WORKFLOW_NODES = [
  { id: '01', title: 'Scan Doctrine', detail: 'Understand the strategic model.', href: '#mastery-section' },
  { id: '02', title: 'Lock Targets', detail: 'Pick high-leverage actions only.', href: '#mastery-section' },
  { id: '03', title: 'Deploy Daily', detail: 'Run execution loops with discipline.', href: '#register-interest' },
  { id: '04', title: 'Track Signal', detail: 'Measure outcomes and refine.', href: '#register-interest' },
  { id: '05', title: 'Scale Influence', detail: 'Compound authority and income.', href: '/login' },
] as const

const MISSION_PHASES = ['Recon', 'Execute', 'Calibrate', 'Scale'] as const

const COMMAND_STATS = [
  { label: 'Execution Streak', value: '21 Days' },
  { label: 'Signal Strength', value: '94%' },
  { label: 'Focus Score', value: 'A+' },
  { label: 'Win Rate', value: 'High' },
] as const

const CYBER_THEMES = [
  {
    name: 'red',
    frame: 'border-red-300/95',
    glow: 'shadow-[0_0_0_1px_rgba(255,70,70,0.85),0_0_42px_rgba(255,70,70,0.55),0_0_110px_rgba(255,70,70,0.24)]',
    chip: 'border-red-50 bg-red-200/75 shadow-[0_0_18px_rgba(255,70,70,1)]',
    text: 'text-red-100',
  },
  {
    name: 'purple',
    frame: 'border-violet-300/95',
    glow: 'shadow-[0_0_0_1px_rgba(193,120,255,0.85),0_0_42px_rgba(193,120,255,0.55),0_0_110px_rgba(193,120,255,0.24)]',
    chip: 'border-violet-50 bg-violet-200/75 shadow-[0_0_18px_rgba(193,120,255,1)]',
    text: 'text-violet-100',
  },
  {
    name: 'yellow',
    frame: 'border-amber-300/95',
    glow: 'shadow-[0_0_0_1px_rgba(255,198,64,0.85),0_0_42px_rgba(255,198,64,0.55),0_0_110px_rgba(255,198,64,0.24)]',
    chip: 'border-amber-50 bg-amber-200/75 shadow-[0_0_18px_rgba(255,198,64,1)]',
    text: 'text-amber-100',
  },
  {
    name: 'green',
    frame: 'border-lime-300/95',
    glow: 'shadow-[0_0_0_1px_rgba(120,255,90,0.85),0_0_42px_rgba(120,255,90,0.55),0_0_110px_rgba(120,255,90,0.24)]',
    chip: 'border-lime-50 bg-lime-200/75 shadow-[0_0_18px_rgba(120,255,90,1)]',
    text: 'text-lime-100',
  },
  {
    name: 'cyan',
    frame: 'border-cyan-300/95',
    glow: 'shadow-[0_0_0_1px_rgba(56,236,255,0.85),0_0_42px_rgba(56,236,255,0.55),0_0_110px_rgba(56,236,255,0.24)]',
    chip: 'border-cyan-50 bg-cyan-200/75 shadow-[0_0_18px_rgba(56,236,255,1)]',
    text: 'text-cyan-100',
  },
] as const

function HudPanel({
  toneIndex,
  eyebrow,
  title,
  body,
  cornerLabel,
}: {
  toneIndex: number
  eyebrow: string
  title: string
  body: string
  cornerLabel?: string
}) {
  const theme = CYBER_THEMES[toneIndex % CYBER_THEMES.length]
  return (
    <article
      className={`relative overflow-hidden rounded-2xl border bg-black/40 p-6 sm:p-7 backdrop-blur-0 ${theme.frame} ${theme.glow}`}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:repeating-linear-gradient(0deg,transparent_0px,transparent_2px,rgba(255,255,255,0.12)_2px,rgba(255,255,255,0.12)_3px)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_0%,rgba(255,255,255,0.16),transparent_70%)] opacity-70" />
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-200/80">{eyebrow}</p>
          {cornerLabel ? (
            <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${theme.chip} ${theme.text}`}>
              {cornerLabel}
            </span>
          ) : null}
        </div>
        <h3 className={`mt-3 text-2xl font-semibold ${theme.text}`}>{title}</h3>
        <p className="mt-3 text-base leading-relaxed text-zinc-100/90">{body}</p>
      </div>
    </article>
  )
}

export default function OurMethodsPage() {
  return (
    <div className="min-h-[100dvh] w-full bg-black">
      <NavApp />
      <section className="relative w-full overflow-hidden px-[clamp(1rem,3vw,2.5rem)] pb-4 pt-[74px] sm:pb-6 sm:pt-[86px]">
        <div className="pointer-events-none absolute inset-0">
          <video autoPlay muted loop playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover opacity-64 saturate-125 contrast-110">
            <source src="/assets/video.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_16%,rgba(255,70,70,0.24),transparent_30%),radial-gradient(circle_at_84%_18%,rgba(56,236,255,0.24),transparent_35%),radial-gradient(circle_at_70%_84%,rgba(255,198,64,0.16),transparent_40%),radial-gradient(circle_at_28%_78%,rgba(193,120,255,0.2),transparent_42%)]" />
          <div className="absolute inset-0 opacity-[0.11] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:64px_64px]" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#05040a]/42 via-black/56 to-[#020509]/74" />
          <div className="absolute inset-0 opacity-[0.07] [background-image:repeating-linear-gradient(0deg,transparent_0px,transparent_2px,rgba(255,255,255,0.12)_2px,rgba(255,255,255,0.12)_3px)]" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-92px)] w-full max-w-[96rem] items-stretch">
          <div className="grid w-full items-stretch gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6">
            <div className="methods-fade-up methods-panel-pulse overflow-hidden rounded-2xl border border-zinc-700/45 bg-black/30 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_0_72px_rgba(56,236,255,0.12)] sm:p-6">
              <div className="mb-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-md border border-cyan-300/60 bg-cyan-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-100">
                  Live Ops
                </span>
                <span className="inline-flex items-center rounded-md border border-violet-300/60 bg-violet-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-100">
                  Methods Protocol
                </span>
              </div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-200/80">
                The Syndicate // Operational Doctrine
              </p>
              <h1 className="methods-hero-title mt-4 text-[clamp(2.5rem,4.8vw,4.7rem)] font-black leading-[0.9] text-white">
                <span className="bg-gradient-to-r from-red-200 via-violet-200 to-cyan-100 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(56,236,255,0.22)]">
                  Our Methods
                </span>
                <span className="block text-zinc-100">of Mastery</span>
              </h1>

              <div className="mt-6 rounded-xl border border-cyan-300/35 bg-black/40 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100/90">Mission Progress</p>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-300/90">Live Pipeline</p>
                </div>
                <div className="relative h-[6px] overflow-hidden rounded-full bg-zinc-800/80">
                  <div className="absolute inset-y-0 left-0 w-[68%] rounded-full bg-gradient-to-r from-[#fdd02f] via-[#56e5ff] to-[#9b8cff]" />
                  <div className="absolute inset-y-0 left-0 w-[36%] rounded-full bg-[#fdd02f]/45 blur-sm animate-[electric-flow_2.4s_linear_infinite]" />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {MISSION_PHASES.map((phase, index) => (
                    <p key={phase} className={`text-xs font-semibold uppercase tracking-[0.16em] ${index < 2 ? 'text-cyan-100' : 'text-zinc-400'}`}>
                      {phase}
                    </p>
                  ))}
                </div>
              </div>
              <p className="mt-5 max-w-4xl text-[clamp(1rem,1.45vw,1.45rem)] leading-relaxed text-zinc-100/92">
                Greatness is engineered through systems, not mood. This protocol turns strategy into repeatable execution and execution into measurable results.
              </p>
              <p className="mt-3 max-w-4xl text-[clamp(1rem,1.45vw,1.45rem)] leading-relaxed text-zinc-200/88">
                Master money, influence, and decision-making with ethical discipline so your growth compounds without destroying your identity.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#register-interest" className="cta-nav-button text-xs font-semibold">
                  Register Your Interest
                </a>
                <a
                  href="#mastery-section"
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-cyan-300/70 bg-cyan-300/10 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100 shadow-[0_0_22px_rgba(56,236,255,0.18)] transition hover:bg-cyan-300/20"
                >
                  Enter Mastery
                </a>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {OUTCOME_METRICS.map((item, index) => {
                  const theme = CYBER_THEMES[index % CYBER_THEMES.length]
                  return (
                    <div
                      key={item.label}
                      className={`methods-fade-up relative overflow-hidden rounded-xl border bg-black/35 p-4 sm:p-5 ${theme.frame} ${theme.glow}`}
                      style={{ animationDelay: `${index * 90}ms` }}
                    >
                      <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:repeating-linear-gradient(90deg,transparent_0px,transparent_7px,rgba(255,255,255,0.12)_7px,rgba(255,255,255,0.12)_8px)]" />
                      <p className="relative z-10 text-sm uppercase tracking-[0.14em] text-zinc-300/80">{item.label}</p>
                      <p className={`relative z-10 mt-1 text-2xl font-semibold ${theme.text}`}>{item.value}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="methods-float">
              <div className="methods-panel-pulse overflow-y-auto rounded-2xl border border-cyan-300/40 bg-black/45 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_0_66px_rgba(56,236,255,0.18)] sm:p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-200/80">Command Console</p>
                <h2 className="mt-3 text-[clamp(2rem,3.6vw,3.3rem)] font-semibold text-cyan-100">Win The Loop.</h2>
                <p className="mt-3 text-[clamp(1rem,1.3vw,1.25rem)] leading-relaxed text-zinc-200/88">
                  Learn the system, deploy immediately, and stack consistent wins. The interface is cinematic, but the method is practical and real.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {COMMAND_STATS.map((stat, index) => {
                    const theme = CYBER_THEMES[(index + 1) % CYBER_THEMES.length]
                    return (
                      <div key={stat.label} className={`rounded-xl border bg-black/45 p-3 ${theme.frame} ${theme.glow}`}>
                        <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-300/85">{stat.label}</p>
                        <p className={`mt-1 text-lg font-semibold ${theme.text}`}>{stat.value}</p>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-5 grid gap-3">
                  {EXECUTION_STEPS.map((step, index) => (
                    <div
                      key={step.step}
                      className={`relative overflow-hidden rounded-xl border bg-black/35 p-5 transition duration-300 hover:-translate-y-0.5 ${CYBER_THEMES[index % CYBER_THEMES.length].frame} ${CYBER_THEMES[index % CYBER_THEMES.length].glow}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-200/70">Step {step.step}</p>
                        <span className={`h-2 w-2 rounded-sm border ${CYBER_THEMES[index % CYBER_THEMES.length].chip}`} />
                      </div>
                      <p className={`mt-2 text-lg font-semibold ${CYBER_THEMES[index % CYBER_THEMES.length].text}`}>{step.title}</p>
                      <p className="mt-2 text-base leading-relaxed text-zinc-100/90">{step.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative w-full px-4 py-14 sm:px-6 sm:py-18">
        <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:66px_66px]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(56,236,255,0.12),transparent_55%),radial-gradient(circle_at_50%_90%,rgba(193,120,255,0.10),transparent_60%)]" />
        <div className="relative z-10 mx-auto max-w-[96rem]">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-200/70">Core method pillars</p>
            <h2 className="mt-2 text-5xl font-bold text-zinc-100 sm:text-6xl">
              The operating principles behind every result
            </h2>
          </div>
          <div className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3 lg:gap-5">
            {METHOD_PILLARS.map((pillar, index) => (
              <HudPanel
                key={pillar.title}
                toneIndex={index + 1}
                eyebrow="Method pillar"
                title={pillar.title}
                body={pillar.description}
                cornerLabel={`P-${String(index + 1).padStart(2, '0')}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="relative w-full px-4 py-14 sm:px-6 sm:py-18">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_28%,rgba(255,70,70,0.10),transparent_38%),radial-gradient(circle_at_78%_38%,rgba(56,236,255,0.10),transparent_42%),radial-gradient(circle_at_58%_88%,rgba(120,255,90,0.10),transparent_44%)]" />
        <div className="relative z-10 mx-auto grid max-w-[96rem] gap-8 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-2xl border border-zinc-700/40 bg-black/35 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_0_66px_rgba(193,120,255,0.12),0_0_120px_rgba(56,236,255,0.08)] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-200/70 drop-shadow-[0_0_8px_rgba(217,70,239,0.35)]">The framework</p>
            <h3 className="mt-3 text-4xl font-semibold text-zinc-100 drop-shadow-[0_0_18px_rgba(56,236,255,0.28)] sm:text-5xl">The Syndicate Greatness Framework</h3>
            <div className="mt-6 space-y-5 text-lg leading-relaxed text-zinc-200/88 sm:text-xl">
              <p>
                The Syndicate brings clarity to the complicated dynamics of wealth and influence. You learn what matters, what doesn’t, and how to execute under
                pressure without drifting.
              </p>
              <p>
                Every lesson is built for immediate action. No passive theory — just a clear set of moves you can apply from day one.
              </p>
              <p>
                The edge is ethics: power without restraint destroys the operator. We build disciplined control so results compound instead of collapse.
              </p>
            </div>
            <p className="mt-8 text-lg font-semibold uppercase tracking-[0.16em] text-zinc-100 drop-shadow-[0_0_14px_rgba(255,198,64,0.35)]">
              Objective: controlled power.
            </p>
            <div id="register-interest" className="mt-8">
              <Link href="/login" className="cta-nav-button text-xs font-semibold">
                Register Your Interest
              </Link>
            </div>
          </div>

          <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:gap-5">
            {SYSTEM_FEATURES.map((feature, index) => (
              <HudPanel
                key={feature.title}
                toneIndex={index + 2}
                eyebrow="Inside the method"
                title={feature.title}
                body={feature.detail}
                cornerLabel={`SYS-${String(index + 1).padStart(2, '0')}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="relative w-full px-4 pb-12 sm:px-6 sm:pb-16">
        <div className="relative z-10 mx-auto max-w-[96rem] rounded-2xl border border-zinc-700/40 bg-black/35 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_0_72px_rgba(56,236,255,0.10)] sm:p-8">
          <div className="mb-7">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-200/70">Implementation pathway</p>
            <h3 className="mt-2 text-4xl font-semibold text-zinc-100 sm:text-5xl">From first lesson to long-term leverage</h3>
          </div>

          <div className="relative overflow-x-auto pb-2">
            <div className="relative min-w-[1160px] px-2">
              <div className="pointer-events-none absolute left-[4%] right-[4%] top-[34px] h-[2px] bg-gradient-to-r from-red-300/70 via-cyan-300/70 via-violet-300/70 via-lime-300/70 to-amber-300/70" />
              <div className="pointer-events-none absolute left-[4%] right-[4%] top-[30px] h-[10px] bg-gradient-to-r from-transparent via-cyan-200/60 to-transparent blur-[2px] animate-[electric-flow_2.6s_linear_infinite]" />

              <div className="grid grid-cols-5 gap-4">
                {WORKFLOW_NODES.map((node, index) => {
                  const theme = CYBER_THEMES[index % CYBER_THEMES.length]
                  return (
                    <a
                      key={node.id}
                      href={node.href}
                      className="group relative text-center methods-node-rise"
                      style={{ animationDelay: `${index * 110}ms` }}
                    >
                      <div
                        className={`relative mx-auto flex h-[78px] w-[78px] items-center justify-center rounded-full border-2 bg-black/70 text-base font-black tracking-[0.14em] transition duration-300 group-hover:scale-110 ${theme.frame} ${theme.text} ${theme.glow}`}
                      >
                        <span
                          className="pointer-events-none absolute inset-0 rounded-full opacity-70 node-ring-pulse"
                          style={{ animationDelay: `${index * 220}ms` }}
                        />
                        {node.id}
                      </div>
                      <span className={`mx-auto mt-2 inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${theme.chip} ${theme.text}`}>
                        live
                      </span>
                      <div className="mt-3">
                        <p className={`text-xl font-semibold transition duration-300 group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.24)] ${theme.text}`}>{node.title}</p>
                        <p className="mt-1 text-base leading-relaxed text-zinc-200/90">{node.detail}</p>
                      </div>
                      <p className="mt-2 text-sm uppercase tracking-[0.2em] text-cyan-200/80 transition group-hover:text-cyan-100">
                        Open Node
                      </p>
                    </a>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="mastery-section" className="w-full px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="mx-auto grid max-w-[96rem] gap-8 rounded-2xl border border-zinc-700/40 bg-black/35 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_0_72px_rgba(255,198,64,0.08)] sm:p-8 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-200/70">Money and power mastery</p>
            <h3 className="mt-2 text-4xl font-semibold text-zinc-100 sm:text-5xl">
              The objective is not hype. The objective is controlled power.
            </h3>
            <div className="mt-5 space-y-4 text-lg leading-relaxed text-zinc-200/88 sm:text-xl">
              <p>
                The Syndicate philosophy teaches that money and power go hand in hand. They are two sides of the same coin, and without mastery, they can
                corrupt the individual who chases them.
              </p>
              <p>
                Our mission goes beyond attaining money, power, and influence. Elite training programmes redefine how individuals perceive power by emphasising
                moral strength, strategic restraint, and societal impact.
              </p>
              <p>
                Members are taught to master money and power systems without succumbing to their enslaving or morally corrupting properties. This is the true
                meaning of life mastery.
              </p>
            </div>
          </div>
          <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:gap-5">
            {SAFEGUARDS.map((item, index) => (
              <HudPanel
                key={item}
                toneIndex={index + 3}
                eyebrow="Safeguard"
                title="Non-negotiable"
                body={item}
                cornerLabel={`SAFE`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="relative w-full overflow-hidden px-4 py-14 sm:px-6 sm:py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(56,236,255,0.12),transparent_44%),radial-gradient(circle_at_78%_30%,rgba(193,120,255,0.10),transparent_46%),radial-gradient(circle_at_60%_82%,rgba(255,198,64,0.12),transparent_50%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:repeating-linear-gradient(0deg,transparent_0px,transparent_2px,rgba(255,255,255,0.12)_2px,rgba(255,255,255,0.12)_3px)]" />
        <div className="relative z-10 mx-auto grid max-w-[96rem] gap-8 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-200/70">Your next move</p>
            <h3 className="mt-3 text-4xl font-bold text-zinc-100 sm:text-6xl">
              Train with purpose. Execute with discipline. Build true greatness.
            </h3>
            <p className="mt-4 max-w-3xl text-lg text-zinc-200/88 sm:text-xl">
              The Syndicate is for serious individuals ready to turn knowledge into leverage. If you want a framework that develops wealth, influence, and
              character together, this is your invitation.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-700/40 bg-black/35 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_0_52px_rgba(120,255,90,0.08),0_0_100px_rgba(255,198,64,0.08)]">
            <p className="text-lg font-semibold uppercase tracking-[0.18em] text-zinc-200/75 drop-shadow-[0_0_10px_rgba(120,255,90,0.3)]">What you unlock</p>
            <ul className="mt-4 space-y-3 text-lg text-zinc-200/88">
              <li className="drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]">Practical frameworks for money, influence, and strategic decision-making.</li>
              <li className="drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]">Execution systems designed for immediate implementation.</li>
              <li className="drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]">Ethical mastery principles to sustain success long term.</li>
              <li className="drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]">A network culture built around standards, accountability, and purpose.</li>
            </ul>
          </div>
        </div>
      </section>
      <GlobalBottomSections />

    </div>
  )
}

