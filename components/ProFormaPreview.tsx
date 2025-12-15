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
      <div className="mb-8 pb-6 border-b-4 border-blue-900">
        <div className="flex gap-8 mb-6">
          {/* Logo */}
          <div className="w-28 h-28 bg-yellow-400 rounded-lg flex items-center justify-center font-bold text-6xl flex-shrink-0 shadow-sm">
            ☀️
          </div>

          {/* Texte principal */}
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="text-5xl font-black text-blue-900 leading-tight mb-3">
              KEKELI<br />GROUP
            </h1>
            <div className="text-sm text-gray-800 font-medium leading-relaxed">
              <p>Comptabilité - Fiscalité -</p>
              <p>Rédaction & Gestion de Projet - Marketing -</p>
              <p>Communication</p>
              <p>Etude de marché - Formations - Coaching -</p>
              <p>Démarches Administratives</p>
              <p>Conceptions et Impressions - Solution IT</p>
            </div>
          </div>

          {/* Infos à droite */}
          <div className="text-right text-sm text-gray-700 flex-shrink-0 border-l-2 border-gray-400 pl-6 flex flex-col justify-center">
            <p className="font-semibold mb-2">Date: {formattedDate}</p>
            <p className="font-semibold mb-2">Numéro: PRO-{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
            <p className="font-semibold">Date d'échéance: {dateEcheance}</p>
          </div>
        </div>
      </div>

      {/* Client et objet */}
      <div className="mb-6">
        <p className="mb-2"><strong>Due par:</strong> {clientName}</p>
        <p><strong>Adresse:</strong> {clientAddress}</p>
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
            <tr className="bg-gray-900 text-white">
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
            <tr className="font-bold bg-gray-100">
              <td colSpan={2} className="border border-gray-800 text-right">TOTAL GLOBAL</td>
              <td className="border border-gray-800 text-right"></td>
              <td className="border border-gray-800 text-right text-lg">{totalHT.toLocaleString('fr-FR')} F CFA</td>
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

      {/* Notes */}
      {notes && (
        <div className="mb-6 p-4 border border-gray-300">
          <p><strong>Notes:</strong></p>
          <p className="text-xs whitespace-pre-wrap">{notes}</p>
        </div>
      )}

      {/* Signature et pied de page */}
      <div className="mt-12 pt-8 border-t-4 border-red-600">
        <div className="mb-8">
          <p className="text-center font-semibold">La Direction Générale</p>
        </div>

        <div className="text-center text-xs space-y-1 mt-8">
          <p><strong>CABINET KEKELI GROUP</strong></p>
          <p>RCCM: TG-LFW -01-2023-2023-B13-01308</p>
          <p>NIF: 1001854635</p>
          <p>Tél: (+228) 92681100 | Email: kekeligroup10@gmail.com</p>
          <p>Togolese Business Directory</p>
        </div>
      </div>
    </div>
  )
}
