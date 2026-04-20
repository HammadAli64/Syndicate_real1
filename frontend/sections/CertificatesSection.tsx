'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Award, CheckCircle2, Download, Shield } from 'lucide-react'
import ElectricBorder from '@/components/ui/electric-border'

const CERTIFICATE_FEATURES = [
  {
    icon: Award,
    title: 'Verified Credentials',
    description: 'Blockchain-verified certificates recognized across the syndicate network and industry partners.',
  },
  {
    icon: Shield,
    title: 'Secure & Tamper-Proof',
    description: 'Each certificate is cryptographically signed and permanently stored. No forgeries, no doubts.',
  },
  {
    icon: CheckCircle2,
    title: 'Industry Recognition',
    description: 'Our certifications are valued by employers and partners. Stand out with credentials that matter.',
  },
]

const STATS = [
  { value: 12400, suffix: '+', label: 'Certificates issued' },
  { value: 98, suffix: '%', label: 'Recognition rate' },
  { value: 50, suffix: '+', label: 'Partner networks' },
]

function AnimatedCounter({ value, suffix, inView }: { value: number; suffix: string; inView: boolean }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView) return

    const duration = 1500
    const steps = 30
    const step = value / steps
    let current = 0

    const timer = window.setInterval(() => {
      current += step
      if (current >= value) {
        setCount(value)
        window.clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)

    return () => window.clearInterval(timer)
  }, [inView, value])

  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}

