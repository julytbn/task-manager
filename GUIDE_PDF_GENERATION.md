# 📄 CONFIGURATION PDF GENERATION - PRODUCTION

## ✅ Status: 80% Implémenté

### Existant:
```typescript
✅ Endpoint: GET /api/factures/[id]/download
✅ HTML généré pour factures
✅ Facture affichable en navigateur (HTML view)
✅ Prêt pour export PDF
```

### À faire (20%):
```
❌ Installer package pdfkit ou puppeteer
❌ Tester conversion HTML → PDF
❌ Valider mise en page PDF
❌ Configurer pour proformas
```

---

## 🛠️ INSTALLATION

### Option 1: Puppeteer (Recommandé - Qualité maximale)

**Pros:**
- HTML to PDF parfait
- Rendu identique au navigateur
- Supporte CSS complexe, images, etc.

**Cons:**
- Plus lourd (~150MB Chrome)
- Plus lent (~2-5s par PDF)

```bash
# Installation
npm install puppeteer

# Ajouter au .env
PDF_ENGINE=puppeteer
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false

# Pour Vercel (serverless):
npm install @sparticuz/chromium
```

### Option 2: PDFKit (Léger et rapide)

**Pros:**
- Très léger (~5MB)
- Rapide (~100ms par PDF)
- Parfait pour Vercel

**Cons:**
- Support HTML limité
- Besoin de parser HTML soi-même

```bash
# Installation
npm install pdfkit

# .env
PDF_ENGINE=pdfkit
```

### Option 3: HTML2PDF API (Cloud)

**Pros:**
- Zéro dépendance serveur
- Toujours à jour
- Cloud-based

**Cons:**
- Coûts par API call (~$0.01-0.05/PDF)
- Limite de débit
- Dépendance externe

```bash
# Installation
npm install node-fetch

# .env
PDF_ENGINE=html2pdf
HTML2PDF_API_KEY=your_api_key_here
```

---

## 📝 CONFIGURATION & TESTS

### Installation Complète Recommandée

```bash
# 1. Installer les dépendances
npm install puppeteer pdfkit

# 2. Configurer .env
cat > .env.local << 'EOF'
# PDF Generation
PDF_ENGINE=puppeteer
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
PDF_TEMP_DIR=./storage/pdfs
PDF_RETENTION_DAYS=30

# Pour Vercel:
# npm install @sparticuz/chromium
EOF

# 3. Ajouter au package.json
npm install --save-dev puppeteer-extra puppeteer-extra-plugin-stealth

# 4. Tester configuration
npm run test:pdf
```

### Script de Test

```typescript
// scripts/test-pdf.js
const puppeteer = require('puppeteer');

async function testPDF() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setContent(`
    <html>
      <body style="font-family: Arial; padding: 20px;">
        <h1>Test PDF Generation</h1>
        <p>Si vous voyez ce texte en PDF, la configuration fonctionne!</p>
      </body>
    </html>
  `);
  
  const pdf = await page.pdf({ format: 'A4' });
  const fs = require('fs');
  fs.writeFileSync('./test.pdf', pdf);
  
  console.log('✅ PDF créé: test.pdf');
  
  await browser.close();
}

testPDF().catch(console.error);
```

Exécution:
```bash
node scripts/test-pdf.js
# Devrait créer test.pdf
```

---

## 🧪 TESTS ENDPOINTS

### Test 1: Facture en PDF

```bash
# Récupérer une facture
FACTURE_ID="123e4567-e89b-12d3-a456-426614174000"

# Télécharger en HTML (actuel)
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/factures/$FACTURE_ID/download \
  -H "Accept: text/html"

# Télécharger en PDF (après config)
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/factures/$FACTURE_ID/download \
  -H "Accept: application/pdf" \
  -o facture.pdf

# Vérifier le fichier
file facture.pdf
# Expected: PDF document, version 1.4
```

### Test 2: Performance

```bash
# Mesurer temps de génération
time curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/factures/$FACTURE_ID/download \
  -H "Accept: application/pdf" \
  -o facture.pdf

# Expected: ~2-5s avec Puppeteer
# Expected: ~100ms avec PDFKit
```

### Test 3: Mise en page

```bash
# Ouvrir le PDF généré
open facture.pdf  # macOS
xdg-open facture.pdf  # Linux
start facture.pdf  # Windows

# Vérifier:
# ✅ Format A4 correct
# ✅ Marges alignées
# ✅ Logo visible
# ✅ Tableaux lisibles
# ✅ Pas de coupures de lignes
```

---

## ⚡ OPTIMISATIONS PRODUCTION

### 1. Caching des PDFs

```typescript
// Générer PDF une seule fois, réutiliser après
import { redis } from '@/lib/redis'

export async function GET(request: Request) {
  const facture = await getFacture(id)
  
  // Clé cache unique
  const cacheKey = `pdf:facture:${id}:${facture.updatedAt.getTime()}`
  
  // Vérifier cache
  const cached = await redis.getBuffer(cacheKey)
  if (cached) {
    console.log('📦 PDF depuis cache')
    return new Response(cached, { headers: { 'Content-Type': 'application/pdf' } })
  }
  
  // Générer nouveau PDF
  const pdf = await generatePDF(html)
  
  // Mettre en cache (24h)
  await redis.setex(cacheKey, 24 * 3600, pdf)
  
  return new Response(pdf, { headers: { 'Content-Type': 'application/pdf' } })
}
```

