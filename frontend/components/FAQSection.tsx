'use client'

const FAQ_ITEMS = [
  'WHAT IS THE SYNDICATE?',
  'WHAT DOES THE SYNDICATE OFFER?',
  'HOW DO I JOIN THE SYNDICATE?',
  'WHAT MAKES THE SYNDICATE DIFFERENT?',
  'HOW CAN I CONTACT THE SYNDICATE?',
]

export default function FAQSection() {
  return (
    <section
      id="faq"
      className="relative overflow-hidden px-4 py-16 md:px-8 md:py-24"
      style={{
        background:
          'radial-gradient(1200px 500px at 50% -10%, rgba(132, 63, 255, 0.16), transparent 55%), linear-gradient(180deg, #050611 0%, #070a17 45%, #050611 100%)',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'linear-gradient(rgba(120,140,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(120,140,255,0.08) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-5xl rounded-sm border border-white/10 bg-[#090d1f]/75 px-6 py-10 shadow-[0_0_60px_rgba(132,63,255,0.15)] backdrop-blur-sm md:px-12 md:py-14">
        <h2
          className="text-center text-4xl font-black uppercase leading-[0.9] tracking-[0.14em] md:text-6xl"
          style={{
            color: '#e7d8ff',
            textShadow: '0 0 12px rgba(190,120,255,0.7), 0 0 35px rgba(130,70,255,0.35)',
          }}
        >
          Frequently
          <br />
          Asked
        </h2>

        <div className="mt-10 md:mt-14">
          {FAQ_ITEMS.map((item, i) => (
            <div key={item} className="border-b border-white/10">
              <button type="button" className="group flex w-full items-center gap-4 py-5 text-left md:gap-6 md:py-6">
                <span className="w-8 shrink-0 font-mono text-lg font-bold md:text-xl" style={{ color: '#1fd8d8' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>

                <span
                  className="flex-1 text-base font-semibold uppercase tracking-[0.06em] md:text-3xl md:tracking-[0.08em]"
                  style={{ color: '#d8def2' }}
                >
                  {item}
                </span>

                <span className="shrink-0 font-mono text-sm tracking-[0.2em] md:text-lg" style={{ color: '#1fd8d8' }}>
                  ( • )
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
