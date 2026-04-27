import Image from 'next/image'
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
  { label: 'Ethics & Integrity Layer', value: 'Core' },
]

const SAFEGUARDS = [
  'Power without discipline leads to self-destruction.',
  'Wealth without ethics leads to corruption.',
  'Influence without purpose leads to emptiness.',
  'The Syndicate method builds all three with moral control.',
]

export default function OurMethodsPage() {
  return (
    <div className="min-h-[100dvh] w-full bg-black">
      <NavApp />
      <section className="relative h-[100dvh] min-h-[100dvh] w-full overflow-hidden border-b border-amber-300/20 px-4 pb-14 pt-[96px] sm:px-6 sm:pb-20 sm:pt-[110px]">
        <div className="pointer-events-none absolute inset-0">
          <Image
            src="/assets/cb.gif"
            alt="Our methods background visual"
            fill
            unoptimized
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#120b02]/78 via-[#070707]/86 to-[#02050b]/94" />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.45) 2px, rgba(0,0,0,0.45) 4px)' }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(251,191,36,0.22),transparent_35%),radial-gradient(circle_at_85%_72%,rgba(34,211,238,0.12),transparent_33%)]" />
        </div>
        <div className="relative z-10 mx-auto grid max-w-7xl items-start gap-8 md:grid-cols-[1.05fr_0.95fr] md:gap-10">
          <div className="methods-fade-up">
            <h1 className="mt-4 text-4xl font-black text-fuchsia-50 leading-[0.95] sm:text-5xl md:text-6xl lg:text-7xl">
              <span className="bg-gradient-to-r from-amber-100 via-amber-300 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(251,191,36,0.35)]">
                Our
                <br />
                Methods
                <br />
                of
                <br />
                Mastery
              </span>
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-zinc-100/90 sm:text-lg">
              Greatness is engineered through a repeatable method. The Syndicate teaches structured frameworks for thinking, execution, and leverage so members can
              build power with precision instead of relying on motivation alone.
            </p>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-zinc-200/85 sm:text-lg">
              We combine elite strategy with ethical discipline: master money, influence, and decision-making while staying aligned with honour. Every module is
              built to create real-world results you can apply immediately.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#register-interest" className="cta-nav-button text-xs font-semibold">
                Register Your Interest
              </a>
              <a
                href="#mastery-section"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-cyan-300/60 bg-cyan-300/10 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.18)] transition hover:bg-cyan-300/20"
              >
                Explore Mastery
              </a>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {OUTCOME_METRICS.map((item, index) => (
                <div
                  key={item.label}
                  className="methods-fade-up rounded-xl border border-amber-300/25 bg-black/55 p-3"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">{item.label}</p>
                  <p className="mt-1 text-lg font-semibold text-amber-100">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="methods-float">
            <div className="relative ml-auto w-full max-w-[480px] overflow-hidden rounded-2xl border border-amber-300/45 bg-black/65 shadow-[0_0_48px_rgba(251,191,36,0.24)]">
              <Image
                src="/assets/13.png"
                alt="Rule Money or Be Ruled"
                width={816}
                height={1120}
                className="h-auto w-full object-cover"
                priority
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-amber-100/90">Rule Money Or Be Ruled</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative px-4 py-12 sm:px-6 sm:py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(251,191,36,0.12),transparent_34%),radial-gradient(circle_at_90%_80%,rgba(34,211,238,0.1),transparent_35%)]" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.24em] text-amber-200/80">Core Method Pillars</p>
            <h2 className="mt-2 text-2xl font-semibold text-amber-100 sm:text-3xl">The operating principles behind every result</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
          {METHOD_PILLARS.map((pillar, index) => (
            <article
              key={pillar.title}
              className="methods-fade-up rounded-2xl border border-amber-300/20 bg-gradient-to-b from-[#110f08]/85 to-black p-6 shadow-[0_0_24px_rgba(251,191,36,0.08)] transition hover:-translate-y-1 hover:border-amber-300/40 hover:shadow-[0_0_32px_rgba(251,191,36,0.16)]"
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <p className="text-xs uppercase tracking-[0.24em] text-amber-200/70">Method Pillar</p>
              <h2 className="mt-3 text-xl font-semibold text-amber-100">{pillar.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-200/85">{pillar.description}</p>
            </article>
          ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-2xl border border-amber-300/25 bg-gradient-to-b from-[#140f02]/40 to-black p-6 shadow-[0_0_44px_rgba(251,191,36,0.16)] sm:p-8">
            <h3 className="text-2xl font-semibold text-amber-100 sm:text-3xl">The Syndicate Greatness Framework</h3>
            <div className="mt-6 space-y-5 text-sm leading-relaxed text-zinc-200/90 sm:text-base">
              <p>
                The Syndicate brings clarity to the often-complicated dynamics of wealth accumulation. Through immersive, elite training programs, participants
                gain the secrets to not only master money and power but also to bend reality to their will.
              </p>
              <p>
                Our special methods are designed to naturally absorb this information and put it into practice straight away. Every lesson delivers techniques
                that can be implemented immediately, from the very first video.
              </p>
              <p>
                What sets The Syndicate apart is its commitment to ethics and purpose. This is not just about wealth; it is about defining true success as a
                balance between prosperity and moral codes.
              </p>
              <p>
                Members are taught to harness financial systems without falling prey to greed, corruption, or hedonism. Testimonials from our global network of
                members reflect life-changing breakthroughs.
              </p>
            </div>
            <p className="mt-8 text-base font-semibold uppercase tracking-[0.16em] text-amber-100 sm:text-lg">
              Greatness is your destination, and The Syndicate is your guide - JOIN NOW!
            </p>
            <div id="register-interest" className="mt-8">
              <Link href="/login" className="cta-nav-button text-xs font-semibold">
                Register Your Interest
              </Link>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {SYSTEM_FEATURES.map((feature, index) => (
              <article
                key={feature.title}
                className="methods-fade-up rounded-2xl border border-cyan-300/25 bg-gradient-to-b from-cyan-950/20 to-black p-5 shadow-[0_0_20px_rgba(34,211,238,0.1)]"
                style={{ animationDelay: `${index * 130}ms` }}
              >
                <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/70">Inside The Method</p>
                <h4 className="mt-2 text-lg font-semibold text-cyan-100">{feature.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-zinc-200/85">{feature.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-12 sm:px-6 sm:pb-16">
        <div className="mx-auto max-w-7xl rounded-2xl border border-cyan-300/30 bg-gradient-to-r from-cyan-950/25 via-black to-[#170913]/55 p-6 sm:p-8">
          <div className="mb-7">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">Implementation Pathway</p>
            <h3 className="mt-2 text-2xl font-semibold text-cyan-100 sm:text-3xl">From first lesson to long-term leverage</h3>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {EXECUTION_STEPS.map((item, index) => (
              <div
                key={item.step}
                className="methods-fade-up rounded-2xl border border-cyan-300/25 bg-black/40 p-5"
                style={{ animationDelay: `${index * 130}ms` }}
              >
                <p className="text-sm font-semibold tracking-[0.2em] text-cyan-200/75">{item.step}</p>
                <h4 className="mt-2 text-lg font-semibold text-cyan-100">{item.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-zinc-200/85">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="mastery-section" className="px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="mx-auto grid max-w-7xl gap-8 rounded-2xl border border-amber-300/25 bg-gradient-to-b from-[#120a04]/85 to-black p-6 sm:p-8 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-amber-200/80">Money and Power Mastery</p>
            <h3 className="mt-2 text-2xl font-semibold text-amber-100 sm:text-3xl">
              The objective is not hype. The objective is controlled power.
            </h3>
            <div className="mt-5 space-y-4 text-sm leading-relaxed text-zinc-200/88 sm:text-base">
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
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/login" className="cta-nav-button text-xs font-semibold">
                Register Your Interest
              </Link>
              <Link
                href="/programs"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-cyan-300/65 bg-cyan-300/10 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.2)] transition hover:bg-cyan-300/20"
              >
                Explore Programs
              </Link>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {SAFEGUARDS.map((item, index) => (
              <article
                key={item}
                className="methods-fade-up rounded-xl border border-amber-300/20 bg-black/45 p-4"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <p className="text-sm leading-relaxed text-zinc-200/85">{item}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-amber-300/20 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.14),rgba(2,6,23,0.95))] px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-amber-200/80">Your Next Move</p>
            <h3 className="mt-3 text-2xl font-bold text-amber-100 sm:text-4xl">Train With Purpose. Execute With Discipline. Build True Greatness.</h3>
            <p className="mt-4 max-w-3xl text-sm text-zinc-200/85 sm:text-base">
              The Syndicate is for serious individuals ready to turn knowledge into leverage. If you want a framework that develops wealth, influence, and
              character together, this is your invitation.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-300/20 bg-black/40 p-5">
            <p className="text-sm uppercase tracking-[0.16em] text-amber-200/80">What you unlock</p>
            <ul className="mt-4 space-y-3 text-sm text-zinc-200/85">
              <li>Practical frameworks for money, influence, and strategic decision-making.</li>
              <li>Execution systems designed for immediate implementation.</li>
              <li>Ethical mastery principles to sustain success long term.</li>
              <li>A network culture built around standards, accountability, and purpose.</li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-8 flex max-w-7xl flex-wrap gap-3">
          <Link href="/login" className="cta-nav-button text-xs font-semibold">
            Join Now
          </Link>
          <Link
            href="/what-you-get"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-cyan-300/65 bg-cyan-300/10 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.2)] transition hover:bg-cyan-300/20"
          >
            See What You Get
          </Link>
        </div>
      </section>
      <GlobalBottomSections />

    </div>
  )
}

