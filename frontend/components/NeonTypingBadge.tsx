'use client'

import { useEffect, useMemo, useState } from 'react'

type NeonTypingBadgeProps = {
  phrases: string[]
  typingSpeed?: number
  deletingSpeed?: number
  pauseMs?: number
  className?: string
}

export default function NeonTypingBadge({
  phrases,
  typingSpeed = 75,
  deletingSpeed = 45,
  pauseMs = 1300,
  className,
}: NeonTypingBadgeProps) {
  const safePhrases = useMemo(() => phrases.filter((phrase) => phrase.trim().length > 0), [phrases])
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [visibleText, setVisibleText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const activePhrase = safePhrases[phraseIndex % Math.max(safePhrases.length, 1)] ?? ''

  useEffect(() => {
    if (safePhrases.length === 0) return

    const current = safePhrases[phraseIndex]
    if (!current) return

    const shouldPauseAfterTyped = !isDeleting && visibleText === current
    const shouldPauseAfterDeleted = isDeleting && visibleText.length === 0

    let timeoutMs = isDeleting ? deletingSpeed : typingSpeed
    if (shouldPauseAfterTyped || shouldPauseAfterDeleted) {
      timeoutMs = pauseMs
    }

    const timer = window.setTimeout(() => {
      if (shouldPauseAfterTyped) {
        setIsDeleting(true)
        return
      }

      if (shouldPauseAfterDeleted) {
        setIsDeleting(false)
        setPhraseIndex((prev) => (prev + 1) % safePhrases.length)
        return
      }

      if (isDeleting) {
        setVisibleText((prev) => prev.slice(0, -1))
      } else {
        setVisibleText(current.slice(0, visibleText.length + 1))
      }
    }, timeoutMs)

    return () => window.clearTimeout(timer)
  }, [deletingSpeed, isDeleting, pauseMs, phraseIndex, safePhrases, typingSpeed, visibleText])

  return (
    <div
      className={[
        'neon-badge relative inline-flex max-w-[min(92vw,840px)] items-center rounded-full px-5 py-2.5 sm:px-6 sm:py-3',
        className ?? '',
      ].join(' ')}
      role="status"
      aria-live="polite"
      aria-label={activePhrase}
    >
      <span className="neon-badge-text">
        {visibleText}
        <span className="neon-caret" aria-hidden>
          |
        </span>
      </span>
    </div>
  )
}
