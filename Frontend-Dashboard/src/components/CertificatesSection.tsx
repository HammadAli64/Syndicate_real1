'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Award, CheckCircle2, Download, Shield } from 'lucide-react'
import Image from 'next/image'

type Metric = {
  value: number
  suffix: string
  label: string
}

type Feature = {
  title: string
  description: string
  icon: 'award' | 'shield' | 'check'
}

type Tier = {
  name: string
  color: string
  desc: string
}

type CertificatesSectionProps = {
  metrics?: Metric[]
  features?: Feature[]
  tiers?: Tier[]
}

const DEFAULT_METRICS: Metric[] = [
  { value: 6600, suffix: '+', label: 'Certificates issued' },
  { value: 98, suffix: '%', label: 'Recognition rate' },
  { value: 50, suffix: '+', label: 'Partner networks' },
]

const DEFAULT_FEATURES: Feature[] = [
  {
    icon: 'award',
    title: 'Verified Credentials',
    description: 'Blockchain-verified certificates recognized across the syndicate network and industry partners.',
  },
  {
    icon: 'shield',
    title: 'Secure & Tamper-Proof',
    description: 'Each certificate is cryptographically signed and permanently stored. No forgeries, no doubts.',
  },
  {
    icon: 'check',
    title: 'Industry Recognition',
    description: 'Our certifications are valued by employers and partners. Stand out with credentials that matter.',
  },
]

const DEFAULT_TIERS: Tier[] = [
  { name: 'Bronze', color: '#cd7f32', desc: 'Course completion' },
  { name: 'Silver', color: '#c0c0c0', desc: 'Excellence in projects' },
  { name: 'Gold', color: '#d4af37', desc: 'Mastery certification' },
]

