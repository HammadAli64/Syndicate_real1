'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'framer-motion'
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
    const duration = 650
    const steps = 26
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

const buildCertificateId = () =>
  `SYN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

export default function CertificatesSection({
  metrics = DEFAULT_METRICS,
  features = DEFAULT_FEATURES,
  tiers = DEFAULT_TIERS,
}: CertificatesSectionProps) {
  const statsRef = useRef<HTMLDivElement>(null)
  const statsInView = useInView(statsRef, { once: true, amount: 0.3 })
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [certificateId, setCertificateId] = useState(() => buildCertificateId())
  const [issuedOn, setIssuedOn] = useState(() =>
    new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
  )
  const verifyUrl = `https://nexus.syndicate/verify?certificate=${encodeURIComponent(certificateId)}`

  const openPreview = () => {
    setCertificateId(buildCertificateId())
    setIssuedOn(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }))
    setIsPreviewOpen(true)
  }

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
          initial={false}
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
          initial={false}
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
            initial={false}
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
              <button
                type="button"
                onClick={openPreview}
                aria-label="Open Syndicate certificate preview"
                className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-[#050510] [clip-path:polygon(12px_0,calc(100%-12px)_0,100%_12px,100%_calc(100%-12px),calc(100%-12px)_100%,12px_100%,0_calc(100%-12px),0_12px)]"
                style={{ border: '1px solid rgba(34,211,238,0.35)', boxShadow: 'inset 0 0 40px rgba(167,139,250,0.12), 0 0 30px rgba(34,211,238,0.15)' }}
              >
                <div className="relative z-[2] flex w-full flex-col items-center justify-center p-6 text-center">
                  <div
                    className="mb-6 flex h-32 w-32 items-center justify-center rounded-full"
                    style={{ background: 'transparent', boxShadow: 'none' }}
                  >
                    <div className="pointer-events-none absolute h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(253,208,47,0.42)_0%,rgba(253,208,47,0.18)_42%,transparent_75%)] blur-[14px] sm:h-36 sm:w-36" />
                    <Award
                      className="h-20 w-20 text-cyan-200 sm:h-24 sm:w-24"
                      strokeWidth={2.2}
                      style={{ filter: 'drop-shadow(0 0 14px rgba(34,211,238,0.95))' }}
                    />
                  </div>
                  <div className="w-full max-w-[420px]">
                    <div className="mt-1 flex w-full items-center justify-center gap-2 border-2 py-3 text-sm tracking-wider text-cyan-300 [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)]"
                      style={{
                        borderColor: 'rgba(34,211,238,0.58)',
                        textShadow: '0 0 12px rgba(34,211,238,0.52)',
                        boxShadow: '0 0 30px rgba(34,211,238,0.24)',
                        background: 'rgba(8,20,32,0.22)',
                      }}
                    >
                      <Download className="h-4 w-4" />
                      Preview Sample
                    </div>
                  </div>
                </div>
                <div
                  className="pointer-events-none absolute inset-0 z-[1] opacity-30"
                  style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.12) 0%, transparent 50%, rgba(167,139,250,0.1) 100%)' }}
                />
              </button>
            </div>
          </motion.div>

          <div className="space-y-6 lg:col-span-7">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={false}
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
          initial={false}
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
                initial={false}
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
      <AnimatePresence>
        {isPreviewOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-transparent p-4 backdrop-blur-sm"
            onClick={() => setIsPreviewOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.28 }}
              onClick={(event) => event.stopPropagation()}
              className="relative max-h-[95vh] w-full max-w-[980px] overflow-y-auto bg-transparent p-1 sm:p-2"
              style={{
                boxShadow: '0 0 90px rgba(217,70,239,0.25), 0 0 130px rgba(56,189,248,0.18)',
              }}
            >
              <div className="pointer-events-none absolute inset-0 opacity-[0.16]" style={{ backgroundImage: 'linear-gradient(rgba(217,70,239,0.24) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.24) 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
              <div className="pointer-events-none absolute inset-0 opacity-[0.22]" style={{ background: 'radial-gradient(circle at 24% 12%, rgba(217,70,239,0.26), transparent 42%), radial-gradient(circle at 80% 86%, rgba(56,189,248,0.18), transparent 46%)' }} />

              <div className="relative mx-auto w-full max-w-[760px] overflow-hidden rounded-[22px] border border-cyan-200/90 bg-[#070a1a] p-3 sm:p-5 shadow-[0_0_24px_rgba(56,189,248,0.6),0_0_70px_rgba(56,189,248,0.38),0_0_110px_rgba(217,70,239,0.3)]">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(59,130,246,0.45),transparent_34%),radial-gradient(circle_at_80%_22%,rgba(249,115,22,0.22),transparent_35%),radial-gradient(circle_at_20%_78%,rgba(236,72,153,0.2),transparent_38%),linear-gradient(180deg,#070a1a_0%,#0c1130_45%,#111735_100%)]" />
                <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(255,255,255,0.32)_1px,transparent_1px)] [background-size:4px_4px]" />
                <div className="pointer-events-none absolute inset-[8px] rounded-[18px] border border-cyan-200/95 shadow-[0_0_20px_rgba(56,189,248,0.85),0_0_52px_rgba(56,189,248,0.62),0_0_90px_rgba(217,70,239,0.35)]" />
                <div className="pointer-events-none absolute inset-[18px] rounded-[12px] border border-cyan-300/75 shadow-[inset_0_0_16px_rgba(56,189,248,0.25)]" />
                <div className="pointer-events-none absolute left-[20px] top-[20px] h-12 w-12 border-l-2 border-t-2 border-red-400/90" />
                <div className="pointer-events-none absolute right-[20px] top-[20px] h-12 w-12 border-r-2 border-t-2 border-red-400/90" />
                <div className="pointer-events-none absolute bottom-[20px] left-[20px] h-12 w-12 border-b-2 border-l-2 border-red-400/90" />
                <div className="pointer-events-none absolute bottom-[20px] right-[20px] h-12 w-12 border-b-2 border-r-2 border-red-400/90" />

                <div className="relative z-10 flex flex-col px-2 pb-2 pt-3 text-cyan-100 sm:px-3 sm:pb-3 sm:pt-4">
                  <div className="mt-2 ml-2 flex flex-wrap items-center gap-4 sm:mt-3 sm:ml-8 sm:gap-6">
                    <Image
                      src="/assets/logo.webp"
                      alt="Syndicate logo"
                      width={150}
                      height={75}
                      className="h-auto w-[88px] object-contain brightness-125 contrast-125 sm:w-[130px]"
                      priority={false}
                    />
                    <div className="pl-1 sm:pl-2">
                      <p className="text-[9px] uppercase tracking-[0.14em] text-[#fdd02f] sm:text-[13px] sm:tracking-[0.2em]">Money · Power · Honour · Freedom</p>
                    </div>
                  </div>

                  <div className="mt-2 text-center sm:mt-3">
                    <h2 className="mt-1 text-[28px] font-semibold uppercase leading-[0.95] tracking-[0.04em] text-cyan-100 sm:text-[42px] sm:tracking-[0.06em]" style={{ textShadow: '0 0 18px rgba(56,189,248,0.95), 0 0 30px rgba(249,115,22,0.45)' }}>
                      SYN TOKEN
                    </h2>
                    <p className="mt-0.5 text-[9px] uppercase tracking-[0.22em] text-cyan-100/85 sm:mt-1 sm:text-[11px] sm:tracking-[0.3em]">of Achievement</p>
                  </div>

                  <div className="mt-3 rounded-xl border border-fuchsia-300/55 bg-cyan-400/5 p-2.5 shadow-[0_0_18px_rgba(56,189,248,0.24)] sm:mt-4 sm:p-4 [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)]">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-100/80">Token Owner</p>
                    <h3 className="mt-1 text-[36px] font-semibold uppercase tracking-[0.04em] text-[#fdd02f] sm:text-4xl sm:tracking-[0.08em]" style={{ textShadow: '0 0 16px rgba(253,208,47,0.45)' }}>
                      Ayaan Sterling
                    </h3>
                    <p className="mt-1.5 text-[11px] uppercase tracking-[0.1em] text-cyan-100/75 sm:mt-2 sm:text-[13px] sm:tracking-[0.18em]">AI Automations & Digital Mastery</p>
                  </div>

                  <div className="mt-3 rounded-lg border border-fuchsia-300/45 bg-black/20 px-3 py-2.5 sm:px-4 sm:py-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-cyan-100/75 sm:text-[12px]">Credential Overview</p>
                    <p className="mt-1.5 text-[14px] leading-relaxed text-cyan-50/95 sm:mt-2 sm:text-[16px]">
                      Awarded for high-performance completion of the AI Automations & Digital Mastery track with verified execution milestones,
                      strategic delivery consistency, and secure credential validation through the Syndicate token registry.
                      This token confirms advanced operational readiness in automation systems, precision execution, and performance accountability.
                      Holder authorization is recognized across Syndicate partner ecosystems for verified digital capability.
                    </p>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] sm:mt-4 sm:text-[11px]">
                    <div className="rounded-lg border border-fuchsia-300/45 bg-black/25 p-2 shadow-[0_0_10px_rgba(56,189,248,0.2)]">
                      <p className="uppercase tracking-[0.15em] text-cyan-100/70">Issued</p>
                      <p className="mt-1 text-cyan-100">{issuedOn}</p>
                    </div>
                    <div className="rounded-lg border border-fuchsia-300/45 bg-black/25 p-2 shadow-[0_0_10px_rgba(132,204,22,0.18)]">
                      <p className="uppercase tracking-[0.15em] text-cyan-100/70">Status</p>
                      <p className="mt-1 font-semibold text-lime-300 drop-shadow-[0_0_8px_rgba(132,204,22,0.6)]">Verified</p>
                    </div>
                    <div className="col-span-2 rounded-lg border border-fuchsia-300/55 bg-black/35 p-2 font-mono shadow-[0_0_12px_rgba(56,189,248,0.28)]">
                      <p className="uppercase tracking-[0.15em] text-cyan-100/70">Token ID</p>
                      <p className="mt-1 text-[13px] font-semibold tracking-[0.06em] text-cyan-50 sm:text-[15px]">{certificateId}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col items-center justify-center pb-2 sm:mt-5 sm:pb-3">
                    <div className="relative flex h-28 w-28 items-center justify-center rounded-full sm:h-44 sm:w-44">
                      <div className="pointer-events-none absolute h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(253,208,47,0.42)_0%,rgba(253,208,47,0.18)_42%,transparent_75%)] blur-[16px] sm:h-44 sm:w-44" />
                      <Image
                        src="/assets/coin-gold.png"
                        alt="Gold key certificate icon"
                        width={380}
                        height={380}
                        className="h-32 w-32 object-contain sm:h-44 sm:w-44"
                      />
                    </div>
                    <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-cyan-100/80 sm:tracking-[0.24em]">Syndicate Credential Token</p>
                    <div className="mt-2 h-[2px] w-40 rounded-full bg-cyan-300/75 blur-[0.5px]" />
                  </div>

                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  )
}
