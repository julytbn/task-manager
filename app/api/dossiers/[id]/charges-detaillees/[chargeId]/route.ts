export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";

// All methods (GET, POST, PUT, DELETE)
const disabledHandler = () => NextResponse.json(
  { error: "Cette fonctionnalité est actuellement indisponible - base de données reconfigurée" },
  { status: 503 }
);

export async function GET() { return disabledHandler(); }
export async function POST() { return disabledHandler(); }
export async function PUT() { return disabledHandler(); }
export async function DELETE() { return disabledHandler(); }
