export function Background() {
  return (
    <div className="fixed inset-0 -z-10">
      <div className="h-full w-full bg-[#000000]" aria-hidden />
      <div className="absolute inset-0 bg-black/70" />
    </div>
  )
}
