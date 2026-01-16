'use client';

import React from 'react';
import Link from 'next/link';

export default function LogoHeader() {
  return (
    <Link href="/dashboard" className="flex items-center h-full px-4 py-3">
      <div className="flex flex-col items-start">
        <div className="flex items-center gap-2">
          <div className="relative flex-shrink-0 group-hover:scale-105 transition-transform duration-300 w-10 h-10 flex items-center justify-center rounded-lg overflow-hidden">
            <img 
              src="/imgkekeli.jpg" 
              alt="KEKELI GROUP Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="hidden md:block">
            <div className="text-base font-bold text-[var(--color-gold)]">KEKELI GROUP</div>
            <div className="text-xs text-gray-300">Cabinet d'expertise</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
