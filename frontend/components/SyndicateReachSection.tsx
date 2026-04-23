'use client'

import styles from './SyndicateReachSection.module.css'

export default function SyndicateReachSection() {
  return (
    <section className={styles.reachSection} aria-labelledby="reach-title">
      <div className={styles.reachHeader}>
        <h2 id="reach-title">Syndicate Reach</h2>
        <p>Operators, partners, and collaborations across time zones. Signals move fast-so do we.</p>
      </div>

      <div className={styles.reachMapWrap}>
        <div className={styles.reachGrid} />
        <div className={styles.reachVignette} />

        <svg className={styles.reachLines} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <path className={`${styles.line} ${styles.delay1}`} d="M13 40 C 17 36, 21 34, 27 35" />
          <path className={`${styles.line} ${styles.delay2}`} d="M27 35 C 35 26, 44 23, 49 28" />
          <path className={`${styles.line} ${styles.delay3}`} d="M66 42 C 69 41, 70 43, 72 44" />
          <path className={`${styles.line} ${styles.delay4}`} d="M72 44 C 77 47, 80 50, 82 52" />
          <path className={`${styles.line} ${styles.delay5}`} d="M72 44 C 77 36, 85 31, 92 34" />
          <path className={`${styles.line} ${styles.delay6}`} d="M82 52 C 88 56, 91 64, 93 74" />
        </svg>

        <div className={styles.city} style={{ left: '13%', top: '40%' }}>
          <span className={styles.tag}>Los Angeles</span><span className={styles.dot} />
        </div>
        <div className={styles.city} style={{ left: '27%', top: '35%' }}>
          <span className={styles.tag}>New York</span><span className={styles.dot} />
        </div>
        <div className={styles.city} style={{ left: '49%', top: '28%' }}>
          <span className={styles.tag}>London</span><span className={styles.dot} />
        </div>
        <div className={styles.city} style={{ left: '66%', top: '42%' }}>
          <span className={styles.tag}>Dubai</span><span className={styles.dot} />
        </div>
        <div className={styles.city} style={{ left: '72%', top: '44%' }}>
          <span className={styles.tag}>Pakistan</span><span className={styles.dot} />
        </div>
        <div className={styles.city} style={{ left: '82%', top: '52%' }}>
          <span className={styles.tag}>Singapore</span><span className={styles.dot} />
        </div>
        <div className={styles.city} style={{ left: '92%', top: '34%' }}>
          <span className={styles.tag}>Tokyo</span><span className={styles.dot} />
        </div>
        <div className={styles.city} style={{ left: '93%', top: '74%' }}>
          <span className={styles.tag}>Sydney</span><span className={styles.dot} />
        </div>
      </div>
    </section>
  )
}
