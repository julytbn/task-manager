/**
 * GET /api/dossiers/[id]/situation-financiere - Récupérer la situation financière
 * NOTE: This endpoint is currently disabled - models were removed from schema
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";

export async function GET() {
  // Return a feature not available response
  return NextResponse.json(
    { error: "Cette fonctionnalité est actuellement indisponible" },
    { status: 503 }
  );
}
