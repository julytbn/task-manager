'use client'

export default function KekeliLogo({ className = "w-8 h-8" }: { className?: string }) {
  const classes = className || "w-8 h-8"
  return (
    <div 
      className={`${classes} bg-yellow-400 rounded-lg flex items-center justify-center font-black text-black flex-shrink-0`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FBBF24',
        borderRadius: '0.5rem'
      }}
    >
      <span style={{fontSize: 'inherit', fontWeight: 900, lineHeight: 1}}>K</span>
    </div>
  )
}
