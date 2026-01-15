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
      <td class="px-4 py-3 text-right font-semibold">${ligne.montant.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 })}</td>
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
          align-items: center;
          gap: 25px;
          flex: 1;
        }
        .company-logo { 
          width: 100px; 
          height: 80px;
          background-color: #000000;
          border: 2px solid #D4AF37;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
        }
        .company-logo img {
          max-width: 95%;
          max-height: 95%;
          object-fit: contain;
          filter: brightness(1.7) contrast(2.3) saturate(1.5);
        }
        .company-details {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .company-title { 
          font-size: 32px; 
          font-weight: bold; 
          color: #1a3a6b; 
          margin: 0 0 8px 0;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        .company-services {
          margin: 8px 0 0 0;
          font-size: 13px;
          line-height: 1.6;
          font-weight: normal;
          color: #333;
        }
        .company-services p {
          margin: 3px 0;
        }
        .company-info { 
          font-size: 13px; 
          line-height: 1.6; 
          color: #333; 
          margin: 3px 0;
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
            <div class="company-logo">
              <img src="/imgkekeli.jpg" alt="Kekeli Logo" />
            </div>
            <div class="company-details">
              <div class="company-title">KEKELI GROUP</div>
              
              <div class="company-services">
                <p><strong>Comptabilité - Fiscalité - Rédaction & Gestion de Projet</strong></p>
                <p>Marketing - Communication - Étude de marché</p>
                <p>Formations - Coaching - Démarches Administratives</p>
                <p>Conceptions et Impressions - Solution IT</p>
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
                <th style="text-align: right;">MONTANT (FCFA)</th>
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
              <td style="text-align: right;">${proForma.montant.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 })}</td>
            </tr>
          </table>
        </div>

        <!-- Notes -->
        ${proForma.notes ? `<div style="margin-top: 30px; padding: 15px; background: #f9f9f9; border-left: 4px solid #d4a574;">
          <strong>Notes:</strong>
          <p>${proForma.notes}</p>
        </div>` : ''}

        <!-- Footer -->
        <div class="footer" style="border-top: 4px solid #8B4513; padding-top: 20px; text-align: center; font-size: 11px;">
          <div style="color: #D4AF37; font-weight: bold; font-size: 12px; margin-bottom: 5px;">CABINET KEKELI GROUP</div>
          <div style="margin-bottom: 3px;">RCCM: TG-LFW -01-2023-2023-B13-01308 &nbsp;&nbsp;&nbsp;&nbsp; NIF: 1001854635</div>
          <div style="margin-bottom: 3px;">Totsi -Lomé contact : (+228) 92681100, e-mail: kekeligroup10@gmail.com</div>
          <div>Lomé-Togo</div>
        </div>
      </div>
    </body>
    </html>
  `
}
