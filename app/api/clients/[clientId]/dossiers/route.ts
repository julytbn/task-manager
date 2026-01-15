/**
 * GET /api/clients/[clientId]/dossiers - Lister les dossiers d'un client
 * NOTE: This endpoint is currently disabled - models were removed from schema
 */

import { NextResponse } from "next/server";

export async function GET() {
  // Return a feature not available response
  return NextResponse.json(
    { error: "Cette fonctionnalité est actuellement indisponible" },
    { status: 503 }
  );
}
