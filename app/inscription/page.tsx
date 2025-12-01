'use client'

import { Suspense } from 'react'
import InscriptionContent from './inscription-content'

export default function InscriptionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
      <InscriptionContent />
    </Suspense>
  )
}