### 2. Générer Asynchrone

```typescript
// Pour PDFs lourds (>100 pages), générer en background
import Bull from 'bull'

const pdfQueue = new Bull('pdf-generation')

// Endpoint: Démarrer génération
export async function POST(request: Request) {
  const job = await pdfQueue.add({ factureId: id })
  
  return NextResponse.json({
    jobId: job.id,
    status: 'En cours de génération',
    downloadUrl: `/api/download/${job.id}`
  })
}

// Worker: Traiter asynchrone
pdfQueue.process(async (job) => {
  const pdf = await generatePDF(...)
  await storage.save(`pdfs/${job.id}.pdf`, pdf)
  return { success: true }
})
```

### 3. Compression

```typescript
// Réduire taille PDF
import pdfCompress from 'pdf-compress'

const pdf = await generatePDF(html)
const compressed = await pdfCompress.compress(pdf, {
  quality: 'good',  // good | average | low
  imageQuality: 80
})

// Ratio de compression: 30-50%
console.log(`Original: ${pdf.length}, Compressé: ${compressed.length}`)
```

### 4. Watermark / Sécurité

```typescript
// Ajouter watermark à chaque PDF
import { PDFDocument, degrees, rgb } from 'pdf-lib'

const pdfDoc = await PDFDocument.load(pdfBuffer)
const pages = pdfDoc.getPages()

pages.forEach(page => {
  const { width, height } = page.getSize()
  page.drawText('CONFIDENTIEL', {
    x: width / 2 - 50,
    y: height / 2,
    size: 60,
    color: rgb(1, 0, 0),
    opacity: 0.3,
    rotate: degrees(45)
  })
})

const pdfWithWatermark = await pdfDoc.save()
return new Response(pdfWithWatermark)
```

---

## 🚀 DEPLOYMENT VERCEL

### Configuration pour Vercel Serverless

```bash
# package.json
{
  "dependencies": {
    "puppeteer": "^21.0.0",
    "@sparticuz/chromium": "^118.0.0"
  }
}

# lib/pdf.ts (adapter)
import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'

export async function generatePDFOnVercel(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  })
  
  const page = await browser.newPage()
  await page.setContent(html)
  const pdf = await page.pdf({ format: 'A4' })
  
  await browser.close()
  return pdf
}
```

### Timeouts Vercel

```typescript
// Vercel fonction serverless: max 60s (pro) ou 10s (hobby)
// PDFs complexes peuvent timeout

export const config = {
  maxDuration: 60  // Pro plan required
}

export async function GET(request: Request) {
  // Doit compléter en < 60s
  const pdf = await generatePDF(html)
  return new Response(pdf)
}
```

---

## 📊 CHECKLIST IMPLEMENTATION

### Phase 1: Setup (30 min)
- [ ] npm install puppeteer pdfkit
- [ ] Configurer .env PDF_ENGINE
- [ ] Script test-pdf.js créé et testé
- [ ] Vérifier fichiers PDF générés

### Phase 2: Integration (1 heure)
- [ ] Endpoint /api/factures/[id]/download retourne PDF
- [ ] Test téléchargement: `curl ... -o facture.pdf`
- [ ] Vérifier mise en page
- [ ] Tester avec plusieurs factures

### Phase 3: Optimisation (1 heure)
- [ ] Caching mis en place
- [ ] Compression activée
- [ ] Watermarks/sécurité
- [ ] Performance < 5s par PDF

### Phase 4: Proformas (30 min)
- [ ] Adapter endpoint proformas
- [ ] Template proforma HTML
- [ ] Tests proformas

---

## ✅ VALIDATION GO LIVE

- [ ] Authentification vérifiée sur /download
- [ ] PDF généré correctement (format A4, marges OK)
- [ ] Performance acceptable (< 5s)
- [ ] Caching fonctionnel
- [ ] Watermarks en place (si sécurité requise)
- [ ] Testé sur Vercel avec Pro plan
- [ ] Logs des erreurs PDF
- [ ] Fallback si PDF échoue

---

## 💰 COSTS & LIMITS

| Option | Setup | Cost/PDF | Speed | Quality |
|--------|-------|----------|-------|---------|
| Puppeteer | 30 min | Free | 2-5s | Excellent |
| PDFKit | 30 min | Free | 100ms | Bon |
| HTML2PDF | 15 min | $0.01-0.05 | 1-2s | Excellent |

---

## ⏱️ TEMPS TOTAL

- Installation + Config: **30 min**
- Tests & Validation: **1 heure**
- Optimisations: **1 heure**
- Documentation: **30 min**
- **Total: ~3 heures pour 100% complet**

### Status Actuel: 80% (à faire: 1 heure de tests)

