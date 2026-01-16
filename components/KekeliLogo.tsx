'use client'

interface LogoProps {
  className?: string
  size?: number
}

export default function KekeliLogo({ className = "", size = 32 }: LogoProps) {
  return (
    <img
      src="/imgkekeli.jpg"
      alt="Kekeli Logo"
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '0.5rem',
        objectFit: 'cover',
        flexShrink: 0,
        zIndex: 50,
        display: 'block'
      }}
      data-testid="kekeli-logo"
    />
  )
}
