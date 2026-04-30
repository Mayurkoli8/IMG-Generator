// src/app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { runGenerationPipeline } from "@/lib/generation-service";
import { checkRateLimit } from "@/lib/utils";

const RATE_LIMIT_RPM = parseInt(process.env.RATE_LIMIT_RPM || "10");

export async function POST(req: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(`generate:${ip}`, RATE_LIMIT_RPM)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await req.json();

    const {
      brandId,
      userPrompt,
      campaignType,
      aspectRatio,
      outputFormat,
      customFields,
    } = body;

    if (!userPrompt?.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (userPrompt.length > 2000) {
      return NextResponse.json(
        { error: "Prompt too long. Max 2000 characters." },
        { status: 400 }
      );
    }

    const result = await runGenerationPipeline({
      brandId: brandId || undefined,
      userPrompt: userPrompt.trim(),
      campaignType: campaignType || undefined,
      aspectRatio: aspectRatio || "1:1",
      outputFormat: outputFormat || "png",
      customFields,
      source: "manual",
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Generation failed";
    console.error("POST /api/generate error:", error);

    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    { message: "POST to this endpoint to generate a poster" },
    { status: 200 }
  );
}
