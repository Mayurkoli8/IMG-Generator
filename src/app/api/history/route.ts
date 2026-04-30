// src/app/api/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get("brandId");
    const campaignType = searchParams.get("campaignType");
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (brandId) where.brandId = brandId;
    if (campaignType) where.campaignType = campaignType;
    if (status) where.status = status;
    if (source) where.source = source;

    const [jobs, total] = await Promise.all([
      db.generationJob.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          brand: { select: { name: true, slug: true } },
        },
      }),
      db.generationJob.count({ where }),
    ]);

    return NextResponse.json({
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/history error:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
