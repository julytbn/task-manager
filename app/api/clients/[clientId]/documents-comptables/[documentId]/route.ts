import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Route désactivée" }, { status: 410 });
}
