'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Check, Crown, Shield, Sparkles, Star } from 'lucide-react'

type PlanKey = 'bundle' | 'membership'
type BillingKey = 'monthly' | 'yearly'

interface PricingTier {
  price: Record<BillingKey, string>
  oldPrice?: Record<BillingKey, string>
  badge: string
  title: string
  description: string
  features: string[]
  accent: 'cyan' | 'purple' | 'gold'
  icon: ReactNode
  cta: string
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

const pricingData: Record<PlanKey, PricingTier> = {
  bundle: {
    price: { monthly: '£499', yearly: '£4,999' },
    oldPrice: { monthly: '£699', yearly: '£6,999' },
    badge: 'ALL PROGRAMS BUNDLE',
    title: 'All Programs Bundle',
    description:
      'Complete access to every current and upcoming program. Built for serious operators who want total coverage.',
    features: [
      'Access to all active programs',
      'All future program updates included',
      'Premium downloadable resources',
      'Priority content releases',
      'Completion certificates',
      'Community access',
      'Direct support lane',
    ],
    accent: 'cyan',
    icon: <Shield className="h-4 w-4" />,
    cta: 'Get Full Bundle',
  },
  membership: {
    price: { monthly: '£199', yearly: '£1,999' },
    oldPrice: { monthly: '£299', yearly: '£2,499' },
    badge: 'EXCLUSIVE MEMBERSHIP CONTENT',
    title: 'Exclusive Membership Content',
    description:
      'Private member-only content, elite drops, strategic insights, and high-signal execution resources.',
    features: [
      'Exclusive members-only modules',
      'Private content vault',
      'Weekly premium drops',
      'Priority support',
      'Private community channels',
      'Early access to releases',
      'Monthly insider workshop',
    ],
    accent: 'gold',
    icon: <Crown className="h-4 w-4" />,
    cta: 'Join Membership',
  },
}

function AccentGlow({ accent }: { accent: PricingTier['accent'] }) {
  const cls =
    accent === 'cyan'
      ? 'from-[#00f5ff]/30 via-transparent to-transparent'
      : accent === 'purple'
        ? 'from-[#bf00ff]/30 via-transparent to-transparent'
        : 'from-[var(--gold)]/25 via-transparent to-transparent'

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br blur-2xl opacity-70',
        cls,
      )}
    />
  )
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
  const accentBorder =
    tier.accent === 'cyan'
      ? 'border-[#00f5ff]/35 hover:border-[#00f5ff]/60'
      : tier.accent === 'purple'
        ? 'border-[#bf00ff]/35 hover:border-[#bf00ff]/60'
        : 'border-[var(--gold)]/35 hover:border-[var(--gold)]/60'

  const accentText =
    tier.accent === 'cyan'
      ? 'text-[#00f5ff]'
      : tier.accent === 'purple'
        ? 'text-[#bf00ff]'
        : 'text-[var(--gold)]'

  const accentShadow =
    tier.accent === 'cyan'
      ? 'shadow-[0_0_30px_rgba(0,245,255,0.11)] hover:shadow-[0_0_60px_rgba(0,245,255,0.18)]'
      : tier.accent === 'purple'
        ? 'shadow-[0_0_30px_rgba(191,0,255,0.12)] hover:shadow-[0_0_60px_rgba(191,0,255,0.2)]'
        : 'shadow-[0_0_30px_rgba(212,175,55,0.12)] hover:shadow-[0_0_60px_rgba(212,175,55,0.2)]'

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border bg-[var(--glass-bg)] backdrop-blur-xl transition-all duration-300 will-change-transform hover:scale-[1.02]',
        accentBorder,
        accentShadow,
        highlighted && 'ring-1 ring-white/10',
      )}
    >
      <AccentGlow accent={tier.accent} />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 2px, transparent 6px)',
        }}
      />

      <div className="relative p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div
            className={cn(
              'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold tracking-[0.2em]',
              accentText,
            )}
          >
            {tier.icon}
            <span>{tier.badge}</span>
          </div>

          {planKey === 'membership' && (
            <div className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-xs text-white/75">
              <Star className="h-3.5 w-3.5 text-[var(--gold)]" />
              Recommended
            </div>
          )}
        </div>

        <div className="mt-6 flex items-end justify-between gap-4">
          <motion.div
            key={`${planKey}-${billing}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
          >
            <div className="flex items-center gap-3">
              {tier.oldPrice?.[billing] && (
                <div
                  className="text-lg font-semibold text-white/40 line-through sm:text-xl"
                  style={{ fontFamily: 'Inter, Segoe UI, Roboto, Arial, sans-serif' }}
                >
                  {tier.oldPrice[billing]}
                </div>
              )}
            </div>

            <div className="mt-1 flex items-baseline gap-2">
              <div
                className="text-5xl font-black text-white sm:text-6xl"
                style={{ fontFamily: 'Inter, Segoe UI, Roboto, Arial, sans-serif' }}
              >
                {tier.price[billing]}
              </div>
              <div className="text-sm text-white/60">
                /{billing === 'monthly' ? 'mo' : 'yr'}
              </div>
            </div>

            <div className="mt-2 max-w-md text-sm text-white/70 font-body">
              {tier.description}
            </div>
          </motion.div>

          <div className="hidden flex-col items-end gap-2 text-xs text-white/55 font-mono sm:flex">
            <div className="inline-flex items-center gap-2">
              <Sparkles className={cn('h-4 w-4', accentText)} />
              <span>THE SYNDICATE</span>
            </div>
            <span className="tracking-[0.3em]">ACCESS KEY</span>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-2">
          {tier.features.map((f) => (
            <div
              key={f}
              className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <Check className={cn('mt-0.5 h-4 w-4 shrink-0', accentText)} />
              <span className="text-sm text-white/80">{f}</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          className={cn(
            'mt-7 w-full rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold tracking-wide text-white transition-all hover:bg-white/10 active:scale-[0.99]',
            planKey === 'membership' &&
              'border-[var(--gold)]/35 bg-[var(--gold)]/10 hover:bg-[var(--gold)]/15',
          )}
        >
          {tier.cta}
        </button>
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
      { key: 'membership' as const, tier: pricingData.membership },
    ],
    [],
  )

  return (
    <section
      id="pricing"
      className={cn(
        'relative w-full min-h-screen overflow-hidden bg-background px-6 py-20 md:py-24',
        className,
      )}
    >
      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center">
        <header className="mb-12 rounded-2xl border border-[#00f5ff]/30 bg-black/20 px-6 py-10 text-center md:mb-16 md:px-10 md:py-12">
          <h2 className="mt-2 font-display text-4xl font-black uppercase tracking-[0.12em] text-white md:text-5xl">
            Syndicate Subscriptions
          </h2>
          <p className="mx-auto mt-4 max-w-2xl font-mono text-base tracking-[0.1em] text-zinc-400 md:text-lg">
            Choose your access tier. Bundle for full dominance or membership for exclusive content.
          </p>

          <div className="mt-8 flex items-center justify-center gap-4 rounded-xl border border-[#00f5ff]/25 bg-black/30 px-6 py-4 text-sm font-mono tracking-[0.2em] uppercase">
            <span className={billing === 'monthly' ? 'text-[#00f5ff]' : 'text-zinc-500'}>
              Monthly
            </span>
            <button
              type="button"
              onClick={() => setBilling((b) => (b === 'monthly' ? 'yearly' : 'monthly'))}
              className={cn(
                'relative h-7 w-14 rounded-full border border-[#00f5ff]/25 bg-black/40 p-1 transition-all duration-200',
                billing === 'yearly' && 'border-[#00f5ff]/40 bg-[#00f5ff]/10',
              )}
              aria-label="Toggle billing period"
            >
              <span
                className={cn(
                  'block h-5 w-5 rounded-full bg-[#00f5ff] transition-all duration-200',
                  billing === 'yearly' ? 'translate-x-7' : 'translate-x-0',
                )}
              />
            </button>
            <span className={billing === 'yearly' ? 'text-[#00f5ff]' : 'text-zinc-500'}>
              Yearly
            </span>
          </div>
        </header>

        <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
          {tiers.map(({ key, tier }) => (
            <div key={key} onClick={() => onSelectPlan?.(key)} className="cursor-default">
              <TierCard
                planKey={key}
                tier={tier}
                billing={billing}
                highlighted={key === 'membership'}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
