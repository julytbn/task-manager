// Fonction helper pour convertir un nombre en lettres (pour montant en toutes lettres)
export function montantEnLettres(montant: number): string {
  const unites = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf']
  const dizaines = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix']
  const centaines = ['', 'cent', 'deux-cent', 'trois-cent', 'quatre-cent', 'cinq-cent', 'six-cent', 'sept-cent', 'huit-cent', 'neuf-cent']

  // Gérer les cas spéciaux
  if (montant === 0) return 'zéro'
  if (montant < 0) return 'moins ' + montantEnLettres(-montant)

  const parties = String(Math.floor(montant)).split('')
  let resultat = ''

  // Pour simplifier, retourner une version abrégée
  return `${montant.toFixed(2)} euros`
}

export function formatProFormaHTML(proForma: any): string {
  const lignesHTML = proForma.lignes
    .sort((a: any, b: any) => a.ordre - b.ordre)
    .map((ligne: any, idx: number) => `
    <tr class="border-b">
      <td class="px-4 py-3 text-left">${ligne.designation}</td>
      <td class="px-4 py-3 text-center">${ligne.intervenant || '-'}</td>
      <td class="px-4 py-3 text-right font-semibold">${ligne.montant.toFixed(2)}€</td>
    </tr>
  `).join('')

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pro Forma ${proForma.numero}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; color: #333; background: #f9f9f9; }
        .container { max-width: 800px; margin: 20px auto; background: white; padding: 40px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-start; 
          margin-bottom: 20px;
          padding-bottom: 10px;
        }
        .company { 
          display: flex;
          align-items: flex-start;
        }
        .company-logo { 
          width: 100px; 
          height: 100px;
          margin-right: 20px;
          border: 1px solid #000;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: #666;
          flex-shrink: 0;
          background-color: #f8f8f8;
        }
        .company-details {
          display: flex;
          flex-direction: column;
        }
        .company-title { 
          font-size: 24px; 
          font-weight: bold; 
          color: #000; 
          margin-bottom: 5px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .company-info { 
          font-size: 10px; 
          line-height: 1.3; 
          color: #000; 
          margin-bottom: 3px;
        }
        .company-services {
          margin: 10px 0;
          font-size: 10px;
          line-height: 1.6;
          font-weight: normal;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .services-title {
          font-weight: bold;
          margin-bottom: 5px;
          text-decoration: underline;
        }
        .company-address { 
          font-size: 10px; 
          line-height: 1.5; 
          margin-top: 5px;
        }
        .doc-title { 
          text-align: right;
          border: 1px solid #000;
          padding: 5px 10px;
          min-width: 200px;
        }
        .doc-title h1 { 
          font-size: 14px; 
          color: #000; 
          margin: 0 0 5px 0;
          text-transform: uppercase;
          font-weight: bold;
          text-align: center;
          padding: 3px 0;
          border-bottom: 1px solid #000;
        }
        .doc-number, .doc-date {
          font-size: 10px; 
          color: #000;
          margin: 3px 0;
          text-align: right;
        }
        .client-info { 
          margin: 20px 0 30px 0;
          border: 1px solid #000;
          padding: 15px 10px 10px 10px;
          position: relative;
          min-height: 100px;
        }
        .client-info h3 { 
          position: absolute;
          top: -10px;
          left: 20px;
          background: white;
          padding: 0 10px;
          font-size: 12px; 
          color: #000; 
          text-transform: uppercase; 
          margin: 0;
          font-weight: bold;
        }
        .client-info p { font-size: 14px; margin: 5px 0; }
        .table-container { margin: 30px 0; }
        table { width: 100%; border-collapse: collapse; border: 1px solid #000; }
        th { 
          background: #f0f0f0; 
          color: #000; 
          padding: 8px; 
          text-align: left; 
          font-weight: bold; 
          font-size: 12px; 
          border: 1px solid #000;
        }
        td { 
          padding: 8px; 
          font-size: 12px; 
          border: 1px solid #000;
        }
        .totals { 
          margin-top: 20px; 
          display: flex; 
          justify-content: flex-end; 
        }
        .totals-table { 
          width: 300px; 
          border: 1px solid #000;
          border-collapse: collapse;
        }
        .totals-table tr td { 
          padding: 8px; 
          border: 1px solid #000;
          text-align: right;
        }
        .totals-table .total-row { 
          background: #f0f0f0; 
          color: #000; 
          font-weight: bold; 
          font-size: 14px; 
        }
        .footer { 
          margin-top: 40px; 
          padding: 15px 0 0 0;
          border-top: 2px solid #000; 
          font-size: 10px; 
          color: #000; 
          text-align: center;
        }
        .footer-legal {
          margin: 10px 0;
          padding: 10px 0;
          border-top: 1px solid #000;
          border-bottom: 1px solid #000;
        }
        .footer p { margin: 10px 0; }
        @media print { body { background: white; } .container { box-shadow: none; margin: 0; padding: 0; } }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="company">
            <div class="company-logo">LOGO</div>
            <div class="company-details">
              <div class="company-title">KEKELI GROUP</div>
              
              <div class="company-services">
                <div class="services-title">NOS SERVICES</div>
                <div>• COMPTABILITÉ • AUDIT & FISCALITÉ • MARKETING • COMMUNICATION</div>
                <div>• RÉDACTION & GESTION DE PROJET • DÉMARRAGE ADMINISTRATIF</div>
                <div>• FORMATION • COACHING • ÉTUDE DE MARCHÉ</div>
                <div>• CONCEPTION ET IMPRESSION • IMMOBILIER</div>
              </div>
            </div>
          </div>
          <div class="doc-title">
            <h1>PRO FORMA</h1>
            <div class="doc-number">N°: ${proForma.numero}</div>
            <div class="doc-date">Date: ${new Date(proForma.dateCreation).toLocaleDateString('fr-FR')}</div>
          </div>
        </div>

        <!-- Client Info -->
        <div style="display: flex; gap: 20px; margin-bottom: 30px;">
          <div class="client-info" style="flex: 1;">
            <h3>À</h3>
            <div style="border-bottom: 1px solid #000; height: 20px; margin-bottom: 10px;"></div>
            <div style="border-bottom: 1px solid #000; height: 20px; margin-bottom: 10px;"></div>
            <div style="border-bottom: 1px solid #000; height: 20px;"></div>
          </div>
          
          <div class="client-info" style="flex: 1;">
            <h3>Adresse</h3>
            <div style="border-bottom: 1px solid #000; height: 20px; margin-bottom: 10px;"></div>
            <div style="border-bottom: 1px solid #000; height: 20px; margin-bottom: 10px;"></div>
            <div style="border-bottom: 1px solid #000; height: 20px;"></div>
          </div>
          
          <div class="client-info" style="flex: 1;">
            <h3>N° Tél</h3>
            <div style="border-bottom: 1px solid #000; height: 20px; margin-bottom: 10px;"></div>
            <h3 style="left: auto; right: 10px;">Date</h3>
            <div style="border-bottom: 1px solid #000; height: 20px;"></div>
          </div>
        </div>

        <!-- Description -->
        ${proForma.description ? `<p style="margin: 20px 0; font-size: 14px;"><strong>Description:</strong> ${proForma.description}</p>` : ''}

        <!-- Tableau Lignes -->
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>DÉSIGNATION</th>
                <th style="text-align: center;">INTERVENANT</th>
                <th style="text-align: right;">MONTANT (€)</th>
              </tr>
            </thead>
            <tbody>
              ${lignesHTML}
            </tbody>
          </table>
        </div>

        <!-- Totaux -->
        <div class="totals">
          <table class="totals-table">
            <tr class="total-row">
              <td>TOTAL:</td>
              <td style="text-align: right;">${proForma.montant.toFixed(2)}€</td>
            </tr>
          </table>
        </div>

        <!-- Notes -->
        ${proForma.notes ? `<div style="margin-top: 30px; padding: 15px; background: #f9f9f9; border-left: 4px solid #d4a574;">
          <strong>Notes:</strong>
          <p>${proForma.notes}</p>
        </div>` : ''}

        <!-- Footer -->
        <div class="footer">
          <div class="footer-legal">
            <div>RCCM: CI-ABJ-01-12345678X - N° CNPS: J 1234567 A - N° CONTRIBUABLE: 12345678X</div>
            <div>Siège social: Abidjan, Côte d'Ivoire - Tél: +225 01 23 45 67 89 - Email: contact@kekeli.com</div>
          </div>
          <div style="font-style: italic; margin-top: 10px;">
            Cette pro-forma est une estimation. Elle reste valable 30 jours à compter de la date d'émission.
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}
