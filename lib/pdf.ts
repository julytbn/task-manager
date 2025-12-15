/**
 * Module PDF Generation - Kekeli Group
 * Génère des PDF pour les factures, proformas, timesheets
 * 
 * Options:
 * 1. PDFKit (Node.js) - Bas niveau, plus de contrôle
 * 2. Puppeteer (Headless Chrome) - HTML → PDF, résultats excellents
 * 3. pdflib - Manipulation PDF légère
 * 4. html2pdf - Simple HTML to PDF
 * 
 * Recommandation: Puppeteer pour qualité maximale
 */

import puppeteer from 'puppeteer'
import PDFDocument from 'pdfkit'
import { Readable } from 'stream'

// ============================================
// OPTION 1: Puppeteer (Recommandé)
// ============================================

export async function generatePDFFromHTML(htmlContent: string): Promise<Buffer> {
  let browser
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

    // Générer le PDF
    const pdf = await page.pdf({
      format: 'A4',
      margin: {
        top: '0.5cm',
        right: '0.5cm',
        bottom: '0.5cm',
        left: '0.5cm'
      },
      printBackground: true,
      scale: 1
    })

    await page.close()
    return Buffer.from(pdf)
  } catch (error) {
    console.error('[PDF] Erreur Puppeteer:', error)
    throw error
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// ============================================
// OPTION 2: PDFKit (Plus léger)
// ============================================

export interface PDFGeneratorOptions {
  title: string
  author?: string
  subject?: string
  creationDate?: Date
}

export function generatePDFWithPDFKit(
  htmlContent: string,
  options: PDFGeneratorOptions = { title: 'Document' }
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: options.title,
          Author: options.author || 'Kekeli Group',
          Subject: options.subject || 'Document',
          CreationDate: options.creationDate || new Date()
        }
      })

      // Accumulate chunks
      const chunks: Buffer[] = []

      doc.on('data', (chunk: Buffer) => {
        chunks.push(chunk)
      })

      doc.on('end', () => {
        resolve(Buffer.concat(chunks))
      })

      doc.on('error', (error: Error) => {
        reject(error)
      })

      // Parse HTML basique et ajouter au PDF
      parseAndAddHTML(doc, htmlContent)

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

function parseAndAddHTML(doc: any, html: string): void {
  // Extraction basique du contenu texte du HTML
  const textContent = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '') // Supprimer tous les tags HTML
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()

  // Ajouter le texte au document PDF
  doc.fontSize(12).text(textContent, 100, 100, { align: 'left' })
}

// ============================================
// OPTION 3: Service de conversion en ligne
// ============================================

export async function generatePDFWithHTMLConvert(
  htmlContent: string
): Promise<Buffer> {
  /**
   * Alternative: Utiliser un service externe comme:
   * - https://api.html2pdf.app
   * - https://convertapi.com
   * - https://cloudconvert.com
   * 
   * Avantages: Haute qualité, pas de dépendances système
   * Inconvénients: Coûts, latence réseau, limite débit
   */

  try {
    const response = await fetch('https://api.html2pdf.app/v1/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apiKey: process.env.HTML2PDF_API_KEY || 'free',
        html: htmlContent,
        options: {
          pageSize: 'A4',
          margin: 10
        }
      })
    })

    if (!response.ok) {
      throw new Error(`HTML2PDF API error: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.error('[PDF] Erreur HTML2PDF:', error)
    throw error
  }
}

// ============================================
// HELPERS
// ============================================

export async function downloadPDFToFile(
  pdfBuffer: Buffer,
  fileName: string
): Promise<string> {
  const fs = await import('fs').then(m => m.promises)
  const path = require('path')

  const uploadDir = path.join(process.cwd(), 'storage', 'pdfs')
  await fs.mkdir(uploadDir, { recursive: true })

  const filePath = path.join(uploadDir, fileName)
  await fs.writeFile(filePath, pdfBuffer)

  return filePath
}

// ============================================
// FACTORY: Choisir automatiquement
// ============================================

export async function generatePDF(
  htmlContent: string,
  options?: PDFGeneratorOptions
): Promise<Buffer> {
  const pdfEngine = process.env.PDF_ENGINE || 'puppeteer'

  console.log(`[PDF] Utilisation du moteur: ${pdfEngine}`)

  switch (pdfEngine) {
    case 'puppeteer':
      return generatePDFFromHTML(htmlContent)
    case 'pdfkit':
      return generatePDFWithPDFKit(htmlContent, options)
    case 'html2pdf':
      return generatePDFWithHTMLConvert(htmlContent)
    default:
      // Fallback vers Puppeteer
      return generatePDFFromHTML(htmlContent)
  }
}

// ============================================
// EXEMPLE D'UTILISATION
// ============================================

export const EXAMPLE_PDF_USAGE = `
// Dans un endpoint API:

import { generatePDF } from '@/lib/pdf'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const facture = await prisma.facture.findUnique({
      where: { id: params.id },
      include: { client: true, projet: true }
    })

    if (!facture) {
      return NextResponse.json({ error: 'Non trouvée' }, { status: 404 })
    }

    // Générer l'HTML (voir download/route.ts)
    const htmlContent = generateFactureHTML(facture)

    // Convertir en PDF
    const pdfBuffer = await generatePDF(htmlContent, {
      title: \`Facture \${facture.numero}\`
    })

    // Retourner au navigateur
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': \`attachment; filename="facture-\${facture.numero}.pdf"\`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })
  } catch (error) {
    console.error('[PDF] Erreur:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
`

export default {
  generatePDF,
  generatePDFFromHTML,
  generatePDFWithPDFKit,
  generatePDFWithHTMLConvert,
  downloadPDFToFile
}
