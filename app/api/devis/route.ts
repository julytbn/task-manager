import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/devis
 * Récupérer tous les devis avec filtres optionnels
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    const devis = await prisma.devis.findMany({
      where: {
        clientId: searchParams.get("clientId") || undefined,
        statut: searchParams.get("statut") || undefined,
      },
      include: {
        services: true,
        client: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            entreprise: true,
          },
        },
      },
      orderBy: { dateCreation: "desc" },
      skip: searchParams.get("skip") ? parseInt(searchParams.get("skip")!) : 0,
      take: searchParams.get("take") ? parseInt(searchParams.get("take")!) : 50,
    });

    return NextResponse.json({
      success: true,
      data: devis,
      count: devis.length,
    });
  } catch (error) {
    console.error("Error fetching devis:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch devis",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/devis
 * Créer un nouveau devis
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.clientId || body.montant === undefined || !body.categorie) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields: clientId, montant",
        },
        { status: 400 }
      );
    }

    // Générer un numéro unique de devis
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    let numero = `DEV-${year}-${month}-${day}T${hours}${minutes}${seconds}`;
    let counter = 1;
    let existing = await prisma.devis.findUnique({
      where: { numero },
    });

    while (existing) {
      numero = `DEV-${year}-${month}-${day}T${hours}${minutes}${seconds}-${counter}`;
      counter++;
      existing = await prisma.devis.findUnique({
        where: { numero },
      });
    }

    const tauxTVA = body.tauxTVA || 0.18;
    const montantTotal = body.montant + body.montant * tauxTVA;

    const devis = await prisma.devis.create({
      data: {
        numero,
        clientId: body.clientId,
        titre: body.titre,
        description: body.description,
        montant: body.montant,
        tauxTVA,
        montantTotal,
        notes: body.notes,
        statut: "BROUILLON",
      },
      include: {
        services: true,
        client: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            entreprise: true,
          },
        },
      },
    });

    // Ajouter les services si fournis
    if (body.services && Array.isArray(body.services)) {
      for (const service of body.services) {
        await prisma.devisService.create({
          data: {
            devisId: devis.id,
            serviceId: service.serviceId,
            quantite: service.quantite || 1,
            prix: service.prix,
          },
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: devis,
        message: "Devis created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating devis:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create devis",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
