import Link from 'next/link'
import { RevealOnScroll } from '@/components/RevealOnScroll'

const homeBlocks = [
  {
    title: 'Battle For Money And Power',
    paragraphs: [
      'Every day is a fight for control in a system built to exploit, not serve. You are conditioned to chase wealth, status, and survival while staying trapped in cycles of debt and labour. This is not opportunity, it is a rigged battlefield.',
      'The Syndicate exists to break that cycle. It is a rebellion against corporate control and manufactured competition. Here, you do not follow the system, you learn to outplay it. Built on honour, loyalty, and trust, The Syndicate forges alliances, sharpens influence, and builds real power.',
      'This is not for the weak or the comfortable. No shortcuts. No illusions. Only discipline, strategy, and control.',
      'Rise above the system. Take what is yours. Will you rise above? Join The Syndicate today and become the master of your fate.',
    ],
  },
  {
    title: 'Success Is Born From Struggle',
    paragraphs: [
      'Strength is forged through struggle. Comfort creates weakness, and in a system built to dominate, weakness gets crushed. If you do not push forward, others will, leaving you behind in a game designed to exploit the passive.',
      'Escaping the system requires one thing: mastery of money and business. Success is not luck, it is earned through pressure, discipline, and calculated action.',
      'Traditional education and corporate thinking fail where reality begins. They produce theory, not power. The Syndicate rejects this model entirely, focusing only on what works in the real world.',
      'Struggle. Adapt. Dominate. Do not waste your efforts on paths that lead nowhere.',
    ],
  },
  {
    title: 'The Syndicate Secret Techniques',
    paragraphs: [
      'The Syndicate is not built for the masses. It is for those willing to push beyond limits and take control of money, power, and their own fate.',
      'Behind closed doors, The Syndicate has refined battle-tested methods rooted in power, discipline, and real-world dominance. Years of struggle forged a single outcome: a system designed to break free from corporate control and build undeniable leverage.',
      'These methods are not public. They are proven inside the system, then used to beat it. Only the strongest gain access to deeper levels.',
      'No mass access. No corporate dilution. Only a controlled gateway for those who qualify.',
    ],
  },
  {
    title: 'Become A Master',
    paragraphs: [
      'Mastery demands more than ambition. It demands the refusal to stay ordinary. This is not education, it is preparation for a battlefield where power and wealth are taken, not given.',
      'The Syndicate strips away corporate illusions and exposes how money and systems truly operate. You do not learn to serve wealth, you learn to control it.',
      'Average is rejected. Survival is irrelevant. The focus is dominance through discipline, strategy, and relentless execution.',
      'Step out of the system. Take control. Become untouchable. Begin your transformation today.',
    ],
  },
]

export function HomeSections() {
  return (
    <section id="homeSection" className="relative z-10 bg-black px-3 pb-20 pt-8 sm:px-6 md:px-8">
      <div className="mx-auto w-full max-w-none space-y-16 sm:space-y-24">
        {homeBlocks.map((block, index) => {
          const isReverse = index % 2 === 1
          return (
            <RevealOnScroll key={block.title} delayMs={index * 70}>
              <article
                className={`grid min-h-[calc(100dvh-9rem)] items-center gap-8 rounded-2xl bg-black/95 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.75)] backdrop-blur-sm md:grid-cols-2 md:p-8 ${
                  isReverse ? 'md:[&>*:first-child]:order-2' : ''
                }`}
              >
                <div className="space-y-4">
                  <h2 className="text-xxl text-[color:var(--gold-light)]">{block.title}</h2>
                  <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--gold-muted)]">Discipline . Strategy . Leverage</p>
                  <div className="mt-6 h-40 rounded-xl bg-black sm:h-52" />
                </div>
                <div className="space-y-4 text-lg leading-8 text-slate-100">
                  {block.paragraphs.map((text) => (
                    <p key={text.slice(0, 24)}>{text}</p>
                  ))}
                  {index === 2 && (
                    <Link
                      href="/login"
                      className="cta-nav-button text-sm"
                    >
                      JOIN NOW
                    </Link>
                  )}
                </div>
              </article>
            </RevealOnScroll>
          )
        })}

        <RevealOnScroll delayMs={340}>
          <article className="min-h-[calc(100dvh-9rem)] rounded-2xl bg-black/95 p-7 text-center shadow-[0_18px_60px_rgba(0,0,0,0.75)]">
            <h2 className="text-xxl text-[color:var(--gold-light)]">LEARN THE TECHNIQUES OF KINGS AND EMPERORS</h2>
            <div className="mx-auto mt-6 h-40 max-w-2xl rounded-xl bg-black sm:h-52" />
            <p className="mx-auto mt-4 max-w-none text-lg leading-8 text-slate-100">
              Knowledge is power, and The Syndicate is your gateway to it. Now is the time to rise above fear, failure,
              and limitation. This is your chance to learn from those that have already mastered money and power.
            </p>
            <Link
              href="/login"
              className="cta-nav-button mt-6 text-sm"
            >
              JOIN NOW
            </Link>
          </article>
        </RevealOnScroll>
      </div>
    </section>
  )
}
