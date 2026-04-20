'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'

const PILLARS = [
  { id: 'honour', text: 'HONOUR', tone: 'red' as const },
  { id: 'money', text: 'MONEY', tone: 'pink' as const },
  { id: 'power', text: 'POWER', tone: 'blue' as const },
  { id: 'freedom', text: 'FREEDOM', tone: 'gold' as const },
]

const CHARS = '!@#$%^&*ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function shuffleStr(target: string): string {
  return target
    .split('')
    .map((char) => (char === ' ' ? ' ' : CHARS[Math.floor(Math.random() * CHARS.length)]))
    .join('')
}

type PillarTone = 'red' | 'pink' | 'blue' | 'gold'

type PillarCardProps = {
  word: string
  fromLeft: boolean
  delay?: number
  tone: PillarTone
}

function PillarCard({ word, fromLeft, delay = 0, tone }: PillarCardProps) {
  const [display, setDisplay] = useState(word)
  const intervalRef = useRef<number | null>(null)

  const runShuffle = useCallback(() => {
    let count = 0
    const max = 12

    if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
    }

    intervalRef.current = window.setInterval(() => {
      count += 1
      setDisplay(shuffleStr(word))

      if (count >= max) {
        if (intervalRef.current) {
          window.clearInterval(intervalRef.current)
        }
        intervalRef.current = null
        setDisplay(word)
      }
    }, 50)
  }, [word])

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
      }
    }
  }, [])

  const toneClass =
    tone === 'red'
      ? 'border-red-400/70 text-red-100 hover:border-red-300 hover:shadow-[0_0_28px_rgba(248,113,113,0.4)]'
      : tone === 'pink'
        ? 'border-fuchsia-400/70 text-fuchsia-100 hover:border-fuchsia-300 hover:shadow-[0_0_28px_rgba(232,121,249,0.4)]'
        : tone === 'blue'
          ? 'border-cyan-400/70 text-cyan-100 hover:border-cyan-300 hover:shadow-[0_0_28px_rgba(34,211,238,0.4)]'
          : 'border-amber-400/70 text-amber-100 hover:border-amber-300 hover:shadow-[0_0_28px_rgba(250,204,21,0.4)]'

  const electricStyle =
    tone === 'red'
      ? ({ '--eb1': '#fb7185', '--eb2': '#f43f5e', '--eb3': '#fda4af' } as CSSProperties)
      : tone === 'pink'
        ? ({ '--eb1': '#f472b6', '--eb2': '#e879f9', '--eb3': '#c084fc' } as CSSProperties)
        : tone === 'blue'
          ? ({ '--eb1': '#67e8f9', '--eb2': '#22d3ee', '--eb3': '#60a5fa' } as CSSProperties)
          : ({ '--eb1': '#a3e635', '--eb2': '#facc15', '--eb3': '#86efac' } as CSSProperties)

  return (
    <div
      onMouseEnter={runShuffle}
      style={{ animationDelay: `${delay}s`, ...electricStyle }}
      className={`pillar-electric-border group relative overflow-hidden rounded-xl bg-black/90 px-4 py-3 backdrop-blur-sm transition-all duration-300 sm:px-6 sm:py-4 hover:brightness-125 ${fromLeft ? 'animate-pillar-from-left' : 'animate-pillar-from-right'} ${toneClass}`}
    >
      <span className="relative z-10 block text-center font-mono text-base font-extrabold tracking-[0.2em] sm:text-lg sm:tracking-[0.25em] md:text-xl md:tracking-[0.3em]">
        {display}
      </span>
    </div>
  )
}

export function HeroPillars() {
  return (
    <div className="w-full rounded-2xl bg-black/35 p-3 backdrop-blur-[1px] sm:p-4 md:p-5">
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
        {PILLARS.map((pillar, index) => (
          <PillarCard
            key={pillar.id}
            word={pillar.text}
            fromLeft={index % 2 === 0}
            delay={index * 1.2}
            tone={pillar.tone}
          />
        ))}
      </div>
    </div>
  )
}
