export const dynamic = 'force-dynamic';

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper function to extract text and numbers from PDF
async function extractPdfData(pdfBuffer: Buffer): Promise<{
  text: string;
  amounts: number[];
}> {
  try {
    // PDF parsing is disabled temporarily due to compatibility issues
    // Return empty data for now
    const text = '';
    const amounts: number[] = [];
    
    return { text, amounts };
  } catch (error) {
    console.error("❌ [upload-invoices] PDF parsing error:", error);
    throw new Error("Erreur lors de la lecture du PDF");
  }
}

// Helper function to intelligently extract invoice data
function extractInvoiceData(pdfText: string, amounts: number[]) {
  const result = {
    montantHT: 0,
    montantTVA: 0,
    montantTTC: 0,
    tauxTVA: 18,
    description: "",
    date: new Date(),
    clientName: "",
  };
  
  // Find date (DD/MM/YYYY or similar patterns)
  const dateMatch = pdfText.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/);
  if (dateMatch) {
    const [day, month, year] = dateMatch[1].split(/[\/\-]/);
    result.date = new Date(`${year}-${month}-${day}`);
  }
  
  // Find invoice/facture number
  const invoiceMatch = pdfText.match(/[Ff]acture[^0-9]*[Nn°]?[\s:]*([A-Z0-9\-]+)/);
  if (invoiceMatch) {
    result.description = `Facture ${invoiceMatch[1]}`;
  }
  
  // Find client name (after "CLIENT" or "DESTINATAIRE")
  const clientMatch = pdfText.match(/(?:[Cc]lient|[Dd]estinataire)[^A-Z]*([A-Z][A-Z\s\-']+)/);
  if (clientMatch) {
    result.clientName = clientMatch[1].trim();
  }
  
  // Find monetary amounts - look for TVA, TTC, etc.
  const tvaMatch = pdfText.match(/[Tt][Vv][Aa][\s:]*([0-9]+%)/);
  result.tauxTVA = tvaMatch ? parseInt(tvaMatch[1]) : 18; // Default 18%
  
  // Look for key amount patterns
  if (amounts.length > 0) {
    // Last amount is often TTC (total)
    const lastAmount = amounts[amounts.length - 1];
    
    // Second to last might be HT (subtotal)
    const secondLast = amounts.length > 1 ? amounts[amounts.length - 2] : 0;
    
    // Check for "SOUS-TOTAL", "MONTANT", "TOTAL HT"
    const sousTotalMatch = pdfText.match(/(?:[Ss]ous[\s\-]?[Tt]otal|[Tt]otal[\s\-]?[Hh][Tt])[^0-9]*([0-9]+[\s,.]?[0-9]*[\s,.]?[0-9]*)/);
    const tTCMatch = pdfText.match(/(?:[Mm]ontant[\s]?[Tt]otal|[Tt]otal[\s]?[Tt][Tt][Cc])[^0-9]*([0-9]+[\s,.]?[0-9]*[\s,.]?[0-9]*)/);
    
    if (tTCMatch) {
      result.montantTTC = parseFloat(
        tTCMatch[1].replace(/\s+/g, '').replace(/,/g, '.')
      ) || lastAmount;
    } else {
      result.montantTTC = lastAmount;
    }
    
    if (sousTotalMatch) {
      result.montantHT = parseFloat(
        sousTotalMatch[1].replace(/\s+/g, '').replace(/,/g, '.')
      ) || secondLast;
    } else {
      result.montantHT = secondLast || (result.montantTTC / (1 + result.tauxTVA / 100));
    }
    
    // Calculate TVA if not found
    if (result.montantHT > 0 && result.montantTTC > 0) {
      result.montantTVA = result.montantTTC - result.montantHT;
    } else if (result.montantTTC > 0) {
      result.montantHT = result.montantTTC / (1 + result.tauxTVA / 100);
      result.montantTVA = result.montantTTC - result.montantHT;
    }
  }
  
  return result;
}

export async function GET() {
  return NextResponse.json({ error: "Route désactivée" }, { status: 410 });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    console.log("📄 [upload-invoices] Starting PDF upload for client:", params.clientId);

    // Récupérer le fichier
    const formData = await request.formData();
    const file = formData.get("invoiceFile") as File;

    if (!file) {
      console.error("📄 [upload-invoices] No file provided");
      return NextResponse.json(
        { success: false, message: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    console.log("📄 [upload-invoices] File received:", file.name, file.size, "bytes");

    // Vérifier que c'est un PDF
    if (!file.type.includes("pdf") && !file.name.endsWith(".pdf")) {
      return NextResponse.json(
        { success: false, message: "Seuls les fichiers PDF sont acceptés" },
        { status: 400 }
      );
    }

    // Vérifier que le client existe
    const client = await prisma.client.findUnique({
      where: { id: params.clientId },
    });

    if (!client) {
      console.error("📄 [upload-invoices] Client not found:", params.clientId);
      return NextResponse.json(
        { success: false, message: "Client non trouvé" },
        { status: 404 }
      );
    }

    // Lire le fichier PDF
    const buffer = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(buffer);

    // Extraire les données du PDF
    const { text, amounts } = await extractPdfData(pdfBuffer);
    console.log("📄 [upload-invoices] PDF extracted, amounts found:", amounts.length);

    // Parser les informations
    const invoiceData = extractInvoiceData(text, amounts);
    console.log("📄 [upload-invoices] Extracted data:", invoiceData);

    // Valider les données
    if (invoiceData.montantTTC <= 0) {
      console.error("📄 [upload-invoices] No valid amount found in PDF");
      return NextResponse.json(
        { success: false, message: "Impossible de trouver un montant valide dans le PDF" },
        { status: 400 }
      );
    }

    // Récupérer ou créer le dossier comptable pour le mois/année courant
    const now = new Date();
    const mois = now.getMonth() + 1;
    const annee = now.getFullYear();

    let dossier = await prisma.dossierComptable.findFirst({
      where: {
        clientId: params.clientId,
        mois,
        annee,
      },
    });

    if (!dossier) {
      dossier = await prisma.dossierComptable.create({
        data: {
          clientId: params.clientId,
          mois,
          annee,
          dateCreation: now,
          statut: "EN_COURS",
        },
      });
      console.log("📄 [upload-invoices] Created new dossier:", dossier.id);
    } else {
      console.log("📄 [upload-invoices] Using existing dossier:", dossier.id);
    }

    // Créer l'entrée client (facture/revenu)
    const entree = await prisma.entreeClient.create({
      data: {
        clientId: params.clientId,
        dossierComptableId: dossier.id,
        date: invoiceData.date,
        description: invoiceData.description || `Facture ${file.name}`,
        montant: invoiceData.montantTTC,
        notes: `Source: ${file.name}\nClient: ${invoiceData.clientName}\nMontant HT: ${invoiceData.montantHT}\nTVA: ${invoiceData.tauxTVA}%`.trim(),
      },
    });

    console.log("✅ [upload-invoices] Invoice entry created:", {
      id: entree.id,
      montant: invoiceData.montantTTC,
      description: invoiceData.description,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Facture importée avec succès",
        entreeId: entree.id,
        montant: invoiceData.montantTTC,
        description: invoiceData.description,
        dossierId: dossier.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/clients/[clientId]/upload-invoices]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur",
        errors: [error instanceof Error ? error.message : "Erreur inconnue"],
      },
      { status: 500 }
    );
  }
}
