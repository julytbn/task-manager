import { NextRequest, NextResponse } from "next/server";
import { chargeService } from "@/lib/services/accounting/chargeService";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/charges
 * Récupérer toutes les charges avec filtres optionnels
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    const filters = {
      categorie: searchParams.get("categorie") || undefined,
      projetId: searchParams.get("projetId") || undefined,
      employeId: searchParams.get("employeId") || undefined,
      dateDebut: searchParams.get("dateDebut")
        ? new Date(searchParams.get("dateDebut")!)
        : undefined,
      dateFin: searchParams.get("dateFin")
        ? new Date(searchParams.get("dateFin")!)
        : undefined,
      skip: searchParams.get("skip") ? parseInt(searchParams.get("skip")!) : 0,
      take: searchParams.get("take") ? parseInt(searchParams.get("take")!) : 50,
    };

    const charges = await chargeService.getAllCharges(filters);

    return NextResponse.json({
      success: true,
      data: charges,
      count: charges.length,
    });
  } catch (error) {
    console.error("Error fetching charges:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch charges",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/charges
 * Créer une nouvelle charge
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.montant || !body.categorie) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields: montant, categorie",
        },
        { status: 400 }
      );
    }

    const charge = await chargeService.createCharge({
      montant: body.montant,
      categorie: body.categorie,
      description: body.description,
      date: body.date ? new Date(body.date) : new Date(),
      projetId: body.projetId,
      employeId: body.employeId,
      justificatifUrl: body.justificatifUrl,
      notes: body.notes,
    });

    return NextResponse.json(
      {
        success: true,
        data: charge,
        message: "Charge created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating charge:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create charge",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
