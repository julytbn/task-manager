'use client'

import React from 'react'

type ProFormaLigne = {
  id?: string
  designation: string
  montant: number
  intervenant?: string
  ordre?: number
}

type ProFormaPreviewProps = {
  clientName?: string
  clientAddress?: string
  description?: string
  dateEcheance?: string
  lignes: ProFormaLigne[]
  notes?: string
  elementId?: string
}

export default function ProFormaPreview({
  clientName = 'Nom du Client',
  clientAddress = 'Adresse du client',
  description = '',
  dateEcheance = new Date().toISOString().split('T')[0],
  lignes,
  notes = '',
  elementId = 'proforma-preview'
}: ProFormaPreviewProps) {
  const totalHT = lignes.reduce((sum, l) => sum + (l.montant || 0), 0)
  const now = new Date()
  const formattedDate = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`

  // Convertir montant en lettres
  const numberToWords = (num: number) => {
    const wholeNumber = Math.floor(num)
    const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf']
    const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf']
    const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix']
    
    if (wholeNumber === 0) return 'zéro'
    
    let words = ''
    const millions = Math.floor(wholeNumber / 1000000)
    const thousands = Math.floor((wholeNumber % 1000000) / 1000)
    const hundreds = Math.floor((wholeNumber % 1000) / 100)
    const remainder = wholeNumber % 100
    
    if (millions > 0) {
      words += millions + ' million' + (millions > 1 ? 's' : '') + ' '
    }
    
    if (thousands > 0) {
      words += thousands + ' mille '
    }
    
    if (hundreds > 0) {
      words += units[hundreds] + ' cent' + (hundreds > 1 ? 's' : '') + ' '
    }
    
    if (remainder >= 20) {
      words += tens[Math.floor(remainder / 10)]
      if (remainder % 10 > 0) {
        words += '-' + units[remainder % 10]
      }
    } else if (remainder >= 10) {
      words += teens[remainder - 10]
    } else if (remainder > 0) {
      words += units[remainder]
    }
    
    return words.trim()
  }

  return (
    <div id={elementId} className="bg-white p-8 font-serif text-gray-800" style={{ fontSize: '13px' }}>
      {/* Header avec logo et services */}
      <div className="mb-8 pb-6 border-b-4 border-[#D4AF37]">
        {/* Ligne 1: Logo + Nom + Services */}
        <div className="flex gap-6 items-start mb-8">
          {/* Logo */}
          <div 
            className="w-28 h-28 bg-black rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg border-2 border-[#D4AF37]"
            style={{
              boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)'
            }}
          >
            <img 
              src="/imgkekeli.jpg" 
              alt="Kekeli Logo" 
              className="w-full h-full object-contain"
              style={{
                filter: 'brightness(1.7) contrast(2.3) saturate(1.5)'
              }}
            />
          </div>

          {/* Texte principal */}
          <div className="flex-1 flex flex-col justify-start gap-2">
            <h1 className="text-5xl font-black text-[#1a3a6b] leading-tight">
              KEKELI GROUP
            </h1>
            <div className="text-sm text-gray-700 font-medium">
              <p className="leading-relaxed">Comptabilité - Fiscalité - Rédaction & Gestion de Projet - Marketing - Communication</p>
              <p className="leading-relaxed">Etude de marché - Formations - Coaching - Démarches Administratives</p>
              <p className="leading-relaxed">Conceptions et Impressions - Solution IT</p>
            </div>
          </div>
        </div>

        {/* Ligne 2: Infos (Date, Numéro, Échéance) - Alignées à droite */}
        <div className="text-right text-sm text-gray-700 flex justify-end gap-12">
          <div>
            <p className="font-semibold">Date: {formattedDate}</p>
          </div>
          <div>
            <p className="font-semibold">Numéro: PRO-{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
          </div>
          <div>
            <p className="font-semibold">Date d'échéance: {dateEcheance}</p>
          </div>
        </div>
      </div>

      {/* Client et objet */}
      <div className="mb-6">
        <p className="mb-2"><strong>Due par:</strong> {clientName}</p>
        <p><strong>Adresse:</strong> {clientAddress}</p>
        <div className="text-right text-sm text-gray-600 mt-4 pt-4 border-t border-gray-300">
          <p className="font-semibold">Pro Forma du {formattedDate}</p>
        </div>
      </div>

      {/* Objet */}
      {description && (
        <div className="mb-6 bg-yellow-50 p-3 border-l-4 border-yellow-400">
          <p className="text-center font-semibold">{description}</p>
        </div>
      )}

      {/* Tableau des services */}
      <div className="mb-6">
        <table className="w-full border-collapse border border-gray-800" cellPadding="8">
          <thead>
            <tr className="bg-[#1a3a6b] text-white">
              <th className="border border-gray-800 text-left font-bold">DESIGNATION</th>
              <th className="border border-gray-800 text-left font-bold">INTERVENANT</th>
              <th className="border border-gray-800 text-right font-bold">MONTANT À PAYER</th>
              <th className="border border-gray-800 text-right font-bold">MONTANT GLOBAL</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((ligne, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border border-gray-800">{ligne.designation}</td>
                <td className="border border-gray-800">{ligne.intervenant || '-'}</td>
                <td className="border border-gray-800 text-right">{ligne.montant.toLocaleString('fr-FR')}</td>
                <td className="border border-gray-800 text-right font-semibold">{ligne.montant.toLocaleString('fr-FR')}</td>
              </tr>
            ))}
            {/* Ligne Total */}
            <tr className="font-bold bg-[#D4AF37]/10 border-t-2 border-[#D4AF37]">
              <td colSpan={2} className="border border-gray-800 text-right">TOTAL GLOBAL</td>
              <td className="border border-gray-800 text-right"></td>
              <td className="border border-gray-800 text-right text-lg text-[#D4AF37]">{totalHT.toLocaleString('fr-FR')} F CFA</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Montant en lettres */}
      <div className="mb-6 bg-gray-50 p-4 border border-gray-300">
        <p className="text-center">
          Arrêter cette présente pro-forma à la somme de: <strong>{numberToWords(totalHT).toUpperCase()} FRANCS CFA</strong>
        </p>
      </div>

      {/* 📌 Clarification Frais et Main d'Œuvre */}
      <div className="mb-6 bg-blue-50 p-4 border-l-4 border-blue-500">
        <h3 className="font-bold text-sm text-blue-900 mb-3">📋 CLARIFICATION SUR LES FRAIS</h3>
        <div className="text-xs text-gray-700 space-y-2 leading-relaxed">
          <p>
            <strong>💼 Main d'Œuvre :</strong> Les montants ci-dessus incluent nos frais de prestation et la main d'œuvre 
            correspondante. Cette facturation rémunère les experts et professionnels impliqués dans ce projet.
          </p>
          <p>
            <strong>🔧 Frais de Prestation :</strong> Certains montants peuvent inclure des frais techniques ou administratifs 
            directement liés à l'exécution de la prestation.
          </p>
          <p>
            <strong>✅ Bénéfice Net :</strong> Après déduction des coûts externes et charges associées au projet, 
            le solde constitue le bénéfice net de KEKELI GROUP.
          </p>
        </div>
      </div>

      {/* Notes */}
      {notes && (
        <div className="mb-6 p-4 border border-gray-300">
          <p><strong>Notes:</strong></p>
          <p className="text-xs whitespace-pre-wrap">{notes}</p>
        </div>
      )}

      {/* Signature et pied de page */}
      <div className="mt-12 pt-8 border-t-4" style={{ borderTopColor: '#8B4513' }}>
        <div className="text-center text-xs space-y-1">
          <p style={{ color: '#D4AF37', fontWeight: 'bold', fontSize: '14px' }}>CABINET KEKELI GROUP</p>
          <p>RCCM: TG-LFW -01-2023-2023-B13-01308 &nbsp;&nbsp;&nbsp;&nbsp; NIF: 1001854635</p>
          <p>Totsi -Lomé contact : (+228) 92681100, e-mail: kekeligroup10@gmail.com</p>
          <p>Lomé-Togo</p>
        </div>
      </div>
    </div>
  )
}
