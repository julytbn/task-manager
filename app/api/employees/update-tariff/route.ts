import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/employees/update-tariff - Mettre à jour le tarif horaire d'un employé
 * Note: tarifHoraire est optionnel (peut être null ou undefined)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, tarifHoraire } = body;

    if (!employeeId) {
      return NextResponse.json(
        { error: "employeeId est requis" },
        { status: 400 }
      );
    }

    // tarifHoraire est optionnel (peut être null ou undefined)
    if (tarifHoraire !== undefined && tarifHoraire !== null) {
      if (typeof tarifHoraire !== "number" || tarifHoraire < 0) {
        return NextResponse.json(
          { error: "tarifHoraire doit être un nombre positif ou null" },
          { status: 400 }
        );
      }
    }

    const employee = await prisma.utilisateur.update({
      where: { id: employeeId },
      data: { tarifHoraire } as any,
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
      } as any,
    });

    return NextResponse.json({
      success: true,
      data: employee,
      message: "Tarif horaire mis à jour avec succès",
    });
  } catch (error) {
    console.error("[API] Erreur mise à jour tarif:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du tarif" },
      { status: 500 }
    );
  }
}
