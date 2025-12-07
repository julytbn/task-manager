import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Constantes de l'entreprise
const COMPANY_INFO = {
  name: 'KEKELI GROUP SARL',
  address: 'Adresse: Route de Cotonou, Abomey-Calavi',
  phone: 'Téléphone: +229 95 44 00 00',
  email: 'Email: contact@kekeli.com',
  rccm: 'N° RCCM: RC/1234567',
  ifu: 'N° IFU: 1234567890',
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const facture = await prisma.facture.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        projet: true,
        service: true,
      }
    })

    if (!facture) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 })
    }

    // Calculs des montants
    const montantHT = facture.montant || 0
    const tauxTVA = facture.tauxTVA || 0.18
    const montantTVA = montantHT * tauxTVA
    const montantTTC = montantHT + montantTVA

    // Déterminer le mode de facturation (à améliorer selon votre logique métier)
    const modeFacturation = 'Abonnement Mensuel'

    const htmlContent = `
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
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #fff;
            color: #333;
            line-height: 1.6;
          }
          
          .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 40px;
            background: white;
          }
          
          @media print {
            body { background: white; }
            .container { padding: 0; }
          }
          
          /* EN-TÊTE */
          .header {
            border-bottom: 3px solid #2c5aa0;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          
          .company-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
          }
          
          .company-info {
            flex: 1;
          }
          
          .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #2c5aa0;
            margin-bottom: 5px;
          }
          
          .company-details {
            font-size: 12px;
            color: #666;
            line-height: 1.5;
          }
          
          .invoice-title-box {
            text-align: right;
          }
          
          .invoice-title {
            font-size: 32px;
            font-weight: bold;
            color: #2c5aa0;
            margin-bottom: 5px;
          }
          
          .invoice-number {
            font-size: 14px;
            color: #666;
          }
          
          /* INFORMATIONS FACTURE */
          .invoice-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 5px;
          }
          
          .info-section {
            font-size: 13px;
          }
          
          .info-label {
            font-weight: bold;
            color: #2c5aa0;
            margin-bottom: 5px;
          }
          
          .info-content {
            color: #555;
            line-height: 1.6;
          }
          
          /* CLIENT */
          .client-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
          }
          
          .section-title {
            font-weight: bold;
            color: #2c5aa0;
            margin-bottom: 10px;
            font-size: 13px;
            text-transform: uppercase;
          }
          
          .client-info {
            font-size: 13px;
            line-height: 1.8;
          }
          
          /* TABLEAU DES SERVICES */
          .services-section {
            margin-bottom: 30px;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 13px;
          }
          
          thead {
            background-color: #2c5aa0;
            color: white;
          }
          
          th {
            padding: 12px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #2c5aa0;
          }
          
          td {
            padding: 12px;
            border: 1px solid #ddd;
          }
          
          tbody tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          
          .text-right {
            text-align: right;
          }
          
          /* TOTAUX */
          .totals-section {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 30px;
            margin-top: 20px;
          }
          
          .totals-box {
            width: 350px;
            border: 2px solid #2c5aa0;
            border-radius: 5px;
            overflow: hidden;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 15px;
            border-bottom: 1px solid #eee;
            font-size: 13px;
          }
          
          .total-row:last-child {
            border-bottom: none;
          }
          
          .total-row.total {
            background-color: #2c5aa0;
            color: white;
            font-weight: bold;
            font-size: 16px;
            padding: 15px;
          }
          
          .total-label {
            font-weight: 600;
          }
          
          .total-amount {
            font-weight: 600;
          }
          
          /* STATUT */
          .status-section {
            margin-bottom: 30px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 5px;
            font-size: 13px;
          }
          
          .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 3px;
            font-weight: bold;
            font-size: 12px;
          }
          
          .status-en-attente {
            background-color: #ffc107;
            color: #333;
          }
          
          .status-payee {
            background-color: #28a745;
            color: white;
          }
          
          .status-impayee {
            background-color: #dc3545;
            color: white;
          }
          
          /* NOTES */
          .notes-section {
            margin-bottom: 30px;
            padding: 15px;
            background-color: #e8f4f8;
            border-left: 4px solid #2c5aa0;
            border-radius: 3px;
            font-size: 13px;
            color: #333;
          }
          
          .notes-title {
            font-weight: bold;
            color: #2c5aa0;
            margin-bottom: 8px;
          }
          
          /* PIED DE PAGE */
          .footer {
            border-top: 2px solid #2c5aa0;
            padding-top: 20px;
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          
          .footer-text {
            margin: 5px 0;
          }
          
          .legal-notice {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            font-size: 11px;
            color: #999;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- EN-TÊTE -->
          <div class="header">
            <div class="company-header">
              <div class="company-info">
                <div class="company-name">${COMPANY_INFO.name}</div>
                <div class="company-details">
                  <div>${COMPANY_INFO.address}</div>
                  <div>${COMPANY_INFO.phone}</div>
                  <div>${COMPANY_INFO.email}</div>
                  <div>${COMPANY_INFO.rccm}</div>
                  <div>${COMPANY_INFO.ifu}</div>
                </div>
              </div>
              <div class="invoice-title-box">
                <div class="invoice-title">FACTURE</div>
                <div class="invoice-number">N° ${facture.numero}</div>
              </div>
            </div>
          </div>

          <!-- INFORMATIONS FACTURE -->
          <div class="invoice-info">
            <div class="info-section">
              <div class="info-label">DATE D'ÉMISSION</div>
              <div class="info-content">${new Date(facture.dateEmission).toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' })}</div>
            </div>
            <div class="info-section">
              <div class="info-label">DATE D'ÉCHÉANCE</div>
              <div class="info-content">${facture.dateEcheance ? new Date(facture.dateEcheance).toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : 'Non définie'}</div>
            </div>
            <div class="info-section">
              <div class="info-label">MODE DE FACTURATION</div>
              <div class="info-content">${modeFacturation}</div>
            </div>
            <div class="info-section">
              <div class="info-label">RÉFÉRENCE CLIENT</div>
              <div class="info-content">#${facture.clientId}</div>
            </div>
          </div>

          <!-- CLIENT ET ENTREPRISE -->
          <div class="client-section">
            <div>
              <div class="section-title">Facturé à:</div>
              <div class="client-info">
                <strong>${facture.client?.nom || 'Client'}</strong><br>
                ${facture.client?.adresse ? facture.client.adresse + '<br>' : ''}
                ${facture.client?.email ? '📧 ' + facture.client.email + '<br>' : ''}
                ${facture.client?.telephone ? '📞 ' + facture.client.telephone + '<br>' : ''}
              </div>
            </div>
            <div>
              <div class="section-title">Entreprise:</div>
              <div class="client-info">
                <strong>${COMPANY_INFO.name}</strong><br>
                ${COMPANY_INFO.address}<br>
                ${COMPANY_INFO.phone}
              </div>
            </div>
          </div>

          <!-- TABLEAU DES SERVICES -->
          <div class="services-section">
            <div class="section-title">Description des services</div>
            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Description</th>
                  <th class="text-right">Qté</th>
                  <th class="text-right">PU (FCFA)</th>
                  <th class="text-right">Total (FCFA)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>${facture.service?.nom || facture.projet?.titre || 'Service'}</strong></td>
                  <td>${facture.service?.description || facture.projet?.description || 'Service facturé'}</td>
                  <td class="text-right">1</td>
                  <td class="text-right">${montantHT.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td class="text-right"><strong>${montantHT.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- RÉSUMÉ FINANCIER -->
          <div class="totals-section">
            <div class="totals-box">
              <div class="total-row">
                <span class="total-label">Sous-total HT:</span>
                <span class="total-amount">${montantHT.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FCFA</span>
              </div>
              <div class="total-row">
                <span class="total-label">TVA (${(tauxTVA * 100).toFixed(0)}%):</span>
                <span class="total-amount">${montantTVA.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FCFA</span>
              </div>
              <div class="total-row total">
                <span>MONTANT TOTAL TTC:</span>
                <span>${montantTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FCFA</span>
              </div>
            </div>
          </div>

          <!-- STATUT -->
          <div class="status-section">
            <strong>Statut:</strong>
            <span class="status-badge ${facture.statut === 'PAYEE' ? 'status-payee' : facture.statut === 'EN_ATTENTE' ? 'status-en-attente' : 'status-impayee'}">
              ${facture.statut === 'PAYEE' ? '✓ PAYÉE' : facture.statut === 'EN_ATTENTE' ? '⏳ EN ATTENTE' : '✗ IMPAYÉE'}
            </span>
          </div>

          <!-- NOTES -->
          ${facture.notes ? `
            <div class="notes-section">
              <div class="notes-title">📋 Notes:</div>
              <div>${facture.notes.replace(/\n/g, '<br>')}</div>
            </div>
          ` : ''}

          <!-- INSTRUCTIONS DE PAIEMENT -->
          <div class="notes-section">
            <div class="notes-title">💳 Instructions de paiement:</div>
            <div>
              Merci de régler votre facture avant la date d'échéance.
              <br><br>
              <strong>Moyens de paiement acceptés:</strong>
              <ul style="margin-left: 20px; margin-top: 8px;">
                <li>Virement bancaire</li>
                <li>Chèque</li>
                <li>Paiement mobile</li>
              </ul>
            </div>
          </div>

          <!-- PIED DE PAGE -->
          <div class="footer">
            <div class="footer-text">📧 Merci pour votre confiance!</div>
            <div class="footer-text">🙏 Nous apprécions vos affaires</div>
            <div class="legal-notice">
              Facture générée automatiquement le ${new Date().toLocaleDateString('fr-FR')}
              <br>
              ${COMPANY_INFO.name} - Tous droits réservés © 2025
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="FACTURE_${facture.numero}.html"`
      }
    })

  } catch (error) {
    console.error('Erreur téléchargement facture:', error)
    return NextResponse.json({ error: 'Erreur téléchargement facture' }, { status: 500 })
  }
}
