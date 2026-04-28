'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Check, Crown, Shield, Star, Swords } from 'lucide-react'
import Image from 'next/image'

type PlanKey = 'bundle' | 'pawn' | 'knight' | 'king'
type BillingKey = 'monthly' | 'yearly'

interface PricingTier {
  price: Record<BillingKey, string>
  oldPrice?: Record<BillingKey, string>
  badge: string
  title: string
  description: string
  features: string[]
  accent: 'gold'
  icon: ReactNode
  cta: string
  billingMode?: 'lifetime' | 'recurring'
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

const pricingData: Record<PlanKey, PricingTier> = {
  bundle: {
    price: { monthly: '£333', yearly: '£3,330' },
    oldPrice: { monthly: '£555', yearly: '£5,550' },
    badge: 'ALL PROGRAMS BUNDLE',
    title: 'All Programs Bundle',
    description:
      'You will access everything with full lifetime coverage across the complete Syndicate ecosystem.',
    features: [
      'You will access everything',
      'All programs lifetime',
      'Syndicate Challenges Mode',
      'Exclusive Membership Section',
      'Complete Access of Dashboard',
      'Quick Access to all social apps',
      'Goals & Milestone section',
    ],
    accent: 'gold',
    icon: <Shield className="h-4 w-4" />,
    cta: 'Get Full Bundle',
    billingMode: 'lifetime',
  },
  pawn: {
    price: { monthly: '£19.19', yearly: '£191.90' },
    oldPrice: { monthly: '£29.99', yearly: '£299.90' },
    badge: 'THE PAWN · BASIC',
    title: 'The Pawn Basic',
    description:
      'Enter the world of The Syndicate. Ideal for newcomers building momentum with structured direction.',
    features: [
      'Core foundation vault access',
      'New member roadmap',
      'Weekly action prompts',
      'Private community entry',
      'Monthly mission briefing',
      'Starter accountability framework',
    ],
    accent: 'gold',
    icon: <Star className="h-4 w-4" />,
    cta: 'Join The Pawn Basic',
    billingMode: 'recurring',
  },
  knight: {
    price: { monthly: '£33.33', yearly: '£333.30' },
    oldPrice: { monthly: '£49.99', yearly: '£499.90' },
    badge: 'THE KNIGHT',
    title: 'The Knight',
    description:
      'Expand your knowledge base with our more indepth offering focused on strategic execution and systems.',
    features: [
      'Everything in The Pawn',
      'Advanced strategy modules',
      'Deep-dive weekly workshops',
      'Execution playbooks and SOPs',
      'Faster support response lane',
      'Early access to selected releases',
    ],
    accent: 'gold',
    icon: <Swords className="h-4 w-4" />,
    cta: 'Join The Knight',
    billingMode: 'recurring',
  },
  king: {
    price: { monthly: '£77.77', yearly: '£777.70' },
    oldPrice: { monthly: '£99.99', yearly: '£999.90' },
    badge: 'THE KING · PREMIUM',
    title: 'The King Premium',
    description:
      'Master your mind, money and power with highest-level resources, insider material, and elite support priority.',
    features: [
      'Everything in The Knight',
      'Elite inner-circle content',
      'Monthly insider workshop access',
      'Direct support lane',
      'Private leadership channel',
      'Highest-priority release access',
    ],
    accent: 'gold',
    icon: <Crown className="h-4 w-4" />,
    cta: 'Join The King Premium',
    billingMode: 'recurring',
  },
}

function TierCard({
  planKey,
  tier,
  billing,
  highlighted,
}: {
  planKey: PlanKey
  tier: PricingTier
  billing: BillingKey
  highlighted?: boolean
}) {
  const isLifetime = tier.billingMode === 'lifetime'
  const activeBilling: BillingKey = isLifetime ? 'monthly' : billing
  const isBundle = planKey === 'bundle'
  const accentBorder = 'border-white/35 hover:border-white/70'
  const accentText = 'text-amber-300'
  const gradientShellByPlan: Record<PlanKey, string> = {
    bundle: 'from-cyan-400 via-violet-500 to-fuchsia-500',
    pawn: 'from-lime-300 via-emerald-400 to-cyan-400',
    knight: 'from-cyan-400 via-blue-500 to-violet-500',
    king: 'from-amber-300 via-orange-400 to-rose-500',
  }
  const accentShadow =
    'shadow-[0_0_0_2px_rgba(255,255,255,0.3),0_0_42px_rgba(34,211,238,0.45),0_0_92px_rgba(217,70,239,0.3)] hover:shadow-[0_0_0_2px_rgba(255,255,255,0.46),0_0_64px_rgba(34,211,238,0.6),0_0_130px_rgba(217,70,239,0.45)] hover:brightness-125'

  return (
    <div
      className={cn(
        'relative rounded-3xl bg-gradient-to-r p-[5px] [clip-path:polygon(14px_0,calc(100%-14px)_0,100%_14px,100%_calc(100%-14px),calc(100%-14px)_100%,14px_100%,0_calc(100%-14px),0_14px)]',
        gradientShellByPlan[planKey],
        accentShadow,
      )}
    >
      <span className="pointer-events-none absolute inset-[-2px] bg-inherit opacity-100 blur-[18px]" />
      <div
        className={cn(
          'relative h-full overflow-hidden rounded-3xl border border-white/25 transition-all duration-300 will-change-transform hover:scale-[1.02] [clip-path:polygon(14px_0,calc(100%-14px)_0,100%_14px,100%_calc(100%-14px),calc(100%-14px)_100%,14px_100%,0_calc(100%-14px),0_14px)]',
          isBundle
            ? 'bg-[radial-gradient(circle_at_20%_14%,rgba(34,211,238,0.22),transparent_42%),radial-gradient(circle_at_82%_24%,rgba(217,70,239,0.2),transparent_44%),linear-gradient(165deg,rgba(10,20,34,0.92),rgba(20,10,30,0.9))]'
            : 'bg-[#05060a]/92',
          accentBorder,
          highlighted && 'ring-1 ring-white/10',
        )}
      >
        <span className="pointer-events-none absolute inset-x-5 top-0 h-[2px] bg-gradient-to-r from-transparent via-white/90 to-transparent opacity-95" />

        <div className="relative p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div
            className={cn(
              'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[0.8rem] font-bold tracking-[0.16em] sm:text-[0.86rem]',
              accentText,
            )}
          >
            {tier.icon}
            <span>{tier.badge}</span>
          </div>

          {planKey === 'bundle' && (
            <div className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-[0.78rem] font-semibold text-white/80 sm:text-[0.82rem]">
              <Star className="h-3.5 w-3.5 text-amber-300" />
              Recommended
            </div>
          )}
        </div>

        <div className="mt-4 flex items-end justify-between gap-4">
          <motion.div
            key={`${planKey}-${billing}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
          >
            <div className="flex items-center gap-3">
              {tier.oldPrice?.[activeBilling] && (
                <div
                  className="text-lg font-semibold text-white/40 line-through sm:text-xl"
                  style={{ fontFamily: 'Inter, Segoe UI, Roboto, Arial, sans-serif' }}
                >
                  {tier.oldPrice[activeBilling]}
                </div>
              )}
            </div>

            <div className="mt-1 flex items-baseline gap-2">
              <div
                className="text-4xl font-black text-white sm:text-5xl"
                style={{ fontFamily: 'Inter, Segoe UI, Roboto, Arial, sans-serif' }}
              >
                {tier.price[activeBilling]}
              </div>
              <div className="text-sm text-white/60">
                /{isLifetime ? 'lifetime' : billing === 'monthly' ? 'mo' : 'yr'}
              </div>
            </div>

            <div className="mt-2 max-w-[42ch] text-sm text-white/70 font-body">
              {tier.description}
            </div>
          </motion.div>

        </div>

        <div className="mt-5 grid grid-cols-1 gap-2">
          {tier.features.map((f) => (
            <div
              key={f}
              className={cn(
                'flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5',
                isBundle ? 'border-cyan-200/25 bg-cyan-300/5' : 'border-white/15 bg-transparent',
              )}
            >
              <Check className={cn('mt-0.5 h-4 w-4 shrink-0', accentText)} />
              <span className="text-[13px] leading-snug text-white/80">{f}</span>
            </div>
          ))}
        </div>

          <button
            type="button"
            className={cn(
              'hamburger-attract mt-5 w-full rounded-2xl border border-white/35 px-5 py-2.5 text-sm font-semibold tracking-wide text-zinc-100 shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all hover:scale-[1.02] hover:shadow-[0_0_34px_rgba(236,72,153,0.24)] active:scale-[0.99]',
              isBundle
                ? 'bg-gradient-to-r from-cyan-500/20 via-violet-500/24 to-fuchsia-500/20 text-amber-50'
                : 'bg-transparent',
            )}
          >
            {tier.cta}
          </button>
        </div>
      </div>
    </div>
  )
}

export function PricingPage({
  className,
  onSelectPlan,
}: {
  className?: string
  onSelectPlan?: (plan: PlanKey) => void
}) {
  const [billing, setBilling] = useState<BillingKey>('monthly')

  const tiers = useMemo(
    () => [
      { key: 'bundle' as const, tier: pricingData.bundle },
      { key: 'pawn' as const, tier: pricingData.pawn },
      { key: 'king' as const, tier: pricingData.king },
    ],
    [],
  )

  return (
    <section
      id="pricing"
      className={cn(
        'relative w-full min-h-screen overflow-hidden bg-background px-[clamp(0.75rem,2.2vw,2rem)] py-20 md:py-24',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        <Image src="/assets/g.gif" alt="" aria-hidden fill sizes="100vw" className="object-cover opacity-18" unoptimized />
        <div className="absolute inset-0 bg-black/70" />
      </div>
      <div className="relative mx-auto flex w-full max-w-none flex-col items-center">
        <header className="mb-12 px-6 py-8 text-center md:mb-16 md:px-10 md:py-10">
          <h2 className="mt-2 font-display text-5xl font-black uppercase tracking-[0.14em] text-white md:text-6xl">
            Syndicate Offers
          </h2>
          <p className="mx-auto mt-4 max-w-3xl font-mono text-lg tracking-[0.1em] text-zinc-300 md:text-xl">
            Choose your access tier: full bundle lifetime coverage or The Pawn and The King membership paths.
          </p>

          <div className="mt-8 inline-flex items-center justify-center gap-4 rounded-xl bg-black/10 px-6 py-4 text-sm font-mono tracking-[0.2em] uppercase shadow-[0_0_18px_rgba(251,191,36,0.2)]">
            <span className={billing === 'monthly' ? 'text-amber-300' : 'text-zinc-500'}>
              Monthly
            </span>
            <button
              type="button"
              onClick={() => setBilling((b) => (b === 'monthly' ? 'yearly' : 'monthly'))}
              className={cn(
                'relative h-7 w-14 rounded-full border border-amber-300/25 bg-black/40 p-1 transition-all duration-200',
                billing === 'yearly' && 'border-amber-300/45 bg-amber-300/12',
              )}
              aria-label="Toggle billing period"
            >
              <span
                className={cn(
                  'block h-5 w-5 rounded-full bg-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.5)] transition-all duration-200',
                  billing === 'yearly' ? 'translate-x-7' : 'translate-x-0',
                )}
              />
            </button>
            <span className={billing === 'yearly' ? 'text-amber-300' : 'text-zinc-500'}>
              Yearly
            </span>
          </div>
        </header>

        <div className="grid w-full grid-cols-1 gap-5 px-[2vw] md:grid-cols-2 md:gap-6 xl:grid-cols-3 xl:gap-6">
          {tiers.map(({ key, tier }) => (
            <div key={key} onClick={() => onSelectPlan?.(key)} className="cursor-default">
              <TierCard
                planKey={key}
                tier={tier}
                billing={billing}
                highlighted={key === 'bundle'}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