function AnimatedCounter({ value, suffix, inView }: { value: number; suffix: string; inView: boolean }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView) return
    const duration = 1500
    const steps = 30
    const step = value / steps
    let current = 0
    const timer = setInterval(() => {
      current += step
      if (current >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [inView, value])

  return (
    <span className="tabular-nums font-sans font-bold">
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}

function FeatureIcon({ icon }: { icon: Feature['icon'] }) {
  if (icon === 'award') return <Award className="h-7 w-7 text-cyan-300" style={{ filter: 'drop-shadow(0 0 7px rgba(34,211,238,0.88))' }} />
  if (icon === 'shield') return <Shield className="h-7 w-7 text-fuchsia-300" style={{ filter: 'drop-shadow(0 0 7px rgba(232,121,249,0.85))' }} />
  return <CheckCircle2 className="h-7 w-7 text-violet-300" style={{ filter: 'drop-shadow(0 0 7px rgba(167,139,250,0.85))' }} />
}

export default function CertificatesSection({
  metrics = DEFAULT_METRICS,
  features = DEFAULT_FEATURES,
  tiers = DEFAULT_TIERS,
}: CertificatesSectionProps) {
  const statsRef = useRef<HTMLDivElement>(null)
  const statsInView = useInView(statsRef, { once: true, amount: 0.3 })

  return (
    <section
      id="certificates"
      aria-label="Certificates section"
      className="relative min-h-[100dvh] w-full overflow-hidden px-4 py-12 sm:px-6 sm:py-16 md:py-20"
    >
      <div className="pointer-events-none absolute inset-0">
        <Image src="/assets/c.gif" alt="" aria-hidden fill sizes="100vw" className="object-cover opacity-30" unoptimized />
        <div className="absolute inset-0 bg-black/70" />
      </div>
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[900px] -translate-x-1/2 -translate-y-1/2 blur-[140px] opacity-70"
        style={{
          background: 'radial-gradient(ellipse 80% 70%, rgba(34,211,238,0.2) 0%, rgba(167,139,250,0.14) 45%, transparent 72%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(34,211,238,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.22) 1px, transparent 1px), linear-gradient(rgba(167,139,250,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.16) 1px, transparent 1px)',
          backgroundSize: '80px 80px, 80px 80px, 20px 20px, 20px 20px',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.4) 2px, rgba(0,0,0,0.4) 4px)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 90% 80% at 50% 50%, transparent 50%, rgba(0,0,0,0.7) 100%), linear-gradient(180deg, rgba(34,211,238,0.05) 0%, transparent 20%, transparent 80%, rgba(167,139,250,0.06) 100%)',
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <h2
            className="text-3xl font-bold tracking-wider sm:text-4xl md:text-5xl lg:text-6xl"
            style={{
              color: '#dbeafe',
              textShadow: '0 0 30px rgba(34,211,238,0.45), 0 0 60px rgba(167,139,250,0.26), 0 0 4px rgba(232,121,249,0.6), 0 2px 4px rgba(0,0,0,0.5)',
            }}
          >
            WE ALSO GIVE CERTIFICATES
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-200/80 sm:text-base" style={{ textShadow: '0 0 12px rgba(34,211,238,0.14)' }}>
            Complete our courses and earn verified credentials that elevate your profile. Join leaders who prove their expertise.
          </p>
        </motion.header>

        <motion.div
          ref={statsRef}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16 grid grid-cols-1 gap-6 sm:grid-cols-3"
        >
          {metrics.map((stat, i) => (
            <div
              key={i}
              className="border p-6 text-center backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1 [clip-path:polygon(12px_0,calc(100%-12px)_0,100%_12px,100%_calc(100%-12px),calc(100%-12px)_100%,12px_100%,0_calc(100%-12px),0_12px)]"
              style={{
                borderColor: 'rgba(34,211,238,0.42)',
                background: 'rgba(5,8,18,0.72)',
                boxShadow:
                  'inset 0 0 0 1px rgba(167,139,250,0.16), 0 0 44px rgba(34,211,238,0.28), 0 0 86px rgba(217,70,239,0.2), 0 8px 32px rgba(0,0,0,0.55)',
              }}
            >
              <div className="text-3xl font-bold sm:text-4xl font-sans tabular-nums" style={{ color: '#7dd3fc', textShadow: '0 0 20px rgba(34,211,238,0.62), 0 0 4px rgba(167,139,250,0.82)' }}>
                <AnimatedCounter value={stat.value} suffix={stat.suffix} inView={statsInView} />
              </div>
              <div className="mt-1 text-sm tracking-wider" style={{ color: 'rgba(226,232,240,0.8)' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5"
          >
            <div
              className="border p-6 sm:p-8 [clip-path:polygon(14px_0,calc(100%-14px)_0,100%_14px,100%_calc(100%-14px),calc(100%-14px)_100%,14px_100%,0_calc(100%-14px),0_14px)]"
              style={{
                borderColor: 'rgba(34,211,238,0.5)',
                background: 'linear-gradient(145deg, rgba(8,10,26,0.94) 0%, rgba(4,4,12,0.98) 100%)',
                boxShadow:
                  'inset 0 0 0 1px rgba(167,139,250,0.2), 0 0 66px rgba(34,211,238,0.3), 0 0 112px rgba(236,72,153,0.2)',
              }}
            >
              <div
                className="relative aspect-[4/3] overflow-hidden bg-[#050510] [clip-path:polygon(12px_0,calc(100%-12px)_0,100%_12px,100%_calc(100%-12px),calc(100%-12px)_100%,12px_100%,0_calc(100%-12px),0_12px)]"
                style={{ border: '1px solid rgba(34,211,238,0.35)', boxShadow: 'inset 0 0 40px rgba(167,139,250,0.12), 0 0 30px rgba(34,211,238,0.15)' }}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <div
                    className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2"
                    style={{ borderColor: '#22d3ee', boxShadow: '0 0 30px rgba(34,211,238,0.5), inset 0 0 20px rgba(167,139,250,0.2)' }}
                  >
                    <Award className="h-8 w-8 text-cyan-300" style={{ filter: 'drop-shadow(0 0 8px rgba(34,211,238,0.88))' }} />
                  </div>
                  <div className="text-lg font-bold tracking-wider sm:text-xl" style={{ color: '#e2e8f0', textShadow: '0 0 20px rgba(34,211,238,0.45), 0 0 4px rgba(167,139,250,0.7)' }}>
                    SYNDICATE CERTIFIED
                  </div>
                  <div className="mt-2 text-xs tracking-[0.2em]" style={{ color: 'rgba(196,181,253,0.9)' }}>
                    CERTIFICATE OF COMPLETION
                  </div>
                  <div className="mt-4 h-px w-full max-w-[120px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-70" />
                  <div className="mt-2 text-[10px]" style={{ color: 'rgba(167,139,250,0.86)' }}>
                    VERIFY: nexus.syndicate/verify
                  </div>
                </div>
                <div
                  className="pointer-events-none absolute inset-0 opacity-30"
                  style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.12) 0%, transparent 50%, rgba(167,139,250,0.1) 100%)' }}
                />
              </div>

              <button
                type="button"
                aria-label="Download sample certificate"
                className="mt-6 flex w-full items-center justify-center gap-2 border-2 py-3 text-sm tracking-wider text-cyan-300 transition-all duration-300 hover:-translate-y-0.5 hover:bg-cyan-300/12 hover:text-cyan-100 [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)]"
                style={{
                  borderColor: 'rgba(34,211,238,0.58)',
                  textShadow: '0 0 12px rgba(34,211,238,0.52)',
                  boxShadow: '0 0 30px rgba(34,211,238,0.34), 0 0 56px rgba(167,139,250,0.24)',
                }}
              >
                <Download className="h-4 w-4" />
                Download Sample
              </button>
            </div>
          </motion.div>

          <div className="space-y-6 lg:col-span-7">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.1 }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="relative overflow-hidden px-[1px] py-[1px] [clip-path:polygon(12px_0,calc(100%-12px)_0,100%_12px,100%_calc(100%-12px),calc(100%-12px)_100%,12px_100%,0_calc(100%-12px),0_12px)]"
                style={{
                  background: 'linear-gradient(135deg, rgba(34,211,238,0.92), rgba(167,139,250,0.78), rgba(236,72,153,0.84))',
                  boxShadow: '0 0 34px rgba(34,211,238,0.42), 0 0 62px rgba(167,139,250,0.3), 0 0 98px rgba(236,72,153,0.2)',
                }}
              >
                <div
                  className="relative flex items-start gap-4 bg-gradient-to-br from-black/90 via-[#050314]/95 to-black/90 p-6 [clip-path:polygon(12px_0,calc(100%-12px)_0,100%_12px,100%_calc(100%-12px),calc(100%-12px)_100%,12px_100%,0_calc(100%-12px),0_12px)] sm:gap-6 sm:p-8"
                  style={{ boxShadow: 'inset 0 0 0 1px rgba(10,10,30,0.9), 0 12px 30px rgba(0,0,0,0.9)' }}
                >
                  <div
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center border-2 sm:h-14 sm:w-14 [clip-path:polygon(9px_0,calc(100%-9px)_0,100%_9px,100%_calc(100%-9px),calc(100%-9px)_100%,9px_100%,0_calc(100%-9px),0_9px)]"
                    style={{ borderColor: 'rgba(34,211,238,0.7)', boxShadow: '0 0 24px rgba(167,139,250,0.42), inset 0 0 12px rgba(34,211,238,0.16)' }}
                  >
                    <FeatureIcon icon={feature.icon} />
                  </div>
                  <div>
                    <h3 className="mb-2 text-lg font-semibold tracking-wider text-slate-100 sm:text-xl" style={{ textShadow: '0 0 14px rgba(34,211,238,0.34), 0 0 4px rgba(0,0,0,0.9)' }}>
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-200/80 sm:text-base">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-16"
        >
          <h3 className="mb-6 text-center text-sm font-semibold uppercase tracking-[0.25em]" style={{ color: 'rgba(196,181,253,0.92)', textShadow: '0 0 16px rgba(34,211,238,0.3)' }}>
            {'> CERTIFICATE TIERS'}
          </h3>
          <div className="flex flex-col justify-center gap-4 sm:flex-row sm:gap-6">
            {tiers.map((tier, i) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="relative overflow-hidden px-[1px] py-[1px] [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)]"
                style={{
                  background: 'linear-gradient(135deg, rgba(34,211,238,0.92), rgba(167,139,250,0.76), rgba(236,72,153,0.84))',
                  boxShadow: '0 0 34px rgba(34,211,238,0.42), 0 0 62px rgba(167,139,250,0.3), 0 0 98px rgba(236,72,153,0.2)',
                }}
              >
                <div
                  className="relative flex items-center gap-4 bg-gradient-to-br from-black/90 via-[#050314]/95 to-black/90 p-4 [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)]"
                  style={{ boxShadow: 'inset 0 0 0 1px rgba(10,10,30,0.9), 0 12px 30px rgba(0,0,0,0.9)' }}
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold"
                    style={{
                      backgroundColor: `${tier.color}25`,
                      border: `2px solid ${tier.color}`,
                      color: tier.color,
                      boxShadow: `0 0 22px ${tier.color}55`,
                    }}
                  >
                    {tier.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold tracking-wider text-slate-100" style={{ textShadow: '0 0 14px rgba(34,211,238,0.35), 0 0 4px rgba(0,0,0,0.9)' }}>
                      {tier.name}
                    </div>
                    <div className="text-xs" style={{ color: 'rgba(196,181,253,0.88)' }}>
                      {tier.desc}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
