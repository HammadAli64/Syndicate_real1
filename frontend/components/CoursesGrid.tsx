'use client'

import CourseCard, { type CourseCardData, type NeonTheme } from '@/components/CourseCard'

type CoursesGridProps = {
  courses?: CourseCardData[]
}

const DEFAULT_COURSES: CourseCardData[] = [
  {
    title: 'Business Mastery',
    description: 'Build scalable systems, leadership cadence, and strategic execution for modern companies.',
    rating: 5,
    category: 'Business',
    image: '/Assets/kings.png',
    price: '$299',
    oldPrice: '$499',
  },
  {
    title: 'Elite Negotiation',
    description: 'High-stakes influence frameworks with practical scripts for deals, partnerships, and growth.',
    rating: 5,
    category: 'Leadership',
    image: '/Assets/kings2.png',
    price: '$249',
  },
  {
    title: 'Digital Systems',
    description: 'Engineer automated workflows that cut operational drag and increase delivery consistency.',
    rating: 4,
    category: 'Operations',
    image: '/Assets/kings3.png',
    price: '$189',
    oldPrice: '$259',
  },
  {
    title: 'Market Psychology',
    description: 'Decode audience behavior, messaging triggers, and positioning for premium conversions.',
    rating: 5,
    category: 'Marketing',
    image: '/Assets/pawn.png',
    price: '$219',
  },
  {
    title: 'Founder Execution',
    description: 'From vision to tactical roadmaps, master the weekly system used by high-performing founders.',
    rating: 5,
    category: 'Founder',
    image: '/Assets/coin-gold.png',
    price: '$279',
  },
  {
    title: 'Capital Strategy',
    description: 'Cashflow architecture, offer economics, and reinvestment models for durable growth.',
    rating: 4,
    category: 'Finance',
    image: '/Assets/pawn2.png',
    price: '$199',
    oldPrice: '$299',
  },
]

const NEON: NeonTheme[] = [
  { border: 'border-[#00d9ff]/40', hover: 'hover:border-[#00d9ff]', shadow: 'hover:shadow-[0_0_40px_rgba(0,217,255,0.4)]', text: 'text-[#00d9ff]', glow: 'bg-[#00d9ff]/40', quote: 'border-[#00d9ff] bg-[#00d9ff]/10', tag: 'border-[#00d9ff]/50 bg-[#00d9ff]/20 text-[#00d9ff]' },
  { border: 'border-[#39ff14]/40', hover: 'hover:border-[#39ff14]', shadow: 'hover:shadow-[0_0_40px_rgba(57,255,20,0.4)]', text: 'text-[#39ff14]', glow: 'bg-[#39ff14]/40', quote: 'border-[#39ff14] bg-[#39ff14]/10', tag: 'border-[#39ff14]/50 bg-[#39ff14]/20 text-[#39ff14]' },
  { border: 'border-[#a855f7]/40', hover: 'hover:border-[#a855f7]', shadow: 'hover:shadow-[0_0_40px_rgba(168,85,247,0.4)]', text: 'text-[#a855f7]', glow: 'bg-[#a855f7]/40', quote: 'border-[#a855f7] bg-[#a855f7]/10', tag: 'border-[#a855f7]/50 bg-[#a855f7]/20 text-[#a855f7]' },
  { border: 'border-[#ff006e]/40', hover: 'hover:border-[#ff006e]', shadow: 'hover:shadow-[0_0_40px_rgba(255,0,110,0.4)]', text: 'text-[#ff006e]', glow: 'bg-[#ff006e]/40', quote: 'border-[#ff006e] bg-[#ff006e]/10', tag: 'border-[#ff006e]/50 bg-[#ff006e]/20 text-[#ff006e]' },
  { border: 'border-[#38bdf8]/40', hover: 'hover:border-[#38bdf8]', shadow: 'hover:shadow-[0_0_40px_rgba(56,189,248,0.4)]', text: 'text-[#38bdf8]', glow: 'bg-[#38bdf8]/40', quote: 'border-[#38bdf8] bg-[#38bdf8]/10', tag: 'border-[#38bdf8]/50 bg-[#38bdf8]/20 text-[#38bdf8]' },
  { border: 'border-[#22c55e]/40', hover: 'hover:border-[#22c55e]', shadow: 'hover:shadow-[0_0_40px_rgba(34,197,94,0.4)]', text: 'text-[#22c55e]', glow: 'bg-[#22c55e]/40', quote: 'border-[#22c55e] bg-[#22c55e]/10', tag: 'border-[#22c55e]/50 bg-[#22c55e]/20 text-[#22c55e]' },
]

export default function CoursesGrid({ courses = DEFAULT_COURSES }: CoursesGridProps) {
  return (
    <section
      aria-label="Courses grid"
      className="relative overflow-hidden bg-[#050508] px-4 py-12 sm:px-6 sm:py-16 md:py-20"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.4) 2px, rgba(0,0,0,0.4) 4px)' }} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,217,255,0.12),transparent_36%),radial-gradient(circle_at_80%_15%,rgba(255,0,110,0.1),transparent_30%),radial-gradient(circle_at_55%_80%,rgba(57,255,20,0.08),transparent_30%)]" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <h2 className="mb-10 text-center text-2xl font-black uppercase sm:mb-12 sm:text-3xl md:text-4xl lg:text-5xl">
          <span className="bg-gradient-to-r from-[#ff006e] via-[#00d9ff] via-[#39ff14] to-[#a855f7] bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(255,0,110,0.4)]">
            Featured PROGRAMS
          </span>
        </h2>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
          {courses.map((course, index) => (
            <CourseCard key={`${course.title}-${index}`} course={course} neon={NEON[index % NEON.length] ?? NEON[0]!} />
          ))}
        </div>
      </div>
    </section>
  )
}
