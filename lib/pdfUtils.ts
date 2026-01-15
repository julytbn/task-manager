import PDFDocument from 'pdfkit'

export async function generatePaiementReceiptPDF(paiement: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument()
      const buffers: Buffer[] = []
      doc.on('data', buffers.push.bind(buffers))
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers)
        resolve(pdfData)
      })

      doc.fontSize(18).text('Reçu de Paiement', { align: 'center' })
      doc.moveDown()
      doc.fontSize(12)
      doc.text(`Numéro du paiement : ${paiement.id}`)
      doc.text(`Date : ${paiement.datePaiement ? new Date(paiement.datePaiement).toLocaleDateString() : ''}`)
      doc.text(`Montant : ${paiement.montant} FCFA`)
      doc.text(`Moyen de paiement : ${paiement.moyenPaiement}`)
      doc.text(`Client : ${paiement.client?.nom || ''}`)
      doc.text(`Facture associée : ${paiement.facture?.numero || ''}`)
      doc.text(`Référence : ${paiement.reference || ''}`)
      doc.text(`Notes : ${paiement.notes || ''}`)
      doc.moveDown()
      doc.text('Merci pour votre paiement.', { align: 'center' })
      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}
