'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import '../styling/LogoLoop.css'

type LogoItem = { src: string; alt: string; href?: string }

type LogoLoopProps = {
  logos: LogoItem[]
  speed?: number
  logoHeight?: number
  gap?: number
  hoverSpeed?: number
  fadeOutColor?: string
}

export default function LogoLoop({
  logos,
  speed = 80,
  logoHeight = 48,
  gap = 80,
  hoverSpeed = 0,
  fadeOutColor = '#000000',
}: LogoLoopProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const seqRef = useRef<HTMLUListElement>(null)
  const rafRef = useRef<number | null>(null)
  const lastTsRef = useRef<number | null>(null)
  const offsetRef = useRef(0)
  const velocityRef = useRef(speed)

  const [copies, setCopies] = useState(3)
  const [seqWidth, setSeqWidth] = useState(0)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const update = () => {
      const cw = containerRef.current?.clientWidth ?? 0
      const sw = seqRef.current?.getBoundingClientRect().width ?? 0
      if (!sw) return
      setSeqWidth(sw)
      setCopies(Math.max(2, Math.ceil(cw / sw) + 2))
    }

    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [logos, gap, logoHeight])

  useEffect(() => {
    const track = trackRef.current
    if (!track || !seqWidth) return

    const tick = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts
      const dt = (ts - lastTsRef.current) / 1000
      lastTsRef.current = ts

      const target = hovered ? hoverSpeed : speed
      velocityRef.current += (target - velocityRef.current) * Math.min(1, dt / 0.2)
      offsetRef.current = (offsetRef.current + velocityRef.current * dt + seqWidth) % seqWidth
      track.style.transform = `translate3d(${-offsetRef.current}px,0,0)`

      rafRef.current = window.requestAnimationFrame(tick)
    }

    rafRef.current = window.requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      lastTsRef.current = null
    }
  }, [hovered, hoverSpeed, seqWidth, speed])

  const rootClass = useMemo(() => 'logoloop logoloop--fade logoloop--scale-hover', [])

  return (
    <div
      ref={containerRef}
      className={rootClass}
      style={
        {
          '--logoloop-gap': `${gap}px`,
          '--logoloop-logoHeight': `${logoHeight}px`,
          '--logoloop-fadeColor': fadeOutColor,
        } as React.CSSProperties
      }
    >
      <div ref={trackRef} className="logoloop__track" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        {Array.from({ length: copies }).map((_, copyIdx) => (
          <ul className="logoloop__list" key={copyIdx} ref={copyIdx === 0 ? seqRef : undefined}>
            {logos.map((item, i) => (
              <li className="logoloop__item" key={`${copyIdx}-${i}`}>
                {item.href ? (
                  <a href={item.href} className="logoloop__link" target="_blank" rel="noreferrer">
                    <img src={item.src} alt={item.alt} loading="lazy" decoding="async" />
                  </a>
                ) : (
                  <img src={item.src} alt={item.alt} loading="lazy" decoding="async" />
                )}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  )
}
