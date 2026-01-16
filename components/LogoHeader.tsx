'use client';

import React from 'react';
import Link from 'next/link';

export default function LogoHeader() {
  return (
    <Link href="/dashboard" className="flex items-center h-full">
      <div className="relative flex items-center justify-center h-full px-2 md:px-3 group cursor-pointer gap-2">
        {/* Logo - Simple background with K */}
        <div className="relative flex-shrink-0 group-hover:scale-110 transition-transform duration-300 w-10 h-10 flex items-center justify-center rounded-lg bg-[#D4AF37] shadow-md">
          <span className="text-black font-bold text-lg">K</span>
        </div>
        
        {/* Text - Hidden on mobile */}
        <span className="text-xs md:text-sm font-bold text-gray-700 hidden md:inline-block truncate">
          KEKELI
        </span>
      </div>
    </Link>
  );
}
