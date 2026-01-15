import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function LogoHeader() {
  return (
    <Link href="/dashboard">
      <div className="fixed left-0 top-0 z-50 w-[250px] h-16 bg-gradient-to-r from-[#0f0f0f] via-[#1a1a1a] to-[#0f0f0f] border-b border-r border-[var(--color-gold)]/20 flex items-center justify-center cursor-pointer hover:bg-gradient-to-r hover:from-[#1a1a1a] hover:via-[#242424] hover:to-[#1a1a1a] transition-all duration-300 shadow-xl group overflow-hidden">
        
        {/* Logo Image - Centré seul */}
        <div className="relative flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
          <Image 
            src="/imgkekeli.jpg" 
            alt="Kekeli Group" 
            width={50}
            height={50}
            priority
            className="object-contain drop-shadow-lg"
          />
        </div>
        
        {/* Shine effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent 
          opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
      </div>
    </Link>
  );
}
