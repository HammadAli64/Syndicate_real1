'use client'

import { useEffect, useRef, useState } from 'react'

const HEADING = 'THE SYNDICATE'
const PARAGRAPH =
  'An exclusive network committed to helping you achieve mastery over money, power, and influence. Rise above the system through practical strategies, the 7 Levels of Power, and alliances built on honour and trust.'

export function HeroIntro() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [startTyping, setStartTyping] = useState(false)
  const [typedHeading, setTypedHeading] = useState('')
  const [typedParagraph, setTypedParagraph] = useState('')

  useEffect(() => {
    const node = containerRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return
        setStartTyping(true)
        observer.disconnect()
      },
      { threshold: 0.35 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!startTyping) return

    let headingIndex = 0
    let paragraphIndex = 0

    const headingTimer = window.setInterval(() => {
      headingIndex += 1
      setTypedHeading(HEADING.slice(0, headingIndex))
      if (headingIndex >= HEADING.length) window.clearInterval(headingTimer)
    }, 56)

    const paragraphTimer = window.setInterval(() => {
      paragraphIndex += 2
      setTypedParagraph(PARAGRAPH.slice(0, paragraphIndex))
      if (paragraphIndex >= PARAGRAPH.length) window.clearInterval(paragraphTimer)
    }, 22)

    return () => {
      window.clearInterval(headingTimer)
      window.clearInterval(paragraphTimer)
    }
  }, [startTyping])

  return (
    <div
      ref={containerRef}
      className="w-full max-w-3xl space-y-4 rounded-2xl bg-black/45 p-4 text-left backdrop-blur-[1px] md:space-y-6 md:p-6"
    >
      <h1 className="text-xxl max-w-2xl text-[color:var(--gold)] drop-shadow-[0_0_18px_var(--gold-alpha)]">{typedHeading}</h1>
      <p className="max-w-2xl text-base leading-8 text-slate-100 sm:text-lg">{typedParagraph}</p>
    </div>
  )
}
