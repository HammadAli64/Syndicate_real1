import CourseCard, { type CourseCardData, type NeonTheme } from '@/components/CourseCard'
import SiteFooter from '@/components/SiteFooter'

type ProgramCategory = {
  name: string
  items: CourseCardData[]
}

const NEON: NeonTheme[] = [
  { border: 'border-[#00d9ff]/40', hover: 'hover:border-[#00d9ff]', shadow: 'hover:shadow-[0_0_40px_rgba(0,217,255,0.4)]', text: 'text-[#00d9ff]', glow: 'bg-[#00d9ff]/40', quote: 'border-[#00d9ff] bg-[#00d9ff]/10', tag: 'border-[#00d9ff]/50 bg-[#00d9ff]/20 text-[#00d9ff]' },
  { border: 'border-[#39ff14]/40', hover: 'hover:border-[#39ff14]', shadow: 'hover:shadow-[0_0_40px_rgba(57,255,20,0.4)]', text: 'text-[#39ff14]', glow: 'bg-[#39ff14]/40', quote: 'border-[#39ff14] bg-[#39ff14]/10', tag: 'border-[#39ff14]/50 bg-[#39ff14]/20 text-[#39ff14]' },
  { border: 'border-[#a855f7]/40', hover: 'hover:border-[#a855f7]', shadow: 'hover:shadow-[0_0_40px_rgba(168,85,247,0.4)]', text: 'text-[#a855f7]', glow: 'bg-[#a855f7]/40', quote: 'border-[#a855f7] bg-[#a855f7]/10', tag: 'border-[#a855f7]/50 bg-[#a855f7]/20 text-[#a855f7]' },
  { border: 'border-[#ff006e]/40', hover: 'hover:border-[#ff006e]', shadow: 'hover:shadow-[0_0_40px_rgba(255,0,110,0.4)]', text: 'text-[#ff006e]', glow: 'bg-[#ff006e]/40', quote: 'border-[#ff006e] bg-[#ff006e]/10', tag: 'border-[#ff006e]/50 bg-[#ff006e]/20 text-[#ff006e]' },
  { border: 'border-[#38bdf8]/40', hover: 'hover:border-[#38bdf8]', shadow: 'hover:shadow-[0_0_40px_rgba(56,189,248,0.4)]', text: 'text-[#38bdf8]', glow: 'bg-[#38bdf8]/40', quote: 'border-[#38bdf8] bg-[#38bdf8]/10', tag: 'border-[#38bdf8]/50 bg-[#38bdf8]/20 text-[#38bdf8]' },
  { border: 'border-[#22c55e]/40', hover: 'hover:border-[#22c55e]', shadow: 'hover:shadow-[0_0_40px_rgba(34,197,94,0.4)]', text: 'text-[#22c55e]', glow: 'bg-[#22c55e]/40', quote: 'border-[#22c55e] bg-[#22c55e]/10', tag: 'border-[#22c55e]/50 bg-[#22c55e]/20 text-[#22c55e]' },
]

const imagePath = (fileName: string) =>
  `/Assets/programs/cources%20imnages/${encodeURIComponent(fileName)}`

const PRICING_TIERS = [
  { price: '£149', oldPrice: '£299' },
  { price: '£179', oldPrice: '£349' },
  { price: '£199', oldPrice: '£399' },
  { price: '£229', oldPrice: '£449' },
]

const course = (title: string, category: string, fileName: string, tier: number): CourseCardData => ({
  title,
  description: 'Structured lessons, execution blueprints, and implementation steps inside the Syndicate ecosystem.',
  rating: 5,
  category,
  image: imagePath(fileName),
  price: PRICING_TIERS[tier % PRICING_TIERS.length]?.price ?? '£199',
  oldPrice: PRICING_TIERS[tier % PRICING_TIERS.length]?.oldPrice ?? '£399',
})

