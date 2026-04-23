import Image from 'next/image'
import SiteFooter from '@/components/SiteFooter'

const METHODS = [
  {
    title: 'Signal-Based Training',
    description:
      'Learn from real operating principles: weekly execution loops, operator scorecards, and decisions that compound over time.',
  },
  {
    title: 'Systems Over Motivation',
    description:
      'Replace random effort with repeatable systems for outreach, delivery, and cash flow so momentum does not rely on mood.',
  },
  {
    title: 'Network Accountability',
    description:
      'Use cohort pressure and peer review to maintain standards, cut procrastination, and keep your actions aligned with outcomes.',
  },
]

export default function OurMethodsPage() {
  return (
    <div className="min-h-screen bg-black pt-[69px]">
      <section className="relative overflow-hidden border-b border-fuchsia-300/20 px-4 py-14 sm:px-6 sm:py-16">
        <div className="pointer-events-none absolute inset-0">
          <Image
            src="/Assets/cb.gif"
            alt="Our methods background visual"
            fill
            unoptimized
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0514]/80 to-[#02050b]/90" />
        </div>
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <p className="text-xs uppercase tracking-[0.24em] text-fuchsia-200/80">Our Methods</p>
          <h1 className="mt-3 text-3xl font-bold text-fuchsia-50 sm:text-4xl md:text-5xl">How we build disciplined operators</h1>
          <p className="mx-auto mt-4 max-w-3xl text-sm text-fuchsia-100/75 sm:text-base">
            Every method below is designed to move you from information overload to clear execution and measurable performance.
          </p>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {METHODS.map((method) => (
            <article
              key={method.title}
              className="rounded-xl border border-fuchsia-300/20 bg-fuchsia-950/10 p-6 shadow-[0_0_24px_rgba(217,70,239,0.12)]"
            >
              <h2 className="text-lg font-semibold text-fuchsia-100">{method.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-fuchsia-100/75">{method.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="mx-auto max-w-5xl rounded-2xl border border-fuchsia-300/20 bg-gradient-to-r from-fuchsia-900/20 via-black to-cyan-900/20 p-6 text-center sm:p-8">
          <h3 className="text-2xl font-semibold text-fuchsia-50">Execution beats theory</h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-fuchsia-100/75 sm:text-base">
            We teach methods that fit real-world constraints and reward consistency. You leave with playbooks, not just inspiration.
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
