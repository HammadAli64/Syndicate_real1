import Image from 'next/image'

export default function NavLogo() {
  return (
    <div className="flex items-center gap-2" data-logo="gun">
      <Image
        src="/logo.png"
        alt="Nav Logo"
        width={120}
        height={48}
        priority
        className="hamburger-attract h-8 w-auto max-w-[80px] sm:h-10 sm:max-w-[100px] md:h-12 md:max-w-[120px]"
        style={{ filter: 'drop-shadow(0 0 14px rgba(251,191,36,0.35))' }}
      />
    </div>
  )
}