const PROGRAM_CATEGORIES: ProgramCategory[] = [
  {
    name: 'Business Models',
    items: [
      course('WordPress Blog', 'Business Models', 'make_best_thumbnails_or_cover_image_of_program_wordpress_blog_dystopian_futuristc_cyber_vibes__56y25d9msuef6h5mvdp7_0.png', 0),
      course('Framer Crash Course', 'Business Models', 'make_best_thumbnails_or_cover_image_of_program_framer_crash_course__dystopian_futuristic_cyber__sv3m15ue62yv42axqzjz_3.png', 1),
      course('Faceless YouTube AI Content Creator Course', 'Business Models', 'make_best_thumbnails_or_cover_image_of_program_faceless_youtube_ai_content_creator_course_dystopian_6ilaa9szo8ti113v76xv_0.png', 2),
      course('A.I Automations', 'Business Models', 'make_best_thumbnails_or_cover_image_of_program_ai_automations_dystopian_futuristic_cyber__jo1dnkoktqk1eiv9foxm_2.png', 3),
      course('How To Build A.I Agents', 'Business Models', 'cyber-dystopian-city.png', 0),
      course('Crypto Trading with Technical Analysis Course', 'Business Models', 'make_best_thumbnails_or_cover_image_of_program_crypto_trading_with_technical_analysis_course__dysto_jne4vbob12582s4qybop_2.png', 1),
      course('Print On Demand Clothing', 'Business Models', 'make_best_thumbnails_or_cover_image_of_program_print_on_demand_clothing___zxxqlpgl77cee8pe59ru_2.png', 2),
      course('Building Games Using Unreal Engine', 'Business Models', 'make_best_thumbnails_or_cover_image_of_program_building_games_using_unreal_engine__dn7rcqknsnsvvwiu1pvf_0.png', 3),
      course('App Building (using Flutter)', 'Business Models', 'new-project (3).png', 0),
      course('Block Chain and Smart Contract Building with Solidity', 'Business Models', 'make_best_thumbnails_or_cover_image_of_program_block_chain_and_smart_contract_building_with_solidit_c2ffy9e3r8tpkd09kzrk_2.png', 1),
      course('Book Publishing On Amazon (KINDLE)', 'Business Models', 'new-project.png', 2),
      course('Graphics Design Using Canva', 'Business Models', 'canvics-to-canva.png', 3),
      course('Python Programming', 'Business Models', 'make_best_thumbnails_or_cover_image_of_program_python_programming__dystopian_cyber__pds64wpqtzleuu2ucwkp_0.png', 0),
      course('Building Apps using React JS', 'Business Models', 'new-project (12).png', 1),
      course('Affiliate Marketing', 'Business Models', '0-1.png', 2),
      course('Prompt Engineering', 'Business Models', 'new-project (1).png', 3),
    ],
  },
  {
    name: 'Business Psychology',
    items: [
      course('The 9 to 5 Exit Strategy', 'Business Psychology', '9-5.png', 0),
      course('The Compound Effect', 'Business Psychology', 'thinking.png', 1),
      course('Zero to One Million', 'Business Psychology', '0-1.png', 2),
      course('The Business of Empire Building', 'Business Psychology', 'empire.png', 3),
      course('The Art Of Business Persuasion', 'Business Psychology', 'persussation.png', 0),
      course('Hustle Hard', 'Business Psychology', 'hustle.png', 1),
      course('The Art of Critical Thinking', 'Business Psychology', 'critical thinking.png', 2),
      course('The Secret To Transformation', 'Business Psychology', 'secret.png', 3),
      course('The Art of Mastering Human Behavior in Business', 'Business Psychology', 'humanbehaviou.png', 0),
      course('Mastering Consistency', 'Business Psychology', 'masterconfence.png', 1),
      course('Syndicate Money Philosophy', 'Business Psychology', 'moneyphilosiphy.png', 2),
      course('Syndicate 13 Business Rules', 'Business Psychology', '13rules.png', 3),
    ],
  },
]

export default function ProgramsPage() {
  return (
    <div className="min-h-screen bg-black pt-[69px]">
      <section className="relative overflow-hidden border-b border-pink-300/20 px-4 py-14 sm:px-6 sm:py-16">
        <div className="pointer-events-none absolute inset-0">
          <iframe
            src="https://player.vimeo.com/video/1051218843?muted=1&autoplay=1&loop=1&background=1&app_id=122963"
            className="h-full w-full scale-[1.18]"
            allow="autoplay; fullscreen; picture-in-picture"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            title="Programs background video"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#150412]/78 to-[#02050b]/90" />
        </div>
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <p className="text-xs uppercase tracking-[0.24em] text-pink-200/80">Programs</p>
          <h1 className="mt-3 text-3xl font-bold text-pink-50 sm:text-4xl md:text-5xl">Pick your current growth path</h1>
          <p className="mx-auto mt-4 max-w-3xl text-sm text-pink-100/75 sm:text-base">
            Choose a focused training track based on your current bottleneck and expand into advanced systems over time.
          </p>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#050508] px-4 py-12 sm:px-6 sm:py-16 md:py-20">
        <div className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.4) 2px, rgba(0,0,0,0.4) 4px)' }} />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,217,255,0.12),transparent_36%),radial-gradient(circle_at_80%_15%,rgba(255,0,110,0.1),transparent_30%),radial-gradient(circle_at_55%_80%,rgba(57,255,20,0.08),transparent_30%)]" />

        <div className="relative z-10 mx-auto max-w-6xl space-y-14">
          {PROGRAM_CATEGORIES.map((category, categoryIndex) => (
            <section key={category.name} aria-labelledby={`${category.name}-title`}>
              <h2
                id={`${category.name}-title`}
                className="mb-8 text-center text-2xl font-black uppercase sm:text-3xl md:text-4xl"
              >
                <span className="bg-gradient-to-r from-[#ff006e] via-[#00d9ff] to-[#39ff14] bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(255,0,110,0.4)]">
                  {category.name}
                </span>
              </h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
                {category.items.map((item, index) => (
                  <CourseCard
                    key={`${item.title}-${index}`}
                    course={item}
                    neon={NEON[(categoryIndex * 3 + index) % NEON.length] ?? NEON[0]!}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  )
}
