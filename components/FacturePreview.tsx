'use client'

import React from 'react'

type FactureLigne = {
  id?: string
  designation: string
  montant: number
  intervenant?: string
  ordre?: number
}

type FacturePreviewProps = {
  clientName?: string
  clientAddress?: string
  numeroFacture?: string
  dateEmission?: string
  dateEcheance?: string
  description?: string
  lignes: FactureLigne[]
  montant?: number
  tauxTVA?: number
  notes?: string
  statut?: string
  elementId?: string
}

export default function FacturePreview({
  clientName = 'Nom du Client',
  clientAddress = 'Adresse du client',
  numeroFacture = 'FACT-2024-001',
  dateEmission = new Date().toISOString().split('T')[0],
  dateEcheance = '',
  description = '',
  lignes = [],
  montant = 0,
  tauxTVA = 18,
  notes = '',
  statut = 'EN_ATTENTE',
  elementId = 'facture-preview'
}: FacturePreviewProps) {
  const totalHT = lignes.length > 0 ? lignes.reduce((sum, l) => sum + (l.montant || 0), 0) : montant
  const montantTVA = totalHT * (tauxTVA || 18) / 100
  const totalTTC = totalHT + montantTVA
  
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
            <p className="font-semibold mb-2">Numéro: {numeroFacture}</p>
            {dateEcheance && <p className="font-semibold">Échéance: {dateEcheance}</p>}
            <p className="font-semibold text-red-600 mt-2">Statut: {statut}</p>
          </div>
        </div>
      </div>

      {/* Client et objet */}
      <div className="mb-6">
        <p className="mb-2"><strong>Facturé à:</strong> {clientName}</p>
        <p><strong>Adresse:</strong> {clientAddress}</p>
      </div>

      {/* Objet */}
      {description && (
        <div className="mb-6 bg-yellow-50 p-3 border-l-4 border-yellow-400">
          <p className="text-center font-semibold">{description}</p>
        </div>
      )}

      {/* Tableau des services/lignes */}
      <div className="mb-6">
        <table className="w-full border-collapse border border-gray-800" cellPadding="8">
          <thead>
            <tr className="bg-gray-900 text-white">
              <th className="border border-gray-800 text-left font-bold">DESIGNATION</th>
              <th className="border border-gray-800 text-left font-bold">INTERVENANT</th>
              <th className="border border-gray-800 text-right font-bold">MONTANT</th>
            </tr>
          </thead>
          <tbody>
            {lignes.length > 0 ? (
              lignes.map((ligne, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border border-gray-800">{ligne.designation}</td>
                  <td className="border border-gray-800">{ligne.intervenant || '-'}</td>
                  <td className="border border-gray-800 text-right">{ligne.montant.toLocaleString('fr-FR')}</td>
                </tr>
              ))
            ) : (
              <tr className="hover:bg-gray-50">
                <td colSpan={3} className="border border-gray-800 text-center text-gray-500">-</td>
              </tr>
            )}
            {/* Ligne Total HT */}
            <tr className="font-bold bg-gray-100">
              <td colSpan={2} className="border border-gray-800 text-right">TOTAL HT</td>
              <td className="border border-gray-800 text-right text-lg">{totalHT.toLocaleString('fr-FR')} F CFA</td>
            </tr>
            {/* Ligne TVA */}
            <tr className="font-semibold bg-gray-50">
              <td colSpan={2} className="border border-gray-800 text-right">TVA ({tauxTVA}%)</td>
              <td className="border border-gray-800 text-right">{montantTVA.toLocaleString('fr-FR')} F CFA</td>
            </tr>
            {/* Ligne Total TTC */}
            <tr className="font-bold bg-blue-100">
              <td colSpan={2} className="border border-gray-800 text-right">TOTAL TTC</td>
              <td className="border border-gray-800 text-right text-lg text-blue-900">{totalTTC.toLocaleString('fr-FR')} F CFA</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Montant en lettres */}
      <div className="mb-6 bg-gray-50 p-4 border border-gray-300">
        <p className="text-center">
          Arrêter cette présente facture à la somme de: <strong>{numberToWords(totalTTC).toUpperCase()} FRANCS CFA</strong>
        </p>
      </div>

      {/* 📌 Clarification Frais et Main d'Œuvre */}
      <div className="mb-6 bg-blue-50 p-4 border-l-4 border-blue-500">
        <h3 className="font-bold text-sm text-blue-900 mb-3">📋 CLARIFICATION SUR LES FRAIS</h3>
        <div className="text-xs text-gray-700 space-y-2 leading-relaxed">
          <p>
            <strong>💼 Main d'Œuvre :</strong> Les montants facturés incluent nos frais de prestation et la main d'œuvre 
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
