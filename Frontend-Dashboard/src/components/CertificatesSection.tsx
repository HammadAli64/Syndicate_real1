'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { Award, CheckCircle2, Download, Shield } from 'lucide-react'
import Image from 'next/image'
import { QRCodeSVG } from 'qrcode.react'

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
                    className="mb-6 flex h-32 w-32 items-center justify-center rounded-full border-2"
                    style={{ borderColor: '#22d3ee', background: 'rgba(3, 15, 26, 0.75)', boxShadow: '0 0 42px rgba(34,211,238,0.58), inset 0 0 28px rgba(167,139,250,0.24)' }}
                  >
                    <Award className="h-16 w-16 text-cyan-200" strokeWidth={2.2} style={{ filter: 'drop-shadow(0 0 14px rgba(34,211,238,0.95))' }} />
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
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() => setIsPreviewOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.28 }}
              onClick={(event) => event.stopPropagation()}
              className="relative w-full max-w-5xl overflow-hidden border border-red-500/40 bg-[#1f232f] p-3 sm:p-6"
              style={{
                boxShadow:
                  '0 0 0 1px rgba(239,68,68,0.25), 0 0 90px rgba(239,68,68,0.22), 0 0 140px rgba(220,38,38,0.18), inset 0 0 70px rgba(220,38,38,0.08)',
                clipPath: 'polygon(18px 0, calc(100% - 18px) 0, 100% 18px, 100% calc(100% - 18px), calc(100% - 18px) 100%, 18px 100%, 0 calc(100% - 18px), 0 18px)',
              }}
            >
              <div className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'linear-gradient(rgba(239,68,68,0.28) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.28) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              <div className="pointer-events-none absolute inset-0 opacity-[0.2]" style={{ background: 'radial-gradient(circle at 20% 10%, rgba(239,68,68,0.32), transparent 40%), radial-gradient(circle at 80% 90%, rgba(156,163,175,0.18), transparent 44%)' }} />

              <div className="relative flex min-h-[560px] flex-col overflow-hidden border border-red-300/35 bg-[#1f232f] p-5 sm:min-h-[640px] sm:p-8">
                <div className="pointer-events-none absolute left-0 top-0 h-0 w-0 border-l-[140px] border-t-[110px] border-l-red-600/80 border-t-transparent sm:border-l-[220px] sm:border-t-[170px]" />
                <div className="pointer-events-none absolute right-0 top-0 h-0 w-0 border-r-[140px] border-t-[110px] border-r-red-600/80 border-t-transparent sm:border-r-[220px] sm:border-t-[170px]" />
                <div className="pointer-events-none absolute bottom-0 left-0 h-0 w-0 border-b-[90px] border-l-[110px] border-b-red-600/70 border-l-transparent sm:border-b-[130px] sm:border-l-[170px]" />
                <div className="pointer-events-none absolute bottom-0 right-0 h-0 w-0 border-b-[90px] border-r-[110px] border-b-red-600/70 border-r-transparent sm:border-b-[130px] sm:border-r-[170px]" />

                <div className="relative flex items-start justify-center gap-4">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Image
                      src="/assets/logo.webp"
                      alt="Syndicate logo"
                      width={180}
                      height={88}
                      className="h-auto w-[120px] object-contain brightness-125 contrast-125 sm:w-[160px]"
                      priority={false}
                    />
                    <p
                      className="text-[10px] font-semibold uppercase tracking-[0.28em] sm:text-xs"
                      style={{ color: '#f2c830', textShadow: '0 0 10px rgba(242,200,48,0.25)' }}
                    >
                      Money · Power · Honour · Freedom
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPreviewOpen(false)}
                    className="absolute right-0 top-0 border border-red-300/55 px-3 py-1 text-xs uppercase tracking-[0.2em] text-red-100 transition hover:bg-red-400/10"
                  >
                    Close
                  </button>
                </div>

                <div className="relative mt-5 text-center">
                  <div className="mx-auto w-full max-w-[760px]">
                    <h3
                      className="text-3xl font-bold uppercase tracking-[0.05em] text-[#f3e5cc] sm:text-5xl"
                      style={{ fontFamily: 'Georgia, Times New Roman, serif', textShadow: '0 0 1px rgba(243,229,204,0.75)' }}
                    >
                      Certificate
                    </h3>
                    <p
                      className="mt-1 text-xl font-semibold normal-case text-[#d6b27a] sm:text-2xl"
                      style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
                    >
                      of achievement
                    </p>
                    <div className="mt-3 flex items-center justify-center gap-4">
                      <span className="h-px w-20 bg-gradient-to-r from-transparent to-[#d6b27a]/80 sm:w-28" />
                      <span className="text-sm text-[#d6b27a]/90">✦</span>
                      <span className="h-px w-20 bg-gradient-to-l from-transparent to-[#d6b27a]/80 sm:w-28" />
                    </div>
                  </div>
                  <h4
                    className="mt-7 text-3xl font-semibold uppercase tracking-[0.14em] sm:text-5xl"
                    style={{ color: '#f2c830', textShadow: '0 0 20px rgba(242,200,48,0.32)' }}
                  >
                    Ayaan Sterling
                  </h4>
                  <div className="mx-auto mt-2 h-[2px] w-[72%] max-w-xl bg-gradient-to-r from-transparent via-red-400 to-transparent" />
                  <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-white sm:text-lg">
                    Successfully completed the <span className="font-semibold text-white">AI Automations & Digital Mastery Program</span>,
                    passed advanced performance evaluation, and fulfilled strategic milestones required by The Syndicate.
                    The recipient demonstrated strong capability in AI-assisted workflow systems, automation planning,
                    execution discipline, and measurable optimization across real project simulations.
                    This credential confirms readiness for high-impact digital execution, collaborative delivery,
                    and accountable performance under direct mentor review.
                  </p>
                </div>

                <div className="mt-auto grid items-start gap-4 pt-10 sm:grid-cols-[1fr_auto]">
                  <div className="space-y-1.5 text-sm text-white sm:text-base">
                    <p><span style={{ color: '#fdd02f' }}>Track:</span> AI Automations & Digital Mastery</p>
                    <p><span style={{ color: '#fdd02f' }}>Issued on:</span> {issuedOn}</p>
                    <p className="font-mono text-sm text-white"><span style={{ color: '#fdd02f' }}>Certificate ID:</span> {certificateId}</p>
                  </div>

                  <div className="inline-flex flex-col items-center gap-1.5 self-start border border-red-300/35 p-1.5">
                    <QRCodeSVG
                      value={verifyUrl}
                      size={96}
                      bgColor="#111111"
                      fgColor="#ffffff"
                      level="H"
                      includeMargin
                    />
                    <p className="text-[10px] uppercase tracking-[0.2em] text-red-100/85">Unique QR</p>
                  </div>
                </div>

                <div className="mt-3 grid gap-4 border-t border-red-300/35 pt-4 sm:grid-cols-3 sm:items-end">
                  <div />
                  <div className="text-center">
                    <p className="text-xl font-semibold uppercase tracking-[0.12em] text-slate-100">Syndicate Award</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-red-100/80">Elite Credential</p>
                  </div>
                  <div />
                </div>

                <div className="mt-5 text-center text-[10px] uppercase tracking-[0.2em] text-red-100/75">
                  Verified credential record in Syndicate secure registry
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  )
}
