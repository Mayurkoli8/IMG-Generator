// src/app/api/brands/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const brand = await db.brand.findUnique({
      where: { id: params.id },
      include: {
        assets: { orderBy: { createdAt: "desc" } },
        _count: { select: { generations: true } },
      },
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    return NextResponse.json({ brand });
  } catch (error) {
    console.error("GET /api/brands/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch brand" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const brand = await db.brand.update({
      where: { id: params.id },
      data: {
        name: body.name?.trim(),
        tagline: body.tagline?.trim() || null,
        website: body.website?.trim() || null,
        phone: body.phone?.trim() || null,
        email: body.email?.trim() || null,
        address: body.address?.trim() || null,
        instagramHandle: body.instagramHandle?.trim() || null,
        facebookHandle: body.facebookHandle?.trim() || null,
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
        accentColor: body.accentColor,
        fontPrimary: body.fontPrimary,
        fontSecondary: body.fontSecondary,
        designRules: body.designRules ? JSON.stringify(body.designRules) : null,
        logoUrl: body.logoUrl || null,
      },
    });

    return NextResponse.json({ brand });
  } catch (error) {
    console.error("PUT /api/brands/[id] error:", error);
    return NextResponse.json({ error: "Failed to update brand" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.brand.update({
      where: { id: params.id },
      data: { active: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/brands/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete brand" }, { status: 500 });
  }
}
