'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import LogoLoop from '@/components/HomePageComponents/ui/LogoLoop'

const ORNAMENT_IMG = 'https://the-syndicate.com/wp-content/uploads/2024/07/Group-48.webp'

const pressLogos = [
  { src: '/assets/press-forbes.png', alt: 'Forbes', href: '#' },
  { src: '/assets/press-gq.png', alt: 'GQ', href: '#' },
  { src: '/assets/press-luxury.png', alt: 'Luxury Lifestyle', href: '#' },
]

export default function SyndicateFlowSection() {
  const topRef = useRef<HTMLImageElement>(null)
  const bottomRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (topRef.current) gsap.fromTo(topRef.current, { x: '-120%' }, { x: 0, duration: 1, ease: 'power3.out' })
    if (bottomRef.current) gsap.fromTo(bottomRef.current, { x: '120%' }, { x: 0, duration: 1, ease: 'power3.out' })
  }, [])

  return (
    <section className="overflow-hidden bg-black py-6 sm:py-8">
      <img ref={topRef} src={ORNAMENT_IMG} alt="" className="pointer-events-none block w-full select-none opacity-95 will-change-transform" />
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:py-6 md:py-8">
        <LogoLoop logos={pressLogos} speed={80} hoverSpeed={0} logoHeight={48} gap={80} fadeOutColor="#000000" />
      </div>
      <img ref={bottomRef} src={ORNAMENT_IMG} alt="" className="pointer-events-none block w-full select-none opacity-95 will-change-transform" />
    </section>
  )
}
