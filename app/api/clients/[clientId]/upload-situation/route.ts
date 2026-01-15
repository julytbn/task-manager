export const dynamic = 'force-dynamic';

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from 'xlsx';

// Helper function to find column value by multiple possible column names
function findColumn(row: any, possibleNames: string[]): any {
  if (!row) return undefined;
  
  for (const possibleName of possibleNames) {
    // Exact match
    if (row[possibleName] !== undefined && row[possibleName] !== null && row[possibleName] !== '') {
      return row[possibleName];
    }
    
    // Case-insensitive match with normalization (remove extra spaces, accents)
    const lowerName = possibleName.toLowerCase().trim();
    for (const [key, value] of Object.entries(row)) {
      const lowerKey = key.toLowerCase().trim();
      
      // Exact lowercase match
      if (lowerKey === lowerName && value !== undefined && value !== null && value !== '') {
        return value;
      }
      
      // Fuzzy match: check if one contains the other or if they're similar
      // e.g., "raison social" matches "raison sociale" or just "raison"
      const keyWords = lowerKey.split(/[\s_-]+/).filter(w => w);
      const nameWords = lowerName.split(/[\s_-]+/).filter(w => w);
      
      // If most words match, consider it a match
      const matchCount = nameWords.filter(word => 
        keyWords.some(keyWord => keyWord.includes(word) || word.includes(keyWord))
      ).length;
      
      if (matchCount === nameWords.length && matchCount > 0) {
        console.log(`  ✅ Fuzzy matched column: "${key}" (${lowerKey}) matches search for "${possibleName}" (${lowerName})`);
        if (value !== undefined && value !== null && value !== '') {
          return value;
        }
      }
    }
  }
  
  return undefined;
}

// Helper function to parse amount strings with flexible formatting
function parseAmount(value: any): number {
  if (value === null || value === undefined || value === '') return 0;
  
  if (typeof value === 'number') return value;
  
  if (typeof value === 'string') {
    // Remove spaces and currency symbols, handle both comma and dot as decimal separator
    let cleaned = value
      .trim()
      .replace(/\s+/g, '')  // Remove spaces
      .replace(/[^\d,.-]/g, '');  // Keep only digits, comma, dot, and hyphen (for negative)
    
    // Handle negative numbers
    const isNegative = cleaned.startsWith('-');
    if (isNegative) cleaned = cleaned.substring(1);
    
    // Replace comma with dot if it looks like decimal separator
    if (cleaned.includes(',')) {
      const parts = cleaned.split(',');
      if (parts[1] && parts[1].length <= 2) {
        // It's likely decimal separator (1 or 2 digits after comma)
        cleaned = cleaned.replace(',', '.');
      } else {
        // It's thousand separator
        cleaned = cleaned.replace(/,/g, '');
      }
    }
    
    let parsed = parseFloat(cleaned);
    if (isNegative) parsed = -parsed;
    return isNaN(parsed) ? 0 : parsed;
  }
  
  return 0;
}

