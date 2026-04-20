'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import styles from './SyndicateWordmark.module.css'

const LEFT = 'THE'.split('')
const RIGHT = 'SYNDICATE'.split('')

export default function SyndicateWordmark() {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [visibleCount, setVisibleCount] = useState(0)
  const rafRef = useRef<number | null>(null)
  const totalLetters = Math.max(LEFT.length, RIGHT.length)
  const codeRows = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        id: i,
        text: '010111 0xAF // SYS::SYNC VECTOR NODE GRID SIGNAL NEON PROTOCOL '.repeat(2),
        top: 14 + i * 14,
        duration: 16 + i * 2.2,
        delay: i * -1.2,
      })),
    [],
  )

  useEffect(() => {
    if (prefersReducedMotion) return
    const start = performance.now()
    const durationMs = 860
    let lastDrawnCount = -1

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      const next = Math.min(totalLetters, Math.floor(eased * totalLetters + 0.0001))
      if (next !== lastDrawnCount) {
        lastDrawnCount = next
        setVisibleCount(next)
      }
      if (t < 1) rafRef.current = window.requestAnimationFrame(tick)
    }
    rafRef.current = window.requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current)
    }
  }, [prefersReducedMotion, totalLetters])

  const resolvedVisibleCount = prefersReducedMotion ? totalLetters : visibleCount
  const done = resolvedVisibleCount >= totalLetters

  return (
    <section className={styles.wrap} aria-label="The Syndicate wordmark">
      <div className={styles.glow} />
      <div className={styles.scanline} />
      <div className={styles.codeRain} aria-hidden>
        {codeRows.map((row) => (
          <div
            key={row.id}
            className={styles.codeRow}
            style={{ top: `${row.top}%`, animationDuration: `${row.duration}s`, animationDelay: `${row.delay}s` }}
          >
            {row.text}
          </div>
        ))}
      </div>
      <div className={`${styles.wordmark} ${done ? styles.afterTypeGlow : ''}`}>
        <div className={styles.word}>
          {LEFT.map((char, i) => (
            <span key={`left-${char}-${i}`} className={`${styles.letter} ${i < resolvedVisibleCount ? styles.letterVisible : ''}`}>
              {char}
            </span>
          ))}
        </div>
        <div className={styles.word}>
          {RIGHT.map((char, i) => (
            <span key={`right-${char}-${i}`} className={`${styles.letter} ${i < resolvedVisibleCount ? styles.letterVisible : ''}`}>
              {char}
            </span>
          ))}
        </div>
      </div>
      <p className={styles.subtext}>An exclusive membership</p>
      <div className={styles.shimmerPass} aria-hidden />
    </section>
  )
}
