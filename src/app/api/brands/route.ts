// src/app/api/brands/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";

export async function GET() {
  try {
    const brands = await db.brand.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { assets: true, generations: true } },
      },
    });
    return NextResponse.json({ brands });
  } catch (error) {
    console.error("GET /api/brands error:", error);
    return NextResponse.json({ error: "Failed to fetch brands" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      tagline,
      website,
      phone,
      email,
      address,
      instagramHandle,
      facebookHandle,
      primaryColor,
      secondaryColor,
      accentColor,
      fontPrimary,
      fontSecondary,
      designRules,
      logoUrl,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Brand name is required" }, { status: 400 });
    }

    // Generate unique slug
    let slug = slugify(name);
    const existing = await db.brand.findFirst({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const brand = await db.brand.create({
      data: {
        name: name.trim(),
        slug,
        tagline: tagline?.trim() || null,
        website: website?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
        instagramHandle: instagramHandle?.trim() || null,
        facebookHandle: facebookHandle?.trim() || null,
        primaryColor: primaryColor || "#1a1a2e",
        secondaryColor: secondaryColor || "#e8c07d",
        accentColor: accentColor || "#ffffff",
        fontPrimary: fontPrimary || "Playfair Display",
        fontSecondary: fontSecondary || "Montserrat",
        designRules: designRules ? JSON.stringify(designRules) : null,
        logoUrl: logoUrl || null,
      },
    });

    return NextResponse.json({ brand }, { status: 201 });
  } catch (error) {
    console.error("POST /api/brands error:", error);
    return NextResponse.json({ error: "Failed to create brand" }, { status: 500 });
  }
}
