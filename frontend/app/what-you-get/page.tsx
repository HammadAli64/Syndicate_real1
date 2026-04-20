import Link from 'next/link'
import { RevealOnScroll } from '@/components/RevealOnScroll'

const sections = [
  {
    title: 'Access to a powerful network and alliance',
    body: [
      'Power is never built alone. Isolation keeps you weak, while alliances create leverage in a system designed to divide and control.',
      'The Syndicate is not a network, it is a unified force. A circle of individuals aligned by ambition, discipline, and a code that rejects corporate manipulation.',
      'This is where influence is built, trust is earned, and real alliances are formed to dominate the system, not serve it.',
      'Stand alone and struggle. Unite and take control. The Syndicate is where money and power meet mastery.',
    ],
  },
  {
    title: 'Money and Power Mastery',
    body: [
      'The Syndicate philosophy teaches that money and power go hand in hand. They are two sides of the same coin.',
      'Its elite training programmes redefine how individuals perceive power and influence, emphasising moral strength and societal impact.',
      'Members are taught to master money and power systems without succumbing to enslavement, corruption, or hedonistic behaviour.',
      'This is the definition of true success and greatness.',
    ],
  },
  {
    title: 'Follow the path of Kings and Emperors',
    body: [
      'True leaders are forged through wisdom passed down through the ages. The great figures of history left a roadmap to greatness.',
      'The Syndicate acknowledges this truth while redefining it for a modern age: money and power are tools that demand mastery and moral resilience.',
      'Its programs equip members to dominate money and power networks while strengthening integrity.',
      'Members move with intent, leveraging influence for societal impact rather than personal gain.',
    ],
  },
  {
    title: 'Achieving True Greatness comes with Mastery',
    body: [
      'True greatness is deliberately built through knowledge, discipline, and action.',
      'The Syndicate equips members with actionable real-world strategies to master systems of wealth and power.',
      'What sets The Syndicate apart is its commitment to ethics and purpose. Success is defined as prosperity balanced with moral codes.',
      'This is more than a programme, it is a movement reshaping outdated notions of money and power.',
    ],
  },
]

export default function WhatYouGetPage() {
  return (
    <main className="min-h-dvh bg-black px-3 pb-20 pt-28 sm:px-6 md:px-8">
      <div className="mx-auto w-full max-w-none">
        <RevealOnScroll>
          <header className="mb-12 text-center">
            <h1 className="text-xxl text-[color:var(--gold-light)]">WHAT YOU GET</h1>
            <p className="mx-auto mt-4 max-w-none text-lg text-slate-100">
              Section by section, this is the path to alliances, influence, and true money-power mastery.
            </p>
          </header>
        </RevealOnScroll>

        <div className="space-y-14">
          {sections.map((section, idx) => (
            <RevealOnScroll key={section.title} delayMs={idx * 80}>
              <section className="min-h-[calc(100dvh-10rem)] rounded-2xl bg-black/95 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.75)] md:p-8">
                <h2 className="text-xxl text-[color:var(--gold-light)]">{section.title}</h2>
                <div className="mt-6 h-40 rounded-xl bg-black sm:h-52" />
                <div className="mt-4 space-y-4 text-lg leading-8 text-slate-100">
                  {section.body.map((text) => (
                    <p key={text.slice(0, 20)}>{text}</p>
                  ))}
                </div>
              </section>
            </RevealOnScroll>
          ))}
        </div>

        <RevealOnScroll delayMs={320}>
          <div className="mt-12 text-center">
            <Link
              href="/login"
              className="cta-nav-button text-sm"
            >
              JOIN NOW
            </Link>
          </div>
        </RevealOnScroll>
      </div>
    </main>
  )
}
