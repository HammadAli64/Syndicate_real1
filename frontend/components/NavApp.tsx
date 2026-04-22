'use client'

import { useEffect, useState } from 'react'
import { type NavSectionId, RadialNav } from '@/components/RadialNav'
import LetterGlitch from '@/components/LetterGlitch'
import NavLogo from '@/components/NavLogo'

export function NavApp() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrollActiveId, setScrollActiveId] = useState<NavSectionId>('home')

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

  const scrollToId = (id: string) => {
    const section = document.getElementById(id)
    if (section) {
      section.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }

  useEffect(() => {
    const onScroll = () => {
      const heroTop = document.getElementById('heroSection')?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY
      const homeTop = document.getElementById('homeSection')?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY
      const methodsTop = document.getElementById('ourMethodsSection')?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY

      if (methodsTop <= 220) {
        setScrollActiveId('ourMethods')
      } else if (homeTop <= 220) {
        setScrollActiveId('joinNow')
      } else if (heroTop <= 220) {
        setScrollActiveId('home')
      } else {
        setScrollActiveId('home')
      }
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const activeId: NavSectionId = scrollActiveId

  const handleSelect = (id: NavSectionId) => {
    if (id === 'home') scrollToId('heroSection')
    if (id === 'whatYouGet') scrollToId('heroSection')
    if (id === 'ourMethods') scrollToId('ourMethodsSection')
    if (id === 'joinNow') scrollToId('homeSection')
    if (id === 'login') scrollToId('heroSection')
    setScrollActiveId(id)
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
          <button type="button" onClick={handleToggleMenu} className="inline-flex items-center" aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
            <NavLogo />
          </button>
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
