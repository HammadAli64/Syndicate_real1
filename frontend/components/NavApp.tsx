'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { type NavSectionId, RadialNav } from '@/components/RadialNav'
import LetterGlitch from '@/components/LetterGlitch'

const SECTION_ROUTES: Record<Exclude<NavSectionId, 'joinNow'>, string> = {
  home: '/',
  whatYouGet: '/what-you-get',
  ourMethods: '/our-methods',
  programs: '/programs',
}

function getActiveNavId(pathname: string, hash: string): NavSectionId {
  if (hash === '#joinNowSection') return 'joinNow'
  if (pathname === '/what-you-get') return 'whatYouGet'
  if (pathname === '/our-methods') return 'ourMethods'
  if (pathname === '/programs') return 'programs'
  return 'home'
}

export function NavApp() {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeId, setActiveId] = useState<NavSectionId>('home')

  const handleToggleMenu = () => {
    if (menuOpen) {
      handleClose()
      return
    }
    setMenuOpen(true)
  }

  const handleClose = () => {
    setMenuOpen(false)
  }

  useEffect(() => {
    const syncActive = () => {
      const hash = typeof window !== 'undefined' ? window.location.hash : ''
      setActiveId(getActiveNavId(pathname, hash))
    }

    syncActive()
    window.addEventListener('hashchange', syncActive)
    return () => window.removeEventListener('hashchange', syncActive)
  }, [pathname])

  const handleSelect = (id: NavSectionId) => {
    if (id === 'joinNow') {
      router.push('/#joinNowSection')
    } else {
      router.push(SECTION_ROUTES[id])
    }
    setActiveId(id)
    handleClose()
  }

  return (
    <div
      className="fixed left-0 right-0 top-0 z-50 flex flex-col bg-gradient-to-b from-black/45 via-black/20 to-transparent backdrop-blur-[2px] transition-[height] duration-500 ease-in-out pt-2"
      style={{
        height: menuOpen ? '100dvh' : '69px',
        minHeight: menuOpen ? '100dvh' : undefined,
        overflow: menuOpen ? 'visible' : 'hidden',
        paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0px))',
      }}
      role="banner"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <LetterGlitch
          glitchSpeed={130}
          centerVignette={false}
          outerVignette={false}
          smooth
          glitchColors={['#2b4539', '#7f5af0', '#61b3dc']}
          layerOpacity={0.1}
          className="bg-transparent"
        />
      </div>
      <div className="relative z-10 flex flex-1 flex-col min-h-0">
        <div
          className={`flex h-14 min-h-14 w-full shrink-0 items-center px-4 transition-[justify-content] duration-500 ease-in-out sm:h-16 sm:min-h-16 sm:px-5 ${
            menuOpen ? 'justify-start' : 'justify-center'
          }`}
        >
          {!menuOpen && (
            <button
              type="button"
              onClick={handleToggleMenu}
              className="hamburger-attract absolute right-3 flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1.5 rounded-lg border border-amber-300/70 bg-black/55 px-2.5 py-2.5 shadow-[0_0_16px_rgba(251,191,36,0.28)] sm:right-5 sm:px-3"
              aria-label="Open menu"
            >
              <span className="block h-0.5 w-5 rounded-full bg-amber-200" />
              <span className="block h-0.5 w-5 rounded-full bg-amber-200" />
              <span className="block h-0.5 w-4 rounded-full bg-amber-200" />
            </button>
          )}
        </div>
        {menuOpen && (
          <div className="relative min-h-0 flex-1 overflow-visible p-2 sm:p-[10px]">
            <RadialNav
              open={menuOpen}
              activeId={activeId}
              onClose={handleClose}
              onSelect={handleSelect}
            />
          </div>
        )}
      </div>
    </div>
  )
}
