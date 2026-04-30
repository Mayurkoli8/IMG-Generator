// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { saveFile } from "@/lib/storage";
import { isValidAssetType, formatFileSize } from "@/lib/utils";

const MAX_UPLOAD_MB = parseInt(process.env.MAX_UPLOAD_MB || "20");

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const brandId = formData.get("brandId") as string;
    const assetType = (formData.get("assetType") as string) || "reference";
    const description = formData.get("description") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!brandId) {
      return NextResponse.json({ error: "brandId is required" }, { status: 400 });
    }

    // Validate brand exists
    const brand = await db.brand.findUnique({ where: { id: brandId } });
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Validate file size
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `File too large. Max ${MAX_UPLOAD_MB}MB allowed.` },
        { status: 413 }
      );
    }

    // Validate file type
    if (!isValidAssetType(file.type)) {
      return NextResponse.json(
        { error: `File type ${file.type} is not supported.` },
        { status: 415 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get file extension
    const originalName = file.name;
    const ext = originalName.split(".").pop() || "bin";

    // Save to storage
    const stored = await saveFile(buffer, "uploads", ext, originalName);

    // Save metadata to DB
    const asset = await db.brandAsset.create({
      data: {
        brandId,
        type: assetType,
        name: originalName,
        url: stored.url,
        mimeType: file.type,
        sizeBytes: file.size,
        description: description || null,
      },
    });

    // If it's a logo, update brand logoUrl
    if (assetType === "logo") {
      await db.brand.update({
        where: { id: brandId },
        data: { logoUrl: stored.filePath },
      });
    }

    return NextResponse.json({
      asset,
      url: stored.url,
      filePath: stored.filePath,
      size: formatFileSize(file.size),
    });
  } catch (error) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

// Get assets for a brand
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get("brandId");

    if (!brandId) {
      return NextResponse.json({ error: "brandId required" }, { status: 400 });
    }

    const assets = await db.brandAsset.findMany({
      where: { brandId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ assets });
  } catch (error) {
    console.error("GET /api/upload error:", error);
    return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 });
  }
}
