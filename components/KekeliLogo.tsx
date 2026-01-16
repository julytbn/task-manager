'use client'

export default function KekeliLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg 
      className={className}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Yellow background */}
      <rect width="100" height="100" fill="#FBBF24" rx="8"/>
      
      {/* Black K letter */}
      <text 
        x="50" 
        y="70" 
        fontSize="70" 
        fontWeight="bold" 
        textAnchor="middle"
        fill="#000000"
        fontFamily="Arial, sans-serif"
      >
        K
      </text>
    </svg>
  )
}
