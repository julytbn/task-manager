/**
 * Service de génération de factures PDF
 * Utilise html2pdf pour convertir HTML en PDF
 */

interface FactureData {
  id: string
  numero: string
  dateEmission: string
  dateEcheance?: string
  statut: string
  montant: number
  montantTotal: number
  tauxTVA?: number
  client: {
    id: string
    nom: string
    prenom?: string
    email?: string
    telephone?: string
    adresse?: string
  }
  projet?: {
    id: string
    titre: string
    description?: string
  }
  taches?: Array<{
    id: string
    titre: string
    montant?: number
    heuresReelles?: number
  }>
  montantPaye?: number
  paiements?: Array<{
    id?: string
    montant: number
    date?: string
    methode?: string
  }>
  entreprise?: {
    nom: string
    logo?: string
    adresse?: string
    email?: string
    telephone?: string
    siteWeb?: string
  }
  notes?: string
}

/**
 * Génère le HTML d'une facture
 */
export function generateFactureHTML(facture: FactureData): string {
  const entreprise = facture.entreprise || {
    nom: 'Kekeli Group',
    adresse: 'Attiégou, Lomé',
    email: 'contact@kekeligroup.com',
    telephone: '93366185',
    siteWeb: 'www.kekeligroup.com',
  }

  // Pas de TVA
  const montantSansTVA = facture.montant || facture.montantTotal
  const montantTVA = 0

  // Calcul du montant payé et du restant à payer
  const montantPaye = typeof facture.montantPaye === 'number'
    ? facture.montantPaye
    : (facture.paiements ? facture.paiements.reduce((s, p) => s + (p.montant || 0), 0) : 0)
  const restantAPayer = Math.max(0, facture.montantTotal - montantPaye)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatDevise = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Facture ${facture.numero}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', 'Arial', sans-serif;
          color: #222;
          background: #f4f7fa;
          padding: 32px;
        }
        .container {
          max-width: 850px;
          margin: 0 auto;
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.07);
          padding: 48px 40px 40px 40px;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 3px solid #0066cc;
          padding-bottom: 32px;
          margin-bottom: 36px;
        }
        
        .company-info h1 {
          color: #0066cc;
          font-size: 32px;
          margin-bottom: 8px;
          letter-spacing: 1px;
        }
        
        .company-info p {
          font-size: 13px;
          color: #444;
          line-height: 1.7;
          margin: 2px 0;
        }
        
        .invoice-details {
          text-align: right;
        }
        
        .invoice-details h2 {
          font-size: 26px;
          color: #0066cc;
          margin-bottom: 12px;
          letter-spacing: 1px;
        }
        
        .invoice-details p {
          font-size: 14px;
          color: #555;
          margin: 3px 0;
        }
        
        .invoice-number {
          font-weight: bold;
          color: #222;
          font-size: 16px;
        }
        
        .status-badge {
          display: inline-block;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          margin-top: 12px;
          letter-spacing: 0.5px;
        }
        
        .status-pending {
          background-color: #fff3cd;
          color: #856404;
        }
        
        .status-paid {
          background-color: #d4edda;
          color: #155724;
        }
        
        .client-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 44px;
        }
        
        .client-section {
          flex: 1;
        }
        
        .client-section h3 {
          font-size: 12px;
          font-weight: bold;
          color: #0066cc;
          text-transform: uppercase;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
        }
        
        .client-section p {
          font-size: 14px;
          color: #333;
          margin: 3px 0;
          line-height: 1.6;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 32px;
          border-radius: 8px;
          overflow: hidden;
        }
        
        thead {
          background-color: #f8f9fa;
          border-bottom: 2px solid #0066cc;
        }
        
        th {
          padding: 14px 10px;
          text-align: left;
          font-weight: bold;
          font-size: 13px;
          color: #222;
        }
        
        td {
          padding: 13px 10px;
          font-size: 14px;
          border-bottom: 1px solid #eee;
        }
        
        tr:hover {
          background-color: #f2f6fa;
        }
        
        .total-section {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 44px;
        }
        
        .total-box {
          width: 320px;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
          font-size: 14px;
        }
        
        .paid-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 14px;
          color: #155724;
        }

        .remaining-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          font-size: 15px;
          font-weight: 700;
          color: #a71d2a;
        }

        .total-row.total {
          border-bottom: 2px solid #0066cc;
          border-top: 2px solid #0066cc;
          font-weight: bold;
          font-size: 16px;
          padding: 12px 0;
          color: #0066cc;
        }
        
        .notes {
          background-color: #eaf4ff;
          padding: 18px;
          border-radius: 7px;
          font-size: 13px;
          color: #3a3a3a;
          margin-bottom: 32px;
        }
        
        .footer {
          border-top: 1px solid #eee;
          padding-top: 22px;
          text-align: center;
          font-size: 12px;
          color: #666;
          margin-top: 48px;
        }
        
        .footer p {
          margin: 3px 0;
        }
        
        @media print {
          body {
            padding: 0;
          }
          .container {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- En-tête -->
        <div class="header">
          <div class="company-info">
            <h1>${entreprise.nom}</h1>
            ${entreprise.adresse ? `<p>${entreprise.adresse}</p>` : ''}
            ${entreprise.telephone ? `<p>Tél: ${entreprise.telephone}</p>` : ''}
            ${entreprise.email ? `<p>Email: ${entreprise.email}</p>` : ''}
            ${entreprise.siteWeb ? `<p>Web: ${entreprise.siteWeb}</p>` : ''}
          </div>
          
          <div class="invoice-details">
            <h2>FACTURE</h2>
            <p><span class="invoice-number">${facture.numero}</span></p>
            <p>Émise le: <strong>${formatDate(facture.dateEmission)}</strong></p>
            ${facture.dateEcheance ? `<p>Échéance: <strong>${formatDate(facture.dateEcheance)}</strong></p>` : ''}
            <span class="status-badge ${facture.statut === 'PAYEE' ? 'status-paid' : 'status-pending'}">
              ${facture.statut === 'PAYEE' ? 'PAYÉE' : 'EN ATTENTE'}
            </span>
          </div>
        </div>
        
        <!-- Informations client -->
        <div class="client-info">
          <div class="client-section">
            <h3>Facturé à</h3>
            <p><strong>${facture.client.prenom ? facture.client.prenom + ' ' : ''}${facture.client.nom}</strong></p>
            ${facture.client.adresse ? `<p>${facture.client.adresse}</p>` : ''}
            ${facture.client.email ? `<p>${facture.client.email}</p>` : ''}
            ${facture.client.telephone ? `<p>${facture.client.telephone}</p>` : ''}
          </div>
          
          ${facture.projet ? `
          <div class="client-section">
            <h3>Projet</h3>
            <p><strong>${facture.projet.titre}</strong></p>
            ${facture.projet.description ? `<p>${facture.projet.description}</p>` : ''}
          </div>
          ` : ''}
        </div>
        
        <!-- Tableau des articles -->
        <table>
          <thead>
            <tr>
              <th style="width: 50%;">Description</th>
              <th style="width: 15%; text-align: right;">Quantité</th>
              <th style="width: 17.5%; text-align: right;">Montant Unitaire</th>
              <th style="width: 17.5%; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${facture.taches && facture.taches.length > 0 ? facture.taches.map(tache => `
              <tr>
                <td>${tache.titre}</td>
                <td style="text-align: right;">${tache.heuresReelles || 1}</td>
                <td style="text-align: right;">${formatDevise((tache.montant || 0) / (tache.heuresReelles || 1))}</td>
                <td style="text-align: right;">${formatDevise(tache.montant || 0)}</td>
              </tr>
            `).join('') : `
              <tr>
                <td>Prestations</td>
                <td style="text-align: right;">1</td>
                <td style="text-align: right;">${formatDevise(montantSansTVA)}</td>
                <td style="text-align: right;">${formatDevise(montantSansTVA)}</td>
              </tr>
            `}
          </tbody>
        </table>
        
        <!-- Totaux -->
        <div class="total-section">
          <div class="total-box">
            <div class="paid-row">
              <span>Montant payé</span>
              <span>${formatDevise(montantPaye)}</span>
            </div>
            <div class="remaining-row">
              <span>Restant à payer</span>
              <span>${formatDevise(restantAPayer)}</span>
            </div>
            <div class="total-row total">
              <span>TOTAL</span>
              <span>${formatDevise(facture.montantTotal)}</span>
            </div>
          </div>
        </div>
        
        ${facture.notes ? `
        <div class="notes">
          <strong>Notes:</strong><br>
          ${facture.notes}
        </div>
        ` : ''}
        
        <!-- Pied de page -->
        <div class="footer">
          <p>Merci pour votre confiance</p>
          <p>Cette facture a été générée automatiquement</p>
          <p style="margin-top: 10px; border-top: 1px solid #ccc; padding-top: 10px;">
            ${new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Télécharge une facture en PDF
 * Nécessite la bibliothèque html2pdf
 */
export async function downloadFacturePDF(facture: FactureData) {
  // Vérifier que html2pdf est disponible
  if (typeof window === 'undefined') {
    console.error('html2pdf n\'est disponible que côté client')
    return
  }

  // Charger html2pdf depuis CDN si nécessaire
  if (!(window as any).html2pdf) {
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
    script.onload = () => {
      generatePDF(facture)
    }
    document.head.appendChild(script)
  } else {
    generatePDF(facture)
  }
}

function generatePDF(facture: FactureData) {
  const html = generateFactureHTML(facture)
  const element = document.createElement('div')
  element.innerHTML = html

  const options = {
    margin: 5,
    filename: `Facture_${facture.numero}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
  }

  ;(window as any).html2pdf().set(options).from(element).save()
}

/**
 * Ouvre l'aperçu d'une facture dans une nouvelle fenêtre
 */
export function previewFacturePDF(facture: FactureData) {
  const html = generateFactureHTML(facture)
  const newWindow = window.open()
  if (newWindow) {
    newWindow.document.write(html)
    newWindow.document.close()
  }
}
