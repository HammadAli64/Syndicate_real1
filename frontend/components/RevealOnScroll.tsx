'use client'

import { type ReactNode, useEffect, useRef, useState } from 'react'

type RevealOnScrollProps = {
  children: ReactNode
  delayMs?: number
  className?: string
}

export function RevealOnScroll({ children, delayMs = 0, className = '' }: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return
        setVisible(true)
        observer.disconnect()
      },
      { threshold: 0.2 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`${className} reveal-base ${visible ? 'reveal-visible' : ''}`}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  )
}