export default function CertificatesSection() {
  const statsRef = useRef<HTMLDivElement>(null)
  const statsInView = useInView(statsRef, { once: true, amount: 0.3 })

  return (
    <section
      id="certificates"
      className="relative overflow-hidden px-4 py-12 sm:px-6 sm:py-16 md:py-20"
      style={{ background: 'linear-gradient(180deg, #020308 0%, #050810 40%, #030508 100%)' }}
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[900px] -translate-x-1/2 -translate-y-1/2 blur-[140px]"
        style={{ background: 'radial-gradient(ellipse 80% 70%, rgba(191,0,255,0.25) 0%, rgba(0,245,255,0.12) 40%, transparent 70%)' }}
      />
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(191,0,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(191,0,255,0.4) 1px, transparent 1px), linear-gradient(rgba(0,245,255,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.25) 1px, transparent 1px)',
          backgroundSize: '80px 80px, 80px 80px, 20px 20px, 20px 20px',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.4) 2px, rgba(0,0,0,0.4) 4px)' }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 90% 80% at 50% 50%, transparent 50%, rgba(0,0,0,0.6) 100%), linear-gradient(180deg, rgba(191,0,255,0.04) 0%, transparent 20%, transparent 80%, rgba(0,245,255,0.04) 100%)' }}
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <span className="mb-3 block text-xs uppercase tracking-[0.35em]" style={{ color: '#00f5ff', textShadow: '0 0 20px rgba(0,245,255,0.5), 0 0 2px rgba(0,245,255,0.8)' }}>
            {'> ACHIEVEMENT'}
          </span>
          <h2
            className="text-3xl font-bold tracking-wider sm:text-4xl md:text-5xl lg:text-6xl"
            style={{ color: '#e8d4ff', textShadow: '0 0 30px rgba(191,0,255,0.6), 0 0 60px rgba(191,0,255,0.3), 0 0 4px rgba(191,0,255,0.8), 0 2px 4px rgba(0,0,0,0.5)' }}
          >
            WE ALSO GIVE CERTIFICATES
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-zinc-400 sm:text-base" style={{ textShadow: '0 0 12px rgba(0,245,255,0.15)' }}>
            Complete our courses and earn verified credentials that elevate your profile. Join leaders who prove their expertise.
          </p>
        </motion.div>

        <motion.div
          ref={statsRef}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16 grid grid-cols-1 gap-6 sm:grid-cols-3"
        >
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border p-6 text-center backdrop-blur-sm"
              style={{ borderColor: 'rgba(191,0,255,0.25)', background: 'rgba(5,5,15,0.7)', boxShadow: 'inset 0 0 0 1px rgba(0,245,255,0.08), 0 0 40px rgba(191,0,255,0.15), 0 8px 32px rgba(0,0,0,0.5)' }}
            >
              <div className="text-3xl font-bold sm:text-4xl" style={{ color: '#00f5ff', textShadow: '0 0 20px rgba(0,245,255,0.6), 0 0 4px rgba(0,245,255,0.8)' }}>
                <AnimatedCounter value={stat.value} suffix={stat.suffix} inView={statsInView} />
              </div>
              <div className="mt-1 text-sm tracking-wider" style={{ color: 'rgba(200,220,255,0.7)' }}>
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
            <ElectricBorder
              color="#bf00ff"
              speed={0.8}
              chaos={0.08}
              borderRadius={20}
              style={{ borderRadius: 20, background: 'linear-gradient(145deg, rgba(10,5,20,0.95) 0%, rgba(2,2,8,0.98) 100%)', boxShadow: 'inset 0 0 0 1px rgba(191,0,255,0.15), 0 0 60px rgba(191,0,255,0.2)' }}
            >
              <div className="p-6 sm:p-8">
                <div
                  className="relative aspect-[4/3] overflow-hidden rounded-lg bg-[#050510]"
                  style={{ border: '1px solid rgba(191,0,255,0.3)', boxShadow: 'inset 0 0 40px rgba(191,0,255,0.08), 0 0 30px rgba(0,245,255,0.1)' }}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2" style={{ borderColor: '#bf00ff', boxShadow: '0 0 30px rgba(191,0,255,0.5), inset 0 0 20px rgba(191,0,255,0.2)' }}>
                      <Award className="h-8 w-8 text-[#bf00ff]" style={{ filter: 'drop-shadow(0 0 8px rgba(191,0,255,0.8))' }} />
                    </div>
                    <div className="text-lg font-bold tracking-wider text-[#e8d4ff] sm:text-xl" style={{ textShadow: '0 0 20px rgba(191,0,255,0.6), 0 0 4px rgba(191,0,255,0.8)' }}>
                      SYNDICATE CERTIFIED
                    </div>
                    <div className="mt-2 text-xs tracking-[0.2em]" style={{ color: 'rgba(0,245,255,0.7)' }}>
                      CERTIFICATE OF COMPLETION
                    </div>
                    <div className="mt-4 h-px w-full max-w-[120px] bg-gradient-to-r from-transparent via-[#bf00ff] to-transparent opacity-70" />
                    <div className="mt-2 text-[10px]" style={{ color: 'rgba(0,245,255,0.5)' }}>
                      VERIFY: nexus.syndicate/verify
                    </div>
                  </div>
                  <div className="pointer-events-none absolute inset-0 opacity-30" style={{ background: 'linear-gradient(135deg, rgba(191,0,255,0.12) 0%, transparent 50%, rgba(0,245,255,0.08) 100%)' }} />
                </div>
                <button
                  type="button"
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border-2 py-3 text-sm font-medium tracking-wider transition-all hover:bg-[rgba(191,0,255,0.2)] hover:text-white"
                  style={{ borderColor: 'rgba(191,0,255,0.5)', color: '#bf00ff', textShadow: '0 0 12px rgba(191,0,255,0.5)', boxShadow: '0 0 24px rgba(191,0,255,0.2)' }}
                >
                  <Download className="h-4 w-4" />
                  Download Sample
                </button>
              </div>
            </ElectricBorder>
          </motion.div>

          <div className="space-y-6 lg:col-span-7">
            {CERTIFICATE_FEATURES.map(({ icon: Icon, title, description }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.1 }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="relative overflow-hidden rounded-2xl px-[1px] py-[1px]"
                style={{ background: 'linear-gradient(135deg, rgba(191,0,255,0.9), rgba(0,245,255,0.7), rgba(191,0,255,0.9))', boxShadow: '0 0 26px rgba(191,0,255,0.4), 0 0 40px rgba(0,245,255,0.22)' }}
              >
                <div className="relative flex items-start gap-4 rounded-2xl bg-gradient-to-br from-black/90 via-[#050314]/95 to-black/90 p-6 sm:gap-6 sm:p-8" style={{ boxShadow: 'inset 0 0 0 1px rgba(10,10,30,0.9), 0 12px 30px rgba(0,0,0,0.9)' }}>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 sm:h-14 sm:w-14" style={{ borderColor: 'rgba(0,245,255,0.6)', boxShadow: '0 0 24px rgba(0,245,255,0.4), inset 0 0 12px rgba(0,245,255,0.1)' }}>
                    <Icon className="h-6 w-6 text-[#00f5ff] sm:h-7 sm:w-7" style={{ filter: 'drop-shadow(0 0 6px rgba(0,245,255,0.8))' }} />
                  </div>
                  <div>
                    <h3 className="mb-2 text-lg font-semibold tracking-wider text-[#e8d4ff] sm:text-xl" style={{ textShadow: '0 0 14px rgba(191,0,255,0.4), 0 0 4px rgba(0,0,0,0.9)' }}>
                      {title}
                    </h3>
                    <p className="text-sm leading-relaxed sm:text-base" style={{ color: 'rgba(200,220,255,0.85)' }}>
                      {description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
