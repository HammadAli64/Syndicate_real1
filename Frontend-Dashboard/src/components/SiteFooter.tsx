import Image from 'next/image'
import Link from 'next/link'
import LetterGlitch from '@/components/LetterGlitch'
import NeonTypingBadge from '@/components/NeonTypingBadge'

const footerLinkClass =
  'relative inline-flex pb-1 transition duration-300 ease-out hover:scale-105 hover:brightness-110 focus-visible:scale-105 focus-visible:outline-none after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:rounded-full after:bg-amber-200/90 after:shadow-[0_0_10px_rgba(251,191,36,0.45)] after:transition-transform after:duration-300 after:ease-out hover:after:scale-x-100 focus-visible:after:scale-x-100'

const socialIconClass =
  'inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-300/60 bg-black/40 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.2)] transition duration-300 ease-out hover:scale-110 hover:text-amber-100 hover:shadow-[0_0_18px_rgba(251,191,36,0.42)] focus-visible:scale-110 focus-visible:outline-none'

export default function SiteFooter() {
  return (
    <footer
      className="relative min-h-[clamp(300px,42vh,320px)] w-full overflow-hidden border-t bg-[#02050b] px-[clamp(1rem,3vw,2rem)] py-[clamp(2.5rem,6vw,4.5rem)]"
      style={{
        borderColor: 'rgba(251, 191, 36, 0.6)',
        boxShadow: 'inset 0 1px 0 rgba(251, 191, 36, 0.28), 0 -8px 30px rgba(251, 191, 36, 0.12)',
      }}
    >
      <div className="pointer-events-none absolute inset-0">
        <LetterGlitch
          glitchSpeed={70}
          centerVignette
          outerVignette
          smooth
          glitchColors={['#4a2b72', '#61dca3', '#61b3dc']}
          layerOpacity={0.8}
          className="absolute inset-0 h-full w-full"
        />
        <div className="absolute inset-0 bg-black/62" />
      </div>
      <div className="relative z-10 mx-auto flex w-full max-w-[min(1700px,97vw)] flex-col gap-[clamp(1.7rem,4vw,3.25rem)]">
        <div className="grid grid-cols-1 items-center gap-[clamp(1rem,3vw,2.25rem)] md:grid-cols-[minmax(300px,1.1fr)_minmax(420px,1.2fr)_minmax(360px,1fr)] md:gap-[clamp(1.4rem,2.5vw,3rem)]">
          <div className="p-1 md:justify-self-start">
            <Image
              src="/assets/logo.webp"
              alt="Onem logo"
              width={360}
              height={120}
              className="hamburger-attract h-[clamp(5.2rem,11vw,8.5rem)] w-auto object-contain"
              priority={false}
            />
          </div>

          <div className="mx-auto flex w-full max-w-[min(900px,100%)] justify-center px-[clamp(0.25rem,1vw,0.75rem)] py-[clamp(0.25rem,1vw,0.6rem)]">
            <NeonTypingBadge
              phrases={['HONOUR · MONEY · POWER · FREEDOM']}
              typingSpeed={78}
              deletingSpeed={44}
              pauseMs={1350}
              boxed={false}
              className="mx-auto"
            />
          </div>

          <div className="rounded-xl p-[clamp(0.4rem,1vw,0.75rem)] text-right md:justify-self-end">
            <p
              className="text-[clamp(0.78rem,1.2vw,0.96rem)] font-semibold uppercase tracking-[0.22em]"
              style={{ color: 'rgba(253, 230, 138, 0.95)', textShadow: '0 0 10px rgba(251, 191, 36, 0.35)' }}
            >
              Quick Links
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-end gap-x-[clamp(1rem,2.2vw,2rem)] gap-y-[clamp(0.4rem,1vw,0.8rem)] text-[clamp(1rem,1.5vw,1.5rem)] font-semibold">
              <Link href="/" className={footerLinkClass} style={{ color: 'rgba(254, 243, 199, 0.95)', textShadow: '0 0 8px rgba(251, 191, 36, 0.25)' }}>Home</Link>
              <Link href="/what-you-get" className={footerLinkClass} style={{ color: 'rgba(254, 243, 199, 0.95)', textShadow: '0 0 8px rgba(251, 191, 36, 0.25)' }}>What You Get</Link>
              <Link href="/our-methods" className={footerLinkClass} style={{ color: 'rgba(254, 243, 199, 0.95)', textShadow: '0 0 8px rgba(251, 191, 36, 0.25)' }}>Our Methods</Link>
              <Link href="/programs" className={footerLinkClass} style={{ color: 'rgba(254, 243, 199, 0.95)', textShadow: '0 0 8px rgba(251, 191, 36, 0.25)' }}>Programs</Link>
              <Link href="/login" className={footerLinkClass} style={{ color: 'rgba(254, 243, 199, 0.95)', textShadow: '0 0 8px rgba(251, 191, 36, 0.25)' }}>Join Now</Link>
            </div>
            <div className="mt-5 flex items-center justify-end gap-3">
              <a href="https://www.youtube.com/" target="_blank" rel="noreferrer" aria-label="YouTube" className={socialIconClass}>
                <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-current" aria-hidden>
                  <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8ZM9.6 15.7V8.3L15.8 12l-6.2 3.7Z" />
                </svg>
              </a>
              <a href="https://x.com/" target="_blank" rel="noreferrer" aria-label="X (Twitter)" className={socialIconClass}>
                <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-current" aria-hidden>
                  <path d="M18.9 2H22l-6.8 7.7L23.2 22h-6.2l-4.9-6.9L6 22H2.9l7.3-8.3L.8 2h6.4l4.4 6.2L18.9 2Zm-1.1 18h1.7L6.3 3.9H4.5L17.8 20Z" />
                </svg>
              </a>
              <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram" className={socialIconClass}>
                <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-current" aria-hidden>
                  <path d="M12 2.2c3.2 0 3.6 0 4.8.1 1.1.1 1.7.2 2.1.4.6.2 1 .4 1.5.9s.7.9.9 1.5c.2.4.3 1 .4 2.1.1 1.2.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.1-.2 1.7-.4 2.1-.2.6-.4 1-.9 1.5s-.9.7-1.5.9c-.4.2-1 .3-2.1.4-1.2.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.1-.1-1.7-.2-2.1-.4-.6-.2-1-.4-1.5-.9s-.7-.9-.9-1.5c-.2-.4-.3-1-.4-2.1C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.1.2-1.7.4-2.1.2-.6.4-1 .9-1.5s.9-.7 1.5-.9c.4-.2 1-.3 2.1-.4 1.2-.1 1.6-.1 4.8-.1Zm0 2.2c-3.1 0-3.5 0-4.7.1-.8 0-1.3.2-1.6.3-.4.1-.7.3-1 .6-.3.3-.5.6-.6 1-.1.3-.2.8-.3 1.6-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c0 .8.2 1.3.3 1.6.1.4.3.7.6 1 .3.3.6.5 1 .6.3.1.8.2 1.6.3 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c.8 0 1.3-.2 1.6-.3.8-.3 1.4-.9 1.7-1.7.1-.3.2-.8.3-1.6.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c0-.8-.2-1.3-.3-1.6-.1-.4-.3-.7-.6-1-.3-.3-.6-.5-1-.6-.3-.1-.8-.2-1.6-.3-1.2-.1-1.6-.1-4.7-.1Zm0 3.7A3.9 3.9 0 1 1 12 16a3.9 3.9 0 0 1 0-7.8Zm0 5.6a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4Zm5-6.8a.9.9 0 1 1-1.8 0 .9.9 0 0 1 1.8 0Z" />
                </svg>
              </a>
              <a href="https://www.facebook.com/" target="_blank" rel="noreferrer" aria-label="Facebook" className={socialIconClass}>
                <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-current" aria-hidden>
                  <path d="M13.7 22v-8.2h2.8l.4-3.2h-3.2V8.5c0-.9.3-1.5 1.6-1.5H17V4.1c-.8-.1-1.6-.1-2.4-.1-2.4 0-4 1.5-4 4.1v2.3H8v3.2h2.7V22h3Z" />
                </svg>
              </a>
              <a href="https://www.tiktok.com/" target="_blank" rel="noreferrer" aria-label="TikTok" className={socialIconClass}>
                <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-current" aria-hidden>
                  <path d="M14.6 2h2.8c.2 1.8 1.3 3.4 3 4.3V9a7.5 7.5 0 0 1-3-.8v6.6a6 6 0 1 1-6-6h.3v2.8h-.3a3.2 3.2 0 1 0 3.2 3.2V2Z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <p
          className="border-t pt-[clamp(1rem,2.3vw,1.5rem)] text-center text-[10px] tracking-[0.13em] sm:text-xs"
          style={{ borderColor: 'rgba(251, 191, 36, 0.45)', color: 'rgba(254, 243, 199, 0.85)', textShadow: '0 0 8px rgba(251, 191, 36, 0.2)' }}
        >
          All content is made for educational purposes and is up to the individual to apply the knowledge. We do not guarantee any results.
        </p>
      </div>
    </footer>
  )
}

