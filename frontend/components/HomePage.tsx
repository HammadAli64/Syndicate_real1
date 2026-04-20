const CODE_LINES = `0x7F 0x3E 0x1C 0x08 0x00
fn init() { let x = 0; }
#[derive(Debug)] struct S;
const API_KEY: &str = "...";
async fn fetch() -> Result<()> { Ok(()) }
0xDE 0xAD 0xBE 0xEF 0xCA 0xFE
impl Handler for Service { fn run(&self) {} }
vec![1, 2, 3].iter().map(|x| x * 2)
match state { State::A => 1, _ => 0 }
0xFF 0x00 0x80 0xC0 0xE0 0xF0
`
  .split('\n')
  .filter((s) => s.length > 0)

export function HomePage() {
  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-zinc-950">
      <div className="absolute inset-0">
        <div
          className="h-full w-full bg-gradient-to-br from-[#1a0a2e] via-[#0d0618] to-[#16213e]"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />
      </div>

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        aria-hidden
      >
        <div className="flex h-full flex-col justify-around gap-1 font-mono text-[10px] leading-tight text-cyan-400/80">
          {CODE_LINES.map((line, i) => (
            <div key={i} className="animate-[shimmer_8s_linear_infinite] whitespace-pre pl-4">
              {line}
            </div>
          ))}
        </div>
      </div>

      <div
        className="pointer-events-none absolute left-1/2 top-0 h-full w-[3px] -translate-x-1/2"
        aria-hidden
      >
        <div
          className="h-full w-full opacity-90"
          style={{
            background:
              'linear-gradient(180deg, transparent 0%, rgba(168,85,247,0.15) 20%, rgba(59,130,246,0.5) 50%, rgba(34,211,238,0.6) 80%, transparent 100%)',
            boxShadow:
              '0 0 24px rgba(168,85,247,0.25), 0 0 48px rgba(59,130,246,0.15)',
          }}
        />
      </div>

      <header className="absolute left-0 right-0 top-6 z-10 text-center">
        <div className="font-serif text-xl font-semibold tracking-[0.35em] text-amber-400/95 drop-shadow-[0_0_20px_rgba(251,191,36,0.3)]">
          SYNDICATE
        </div>
        <div className="mt-1 h-6 w-12 mx-auto rounded-b-full border border-amber-400/40 border-t-0 bg-amber-500/10" />
      </header>

      <section className="absolute left-[8%] top-1/2 z-10 w-[38%] max-w-xl -translate-y-1/2">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          <span className="block text-[0.45em] font-medium uppercase tracking-[0.2em] text-zinc-300">
            The
          </span>
          <span
            className="block bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(168,85,247,0.3)]"
            style={{ textShadow: '0 0 40px rgba(34,211,238,0.2)' }}
          >
            SYNDICATE
          </span>
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-300/95">
          The Syndicate is where strategy meets execution. Build digital leverage,
          stack high-value skills, and move with precision in a noisy world.
        </p>
      </section>

      <aside className="absolute right-[10%] top-1/2 z-10 flex -translate-y-1/2 flex-col gap-3">
        <span className="text-xs uppercase tracking-widest text-amber-600/80">Honour</span>
        <button
          type="button"
          className="rounded-xl bg-gradient-to-r from-fuchsia-600/90 to-purple-600/90 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(168,85,247,0.35)] hover:from-fuchsia-500 hover:to-purple-500"
        >
          MONEY
        </button>
        <button
          type="button"
          className="rounded-xl bg-gradient-to-r from-cyan-500/90 to-teal-500/90 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(34,211,238,0.3)] hover:from-cyan-400 hover:to-teal-400"
        >
          POWER
        </button>
        <button
          type="button"
          className="rounded-xl bg-gradient-to-r from-amber-500/90 to-yellow-500/90 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(251,191,36,0.25)] hover:from-amber-400 hover:to-yellow-400"
        >
          FREEDOM
        </button>
      </aside>
    </div>
  )
}
