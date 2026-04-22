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
          <path className={`${styles.line} ${styles.delay1}`} d="M15 33 C 20 30, 25 28, 31 29" />
          <path className={`${styles.line} ${styles.delay2}`} d="M31 29 C 37 24, 44 22, 52 22" />
          <path className={`${styles.line} ${styles.delay3}`} d="M52 22 C 58 28, 66 34, 74 36" />
          <path className={`${styles.line} ${styles.delay4}`} d="M74 36 C 76 36.5, 77.5 37.5, 79 38" />
          <path className={`${styles.line} ${styles.delay5}`} d="M79 38 C 84 38, 88 35, 92 32" />
          <path className={`${styles.line} ${styles.delay6}`} d="M79 38 C 86 43, 90 56, 94 72" />
          <path className={`${styles.line} ${styles.delay2}`} d="M79 38 C 83 41, 86 46, 89 50" />
        </svg>

        <div className={styles.city} style={{ left: '15%', top: '33%' }}>
          <span className={styles.tag}>Los Angeles</span><span className={styles.dot} />
        </div>
        <div className={styles.city} style={{ left: '31%', top: '29%' }}>
          <span className={styles.tag}>New York</span><span className={styles.dot} />
        </div>
        <div className={styles.city} style={{ left: '52%', top: '22%' }}>
          <span className={styles.tag}>London</span><span className={styles.dot} />
        </div>
        <div className={styles.city} style={{ left: '74%', top: '36%' }}>
          <span className={styles.tag}>Dubai</span><span className={styles.dot} />
        </div>
        <div className={styles.city} style={{ left: '79%', top: '38%' }}>
          <span className={styles.tag}>Pakistan</span><span className={styles.dot} />
        </div>
        <div className={styles.city} style={{ left: '89%', top: '50%' }}>
          <span className={styles.tag}>Singapore</span><span className={styles.dot} />
        </div>
        <div className={styles.city} style={{ left: '92%', top: '32%' }}>
          <span className={styles.tag}>Tokyo</span><span className={styles.dot} />
        </div>
        <div className={styles.city} style={{ left: '94%', top: '72%' }}>
          <span className={styles.tag}>Sydney</span><span className={styles.dot} />
        </div>
      </div>
    </section>
  )
}
