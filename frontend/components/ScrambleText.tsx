'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type ScrambleTextProps = {
  text: string
  className?: string
  scrambleOnHover?: boolean
  /** Run scramble-resolve animation once when visible (e.g. when menu opens) */
  runOnMount?: boolean
  speedMs?: number
  charset?: string
}

function pickRandomChar(chars: string) {
  return chars[Math.floor(Math.random() * chars.length)]
}

export function ScrambleText({
  text,
  className,
  scrambleOnHover = true,
  runOnMount = false,
  speedMs = 18,
  charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
}: ScrambleTextProps) {
  const [display, setDisplay] = useState(runOnMount ? '' : text)
  const rafRef = useRef<number | null>(null)
  const activeRef = useRef(false)
  const lastStepRef = useRef(0)
  const hasRunMount = useRef(false)

  const target = useMemo(() => text, [text])

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const run = useCallback(() => {
    if (!scrambleOnHover && !runOnMount) return
    activeRef.current = true
    lastStepRef.current = 0

    const start = performance.now()
    const duration = Math.min(850, 250 + target.length * 35)

    const tick = (now: number) => {
      if (!activeRef.current) return
      if (lastStepRef.current && now - lastStepRef.current < speedMs) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }
      lastStepRef.current = now

      const t = Math.min(1, (now - start) / duration)
      const resolvedCount = Math.floor(t * target.length)

      const next =
        target.slice(0, resolvedCount) +
        target
          .slice(resolvedCount)
          .split('')
          .map((ch) => (ch === ' ' ? ' ' : pickRandomChar(charset)))
          .join('')

      setDisplay(next)

      if (t < 1 && activeRef.current) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      setDisplay(target)
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [charset, runOnMount, scrambleOnHover, speedMs, target])

  useEffect(() => {
    if (!runOnMount || hasRunMount.current) return
    hasRunMount.current = true
    run()
  }, [runOnMount, run])

  const stop = () => {
    activeRef.current = false
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    setDisplay(target)
  }

  return (
    <span
      className={className}
      onMouseEnter={run}
      onMouseLeave={stop}
      aria-label={text}
    >
      {display}
    </span>
  )
}

