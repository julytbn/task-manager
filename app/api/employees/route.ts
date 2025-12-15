import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

/**
 * GET /api/employees - Récupérer la liste des employés
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includeHourlyRate = searchParams.get("includeHourlyRate") === "true";

    const employees = await prisma.utilisateur.findMany({
      where: {
        role: { in: ["EMPLOYE", "CONSULTANT"] },
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        tarifHoraire: includeHourlyRate,
        actif: true,
      },
      orderBy: { nom: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: employees,
      count: employees.length,
    });
  } catch (error) {
    console.error("[API] Erreur récupération employés:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des employés" },
      { status: 500 }
    );
  }
}
