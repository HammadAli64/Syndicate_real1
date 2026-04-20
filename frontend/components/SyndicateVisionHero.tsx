'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import styles from './SyndicateVisionHero.module.css'

type Card = {
  title: string
  image: string
  tint: 'pink' | 'cyan' | 'green' | 'yellow'
}

const cards: Card[] = [
  { title: 'Edge', image: '/vision/edge.jpg', tint: 'pink' },
  { title: 'Sync', image: '/vision/sync.jpg', tint: 'cyan' },
  { title: 'Nexus', image: '/vision/nexus.jpg', tint: 'cyan' },
  { title: 'Grid', image: '/vision/grid.jpg', tint: 'green' },
  { title: 'Signal', image: '/vision/signal.jpg', tint: 'pink' },
]

export default function SyndicateVisionHero() {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  const visualCards = useMemo(
    () =>
      cards.map((card, i) => (
        <article
          key={card.title}
          className={`${styles.card} ${styles[`tilt${(i % 5) + 1}`]} ${reducedMotion ? styles.noAnim : ''}`}
          style={{ animationDelay: `${i * 120}ms` }}
        >
          <div className={styles.cardImageWrap}>
            <Image
              src={card.image}
              alt={card.title}
              className={styles.cardImage}
              width={540}
              height={720}
              sizes="(max-width: 840px) 120px, 180px"
              priority={i < 2}
            />
          </div>
          <p className={`${styles.cardLabel} ${styles[`label${card.tint}`]}`}>{card.title}</p>
        </article>
      )),
    [reducedMotion],
  )

  return (
    <section className={styles.hero}>
      <div className={styles.bgGlow} />
      <div className={styles.scanlines} />
      <div className={styles.noise} />

      <div className={styles.row}>{visualCards}</div>

      <h1 className={`${styles.title} ${reducedMotion ? styles.titleStatic : ''}`} data-text="THE SYNDICATE'S VISION">
        THE SYNDICATE&apos;S VISION
      </h1>
    </section>
  )
}
