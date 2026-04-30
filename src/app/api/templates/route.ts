// src/app/api/templates/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const templates = await db.campaignTemplate.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ templates });
  } catch (error) {
    console.error("GET /api/templates error:", error);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}
