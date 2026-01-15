export const dynamic = 'force-dynamic';

import { NextResponse, NextRequest } from "next/server";

const disabledHandler = () => NextResponse.json(
  { error: "Cette fonctionnalité est actuellement indisponible" },
  { status: 503 }
);

export async function GET() { return disabledHandler(); }
export async function POST() { return disabledHandler(); }
