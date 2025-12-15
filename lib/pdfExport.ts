import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

function waitForImagesLoaded(element: HTMLElement, timeout = 3000) {
  const imgs = Array.from(element.querySelectorAll('img')) as HTMLImageElement[]
  if (imgs.length === 0) return Promise.resolve()

  return new Promise<void>((resolve) => {
    let loaded = 0
    const check = () => {
      loaded++
      if (loaded >= imgs.length) resolve()
    }

    imgs.forEach(img => {
      if (img.complete) {
        check()
      } else {
        img.addEventListener('load', check)
        img.addEventListener('error', check)
      }
    })

    // Fallback timeout
    setTimeout(() => resolve(), timeout)
  })
}

export async function exportProFormaToPDF(
  elementId: string,
  fileName: string = 'pro-forma.pdf'
): Promise<void> {
  try {
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error("Élément non trouvé pour l'export")
    }

    // Attendre les images (logo, etc.) pour que le rendu corresponde à l'aperçu
    await waitForImagesLoaded(element, 4000)

    // S'assurer que l'élément n'est pas limité en hauteur
    const originalHeight = element.style.height
    const originalMaxHeight = element.style.maxHeight
    const originalOverflow = element.style.overflow
    element.style.height = 'auto'
    element.style.maxHeight = 'none'
    element.style.overflow = 'visible'

    // Forcer le reflow pour que les calculs de hauteur se mettent à jour
    const scrollHeight = element.scrollHeight
    console.log(`[PDF Export] Element scrollHeight: ${scrollHeight}px`)

    // Option de scale pour améliorer la qualité
    const scale = (window.devicePixelRatio || 1) * 2

    const canvas = await html2canvas(element, {
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: false,
      scale,
      windowWidth: element.offsetWidth || document.documentElement.scrollWidth,
      windowHeight: scrollHeight
    } as any)

    // Restaurer les styles originaux
    element.style.height = originalHeight
    element.style.maxHeight = originalMaxHeight
    element.style.overflow = originalOverflow

    const imgData = canvas.toDataURL('image/png', 1.0)

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()

    // Calculer la taille de l'image en mm
    const imgProps = (pdf as any).getImageProperties(imgData)
    const imgWidthMm = (canvas.width / (window.devicePixelRatio || 1)) * 0.264583 // px to mm @96dpi
    const imgHeightMm = (canvas.height / (window.devicePixelRatio || 1)) * 0.264583

    const ratio = Math.min(pdfWidth / imgWidthMm, pdfHeight / imgHeightMm)
    const renderWidth = imgWidthMm * ratio
    const renderHeight = imgHeightMm * ratio

    let position = 0
    let heightLeft = renderHeight

    // Ajouter la première page
    pdf.addImage(imgData, 'PNG', (pdfWidth - renderWidth) / 2, position, renderWidth, renderHeight)
    heightLeft -= pdfHeight

    // Ajouter les pages suivantes si nécessaire
    while (heightLeft > 0) {
      position = heightLeft - renderHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', (pdfWidth - renderWidth) / 2, position, renderWidth, renderHeight)
      heightLeft -= pdfHeight
    }

    pdf.save(fileName)
  } catch (error) {
    console.error('Erreur export PDF:', error)
    throw error
  }
}

export async function printProForma(elementId: string): Promise<void> {
  try {
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error("Élément non trouvé pour l'impression")
    }

    await waitForImagesLoaded(element, 4000)

    const canvas = await html2canvas(element, {
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: false,
      scale: (window.devicePixelRatio || 1) * 2
    } as any)

    const imgData = canvas.toDataURL('image/png')
    const printWindow = window.open('', '_blank')
    if (!printWindow) throw new Error("Impossible d'ouvrir la fenêtre d'impression")

    printWindow.document.write(`
      <html>
        <head>
          <title>Impression Pro Forma</title>
          <style>
            html, body { margin: 0; padding: 0; }
            .print-img { display: block; width: 100%; height: auto; }
            @media print { body { margin: 0 } }
          </style>
        </head>
        <body>
          <img class="print-img" src="${imgData}" />
        </body>
      </html>
    `)
    printWindow.document.close()

    setTimeout(() => {
      printWindow.print()
    }, 300)
  } catch (error) {
    console.error('Erreur impression:', error)
    throw error
  }
}
