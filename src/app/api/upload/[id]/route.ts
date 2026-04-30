// src/app/api/upload/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deleteFile } from "@/lib/storage";
import { extractPublicPath } from "@/lib/utils";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const asset = await db.brandAsset.findUnique({ where: { id: params.id } });
    if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

    // Try to delete the file from storage
    try {
      const publicPath = extractPublicPath(asset.url);
      await deleteFile(publicPath);
    } catch (e) {
      console.warn("File deletion warning:", e);
    }

    await db.brandAsset.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/upload/[id] error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
