'use client'

type CourseCardData = {
  title: string
  description: string
  rating: number
  category: string
  image: string
  price: string
  oldPrice?: string
}

type NeonTheme = {
  border: string
  hover: string
  shadow: string
  text: string
  glow: string
  quote: string
  tag: string
}

type CourseCardProps = {
  course: CourseCardData
  neon: NeonTheme
}

export type { CourseCardData, NeonTheme }

export default function CourseCard({ course, neon }: CourseCardProps) {
  return (
    <article
      className={[
        'cyber-flicker-border group flex h-full flex-col overflow-hidden rounded-2xl border-2 bg-gradient-to-br from-black/95 to-[#0a0a12] p-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] sm:p-5',
        neon.border,
        neon.hover,
        neon.shadow,
      ].join(' ')}
    >
      <div className="relative mb-4 overflow-hidden rounded-xl border border-white/10">
        <img
          src={course.image}
          alt={`${course.title} thumbnail`}
          className="h-40 w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          loading="lazy"
        />
        <div className={`pointer-events-none absolute inset-0 opacity-35 blur-2xl ${neon.glow}`} />
      </div>

      <div className="mb-3 flex items-center justify-between gap-2">
        <span className={`inline-block rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest sm:text-xs ${neon.tag}`}>
          {course.category}
        </span>
        <div className={`text-sm ${neon.text}`} style={{ filter: 'drop-shadow(0 0 8px currentColor)' }}>
          {'★'.repeat(Math.max(1, Math.min(5, course.rating)))}
        </div>
      </div>

      <h3 className={`mb-2 text-lg font-bold uppercase tracking-[0.08em] ${neon.text}`}>{course.title}</h3>
      <p className={`mb-5 line-clamp-3 rounded-lg border-l-4 p-3 text-sm text-slate-300 ${neon.quote}`}>{course.description}</p>

      <div className="mt-auto flex items-end gap-2">
        <span
          className={`text-xl font-black tabular-nums ${neon.text}`}
          style={{ filter: 'drop-shadow(0 0 8px currentColor)', fontFamily: 'Inter, Segoe UI, Roboto, Arial, sans-serif' }}
        >
          {course.price}
        </span>
        {course.oldPrice && (
          <span
            className="text-sm text-slate-500 line-through tabular-nums font-bold"
            style={{ fontFamily: 'Inter, Segoe UI, Roboto, Arial, sans-serif' }}
          >
            {course.oldPrice}
          </span>
        )}
      </div>
    </article>
  )
}
