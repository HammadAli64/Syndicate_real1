'use client'

import EvilEye from '@/components/EvilEye'

export function GlobalEyeBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 opacity-70">
        <EvilEye
          eyeColor="#FF6F37"
          outerColor="#D4AF37"
          intensity={1.35}
          pupilSize={0.6}
          irisWidth={0.25}
          glowIntensity={0.3}
          scale={1.25}
          noiseScale={1}
          pupilFollow={0.5}
          flameSpeed={0.95}
          backgroundColor="#030303"
        />
      </div>
      <div className="absolute inset-0 bg-black/65" />
    </div>
  )
}
