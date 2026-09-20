import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      app: "Instagramer",
      version: "0.1.0",
      timestamp: new Date().toISOString(),
      database: "disconnected (CON 01 foundation)",
    },
    { status: 200 }
  );
}
