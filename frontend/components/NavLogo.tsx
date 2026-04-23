import Image from 'next/image'

export default function NavLogo() {
  return (
    <div className="flex items-center" data-logo="gun" aria-label="Logo">
      <Image
        src="/Assets/logo.png"
        alt="syndicate Logo"
        width={119}
        height={40}
        priority
        className="hamburger-attract h-8 w-auto sm:h-10 md:h-12"
        style={{ filter: 'drop-shadow(0 0 14px rgba(251,191,36,0.35))' }}
      />
    </div>
  )
}