export async function GET() {
  return NextResponse.json({ error: "Route désactivée" }, { status: 410 });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    console.log("📊 [upload-situation] Starting upload for client:", params.clientId);

    // Récupérer le fichier et le type
    const formData = await request.formData();
    const file = formData.get("situationFile") as File;
    const documentType = (formData.get("documentType") as string) || "CHARGE";

    if (!file) {
      console.error("📊 [upload-situation] No file provided");
      return NextResponse.json(
        { success: false, message: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    console.log("📊 [upload-situation] File received:", file.name, file.size, "Type:", documentType);

    // Vérifier que le client existe
    const client = await prisma.client.findUnique({
      where: { id: params.clientId },
    });

    if (!client) {
      console.error("📊 [upload-situation] Client not found:", params.clientId);
      return NextResponse.json(
        { success: false, message: "Client non trouvé" },
        { status: 404 }
      );
    }

    // Lire le fichier Excel
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    console.log("📊 [upload-situation] Sheet names:", workbook.SheetNames);
    console.log("📊 [upload-situation] Current sheet:", workbook.SheetNames[0]);
    
    // D'abord, lire toutes les lignes (header: 1) pour détecter les sections
    const allRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    console.log("📊 [upload-situation] Total rows in file:", allRows.length);
    console.log("📊 [upload-situation] First 5 rows for debugging:");
    for (let i = 0; i < Math.min(5, allRows.length); i++) {
      console.log(`  Row ${i}: ${JSON.stringify(allRows[i])}`);
    }
    
    // Trouver les indices des deux sections (verticalement ou horizontalement)
    let avecTvaHeaderIdx = -1;
    let sansTvaHeaderIdx = -1;
    let avecTvaHeaderColStart = -1; // Colonne où commence AVEC TVA
    let sansTvaHeaderColStart = -1; // Colonne où commence SANS TVA
    
    // APPROCHE 1: Chercher verticalement (sections l'une sous l'autre)
    for (let i = 0; i < allRows.length; i++) {
      const firstCell = String(allRows[i]?.[0] || "").toLowerCase().trim();
      
      if (firstCell.includes("achat") && firstCell.includes("avec") && firstCell.includes("tva")) {
        avecTvaHeaderIdx = i + 1;
        avecTvaHeaderColStart = 0;
        console.log("✅ Found 'ACHAT AVEC TVA' section (vertical) at row", i, ", header at row", avecTvaHeaderIdx);
      }
      if (firstCell.includes("achat") && firstCell.includes("sans") && firstCell.includes("tva")) {
        sansTvaHeaderIdx = i + 1;
        sansTvaHeaderColStart = 0;
        console.log("✅ Found 'ACHAT SANS TVA' section (vertical) at row", i, ", header at row", sansTvaHeaderIdx);
      }
    }
    
    // APPROCHE 2: Chercher horizontalement (côte à côte) - chercher dans la première ligne
    if (avecTvaHeaderIdx === -1 && sansTvaHeaderIdx === -1) {
      console.log("📊 Trying horizontal layout (side by side)...");
      const firstRow = allRows[0] || [];
      
      for (let col = 0; col < firstRow.length; col++) {
        const cellText = String(firstRow[col] || "").toLowerCase().trim();
        
        if (cellText.includes("achat") && cellText.includes("avec") && cellText.includes("tva")) {
          avecTvaHeaderColStart = col;
          avecTvaHeaderIdx = 1; // Header is on row 1
          console.log("✅ Found 'ACHAT AVEC TVA' section (horizontal) at column", col);
        }
        if (cellText.includes("achat") && cellText.includes("sans") && cellText.includes("tva")) {
          sansTvaHeaderColStart = col;
          sansTvaHeaderIdx = 1; // Header is on row 1
          console.log("✅ Found 'ACHAT SANS TVA' section (horizontal) at column", col);
        }
      }
    }
    
    console.log("📊 [upload-situation] Final indices - AVEC TVA: row", avecTvaHeaderIdx, "col", avecTvaHeaderColStart, ", SANS TVA: row", sansTvaHeaderIdx, "col", sansTvaHeaderColStart);
    
    // Construire les deux tableaux de données
    const dataAvecTVA: any[] = [];
    const dataSansTVA: any[] = [];
    
    // Pour AVEC TVA
    if (avecTvaHeaderIdx >= 0 && avecTvaHeaderIdx < allRows.length) {
      const headers = allRows[avecTvaHeaderIdx];
      console.log("📊 [upload-situation] AVEC TVA headers (row", avecTvaHeaderIdx, "):", headers);
      
      const endRow = sansTvaHeaderIdx > 0 ? sansTvaHeaderIdx - 1 : allRows.length;
      console.log("📊 [upload-situation] AVEC TVA data range: rows", avecTvaHeaderIdx + 1, "to", endRow);
      
      let processedCount = 0;
      for (let i = avecTvaHeaderIdx + 1; i < endRow; i++) {
        if (!allRows[i] || !allRows[i][0]) {
          continue;
        }
        
        // Si données horizontales, extraire les colonnes pertinentes
        let rowData: any[] = allRows[i];
        if (avecTvaHeaderColStart > 0) {
          // Extraire uniquement les colonnes du tableau AVEC TVA
          const headersCount = headers.filter(h => h).length;
          rowData = allRows[i].slice(avecTvaHeaderColStart, avecTvaHeaderColStart + headersCount);
        }
        
        const row: any = {};
        for (let j = 0; j < headers.length; j++) {
          const header = headers[j];
          if (header) {
            row[header] = rowData[j];
          }
        }
        
        // Vérifier que c'est une ligne de données valide
        if (Object.keys(row).length > 0 && row[headers[0]]) {
          dataAvecTVA.push(row);
          processedCount++;
        }
      }
      console.log(`📊 [upload-situation] AVEC TVA: ${processedCount} rows added`);
    } else {
      console.log("📊 [upload-situation] AVEC TVA: No header index found");
    }
    
    // Pour SANS TVA
    if (sansTvaHeaderIdx >= 0 && sansTvaHeaderIdx < allRows.length) {
      const headers = allRows[sansTvaHeaderIdx];
      console.log("📊 [upload-situation] SANS TVA headers (row", sansTvaHeaderIdx, "):", headers);
      console.log("📊 [upload-situation] SANS TVA data range: rows", sansTvaHeaderIdx + 1, "to", allRows.length);
      
      let processedCount = 0;
      for (let i = sansTvaHeaderIdx + 1; i < allRows.length; i++) {
        if (!allRows[i] || !allRows[i][0]) {
          continue;
        }
        
        // Si données horizontales, extraire les colonnes pertinentes
        let rowData: any[] = allRows[i];
        if (sansTvaHeaderColStart > 0) {
          // Extraire uniquement les colonnes du tableau SANS TVA
          const headersCount = headers.filter(h => h).length;
          rowData = allRows[i].slice(sansTvaHeaderColStart, sansTvaHeaderColStart + headersCount);
        }
        
        const row: any = {};
        for (let j = 0; j < headers.length; j++) {
          const header = headers[j];
          if (header) {
            row[header] = rowData[j];
          }
        }
        
        // Vérifier que c'est une ligne de données valide
        if (Object.keys(row).length > 0 && row[headers[0]]) {
          dataSansTVA.push(row);
          processedCount++;
        }
      }
      console.log(`📊 [upload-situation] SANS TVA: ${processedCount} rows added`);
    } else {
      console.log("📊 [upload-situation] SANS TVA: No header index found");
    }
    
    console.log("📊 [upload-situation] Data AVEC TVA:", dataAvecTVA.length, "rows");
    console.log("📊 [upload-situation] Data SANS TVA:", dataSansTVA.length, "rows");
    
    // Combiner les deux tableaux
    let data = [
      ...dataAvecTVA.map((row: any) => ({ ...row, __avecTVA: true })),
      ...dataSansTVA.map((row: any) => ({ ...row, __avecTVA: false }))
    ];
    
    // Si aucune section n'a été trouvée, utiliser une approche simple: lire avec sheet_to_json et détecter basé sur les colonnes
    if (data.length === 0) {
      console.log("📊 [upload-situation] No structured sections found, trying simple table parsing with column detection...");
      const simpleData = XLSX.utils.sheet_to_json(worksheet) as any[];
      console.log("📊 [upload-situation] Simple parse result:", simpleData.length, "rows");
      
      if (simpleData.length > 0) {
        console.log("📊 [upload-situation] First row keys:", Object.keys(simpleData[0]));
        console.log("📊 [upload-situation] First row data:", JSON.stringify(simpleData[0]));
        
        // Mapper les données en fonction des colonnes détectées
        data = simpleData.map((row: any, idx: number) => {
          // Filtrer les valeurs non-nulles/non-undefined - PLUS PERMISSIF
          const hasValues = Object.values(row).some(v => v !== null && v !== undefined && v !== '');
          
          if (!hasValues) {
            console.log(`  Row ${idx}: skipped (empty row)`);
            return null;
          }
          
          // Déterminer si c'est AVEC TVA ou SANS TVA basé sur les colonnes
          const keys = Object.keys(row).map(k => k.toLowerCase());
          console.log(`🔍 Row ${idx} detected columns:`, keys);
          
          // Chercher des colonnes TVA/Montant pour classifier
          const hasTVAColumn = keys.some(k => k.includes('tva') || k.includes('montant tva'));
          const hasMontantColumn = keys.some(k => k.includes('montant'));
          
          console.log(`📊 Row ${idx} detection: hasTVAColumn=${hasTVAColumn}, hasMontantColumn=${hasMontantColumn}`);
          
          if (!hasMontantColumn) {
            console.log(`⚠️  Row ${idx}: skipped (no montant column found)`);
            return null;
          }
          
          // If there's no TVA column, it's SANS TVA (avecTVA = false)
          const avecTVA = hasTVAColumn;
          console.log(`✅ Row ${idx}: classified as ${avecTVA ? 'AVEC TVA' : 'SANS TVA'}`);
          
          return {
            ...row,
            __avecTVA: avecTVA
          };
        }).filter(r => r !== null);
        
        console.log(`📊 [upload-situation] Remapped data: ${data.length} rows`);
      } else {
        console.log("⚠️ [upload-situation] Sheet is empty or sheet_to_json returned 0 rows");
      }
    }
    
    console.log("📊 [upload-situation] Total combined data:", data.length, "rows", "DocumentType:", documentType);
    
    // DEBUG: Afficher TOUTES les colonnes du premier row
    if (data.length > 0) {
      console.log("\n🔍 COLONNES DÉTECTÉES:");
      console.log("Clés du row 0:", Object.keys(data[0]));
      console.log("Valeurs du row 0:", data[0]);
      console.log("\n");
    }

    // Récupérer ou créer le dossier comptable pour le mois/année courant
    const now = new Date();
    const moisCourant = now.getMonth() + 1; // 1-12
    const anneeCourante = now.getFullYear();

    let dossier = await prisma.dossierComptable.findFirst({
      where: { 
        clientId: params.clientId,
        mois: moisCourant,
        annee: anneeCourante
      },
    });

    // Si pas de dossier pour ce mois, chercher le plus récent
    if (!dossier) {
      dossier = await prisma.dossierComptable.findFirst({
        where: { clientId: params.clientId },
        orderBy: [{ annee: "desc" }, { mois: "desc" }],
      });
    }

    // Si toujours pas de dossier, en créer un pour le mois courant
    if (!dossier) {
      console.log("📊 [upload-situation] Creating new dossier for", moisCourant + "/" + anneeCourante);
      dossier = await prisma.dossierComptable.create({
        data: {
          clientId: params.clientId,
          mois: moisCourant,
          annee: anneeCourante,
          statut: "EN_COURS",
        },
      });
      console.log("📊 [upload-situation] New dossier created:", dossier.id);
    }

    console.log("📊 [upload-situation] Using dossier:", dossier.id);

    // Traiter les données
    let chargesCreated = 0;
    let entreesCreated = 0;
    const errors: string[] = [];
    
    for (let i = 0; i < data.length; i++) {
      try {
        const row = data[i] as any;
        
        // Récupérer le flag de section
        const isAvecTva = row.__avecTVA === true;
        delete row.__avecTVA; // Remove internal flag

        // Normaliser les clés - être flexible sur le nom des colonnes
        const dateRaw = findColumn(row, ["Date", "date", "DATES", "Dates", "DATE"]) || new Date();
        let date: Date;
        if (typeof dateRaw === 'string') {
          date = new Date(dateRaw);
        } else if (typeof dateRaw === 'number') {
          // Excel stores dates as numbers (days since 1900)
          date = new Date((dateRaw - 25569) * 86400 * 1000);
        } else if (dateRaw instanceof Date) {
          date = dateRaw;
        } else {
          date = new Date();
        }
        
        // Utiliser la fonction helper pour trouver les colonnes
        const raisonSociale = 
          findColumn(row, ["Raison sociale", "Raison social", "Raison Social", "RAISON SOCIAL", "RAISON SOCIALE", "Raison", "Fournisseur", "Client", "FOURNISSEUR"]) || 
          "Sans nom";
        
        const montantHTRaw = 
          findColumn(row, ["Montant HT", "Montant ht", "montantHT", "Montant", "MONTANT HT", "MONTANT ht", "montant ht", "montantht"]);
        
        const montantTVARaw = 
          findColumn(row, ["Montant TVA", "Montant tva", "montantTVA", "TVA", "MONTANT TVA", "montant tva", "tva", "montanttva"]);
        
        const montantTTCRaw = 
          findColumn(row, ["Montant TTC", "Montant ttc", "montantTTC", "TTC", "MONTANT TTC", "montant ttc", "ttc", "montantttc"]);

        let montantHT = parseAmount(montantHTRaw);
        let montantTVA = parseAmount(montantTVARaw);
        let montantTTC = parseAmount(montantTTCRaw);
        
        // Si TTC n'est pas défini, le calculer
        if (montantTTC === 0 && (montantHT > 0 || montantTVA > 0)) {
          montantTTC = montantHT + montantTVA;
        }

        console.log(`📊 [upload-situation] Row ${i + 1}:`, { 
          raisonSociale, 
          montantHT, 
          montantTVA, 
          montantTTC, 
          isAvecTva,
          allKeys: Object.keys(row)
        });

        // Valider les données: au moins un montant ET un nom valide
        const hasValidAmount = montantHT > 0 || montantTVA > 0 || montantTTC > 0;
        const hasValidName = raisonSociale && raisonSociale.trim() !== "" && raisonSociale !== "Sans nom";
        
        if (!hasValidAmount || !hasValidName) {
          console.log("📊 [upload-situation] Skipping row", i + 1, "- hasValidAmount:", hasValidAmount, "hasValidName:", hasValidName, "raisonSociale:", raisonSociale);
          continue;
        }

        console.log("📊 [upload-situation] Processing row", i + 1, "- Type:", documentType, "Montant HT:", montantHT, "TVA:", montantTVA, "Section:", isAvecTva ? "AVEC TVA" : "SANS TVA");

        if (documentType === "CHARGE") {
          // Créer une charge (avec ou sans TVA)
          const tauxTVA = montantTVA > 0 && montantHT > 0 ? (montantTVA / montantHT) * 100 : 0;
          await prisma.chargeDetaillee.create({
            data: {
              dossierComptableId: dossier.id,
              date: date,
              fournisseur: raisonSociale,
              montantHT,
              montantTVA: montantTVA > 0 ? montantTVA : null,
              montantTTC,
              avecTVA: isAvecTva,  // TRUE pour "AVEC TVA", FALSE pour "SANS TVA"
              tauxTVA: montantTVA > 0 ? tauxTVA : null,
              categorie: "AUTRES_CHARGES",
              description: raisonSociale,
            },
          });
          chargesCreated++;
          const typeCharge = isAvecTva ? "avec TVA" : "sans TVA";
          console.log("📊 [upload-situation] Charge created:", raisonSociale, "-", montantHT, "XAF", typeCharge);
        } else if (documentType === "ENTREE") {
          // Créer une entrée
          await prisma.entreeClient.create({
            data: {
              clientId: params.clientId,
              dossierComptableId: dossier.id,
              date: date,
              description: raisonSociale,
              montant: montantTTC || montantHT,
              notes: raisonSociale,
            },
          });
          entreesCreated++;
          console.log("📊 [upload-situation] Entrée created:", raisonSociale, montantHT);
        }
      } catch (rowError) {
        console.error("📊 [upload-situation] Error processing row", i + 1, rowError);
        errors.push(`Ligne ${i + 1}: ${rowError instanceof Error ? rowError.message : "Erreur"}`);
      }
    }

    console.log("📊 [upload-situation] Upload complete. Charges:", chargesCreated, "Entrées:", entreesCreated);
    console.log("📊 [upload-situation] Dossier info - Mois:", dossier.mois, "Année:", dossier.annee);

    return NextResponse.json(
      {
        success: true,
        message: `${chargesCreated + entreesCreated} document(s) créé(s)`,
        chargesCreated,
        entreesCreated,
        totalCreated: chargesCreated + entreesCreated,
        dossierId: dossier.id,
        month: dossier.mois,
        year: dossier.annee,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/clients/[clientId]/upload-situation]", error);
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
