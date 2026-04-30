// src/app/api/webhook/generate-poster/route.ts
// Webhook endpoint for n8n and external automation tools

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { runGenerationPipeline } from "@/lib/generation-service";
import { checkRateLimit } from "@/lib/utils";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const RATE_LIMIT_RPM = parseInt(process.env.RATE_LIMIT_RPM || "10");

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  // Optional HMAC auth
  if (WEBHOOK_SECRET) {
    const authHeader = req.headers.get("x-webhook-secret") || req.headers.get("authorization");
    const provided = authHeader?.replace("Bearer ", "").trim();
    if (provided !== WEBHOOK_SECRET) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  // Rate limiting
  const ip = req.headers.get("x-forwarded-for") || "webhook";
  if (!checkRateLimit(`webhook:${ip}`, RATE_LIMIT_RPM)) {
    return NextResponse.json(
      { success: false, error: "Rate limit exceeded" },
      { status: 429 }
    );
  }

  // Parse payload
  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const {
    requestId,
    brandId,
    campaignType,
    prompt,
    aspectRatio = "1:1",
    outputFormat = "png",
    referenceImageUrls,
    customFields,
  } = payload as {
    requestId?: string;
    brandId?: string;
    campaignType?: string;
    prompt?: string;
    aspectRatio?: string;
    outputFormat?: string;
    referenceImageUrls?: string[];
    customFields?: Record<string, string>;
  };

  // Validate
  if (!prompt?.trim()) {
    return NextResponse.json(
      { success: false, error: "prompt field is required" },
      { status: 400 }
    );
  }

  // Log webhook request
  const webhookRecord = await db.webhookRequest.create({
    data: {
      brandId: brandId || null,
      requestId: requestId || null,
      payload: JSON.stringify(payload),
      status: "processing",
      ipAddress: ip,
    },
  });

  try {
    // Validate brandId if provided
    if (brandId) {
      const brand = await db.brand.findUnique({ where: { id: brandId } });
      if (!brand) {
        await db.webhookRequest.update({
          where: { id: webhookRecord.id },
          data: { status: "failed" },
        });
        return NextResponse.json(
          { success: false, error: `Brand '${brandId}' not found` },
          { status: 404 }
        );
      }
    }

    // Run generation pipeline
    const result = await runGenerationPipeline({
      brandId: brandId || undefined,
      userPrompt: prompt.trim(),
      campaignType: campaignType || undefined,
      aspectRatio: aspectRatio as "1:1" | "4:5" | "9:16" | "16:9",
      outputFormat: outputFormat as "png" | "jpeg" | "webp",
      customFields: customFields || undefined,
      requestId: requestId || undefined,
      source: "webhook",
    });

    const responsePayload = {
      success: true,
      generationId: result.generationId,
      imageUrl: result.imageUrl,
      thumbnailUrl: result.thumbnailUrl,
      brandId: result.brandId || null,
      campaignType: result.campaignType || null,
      promptUsed: result.promptUsed,
      createdAt: result.createdAt,
      processingTimeMs: Date.now() - startTime,
      metadata: {
        width: result.width,
        height: result.height,
        aspectRatio,
        outputFormat,
      },
    };

    // Update webhook record
    await db.webhookRequest.update({
      where: { id: webhookRecord.id },
      data: {
        status: "done",
        generationId: result.generationId,
        responsePayload: JSON.stringify(responsePayload),
      },
    });

    return NextResponse.json(responsePayload);
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Generation failed";

    await db.webhookRequest.update({
      where: { id: webhookRecord.id },
      data: {
        status: "failed",
        responsePayload: JSON.stringify({ success: false, error: errMsg }),
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: errMsg,
        processingTimeMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

// GET: Webhook status check / health
export async function GET() {
  const recentRequests = await db.webhookRequest.count({
    where: {
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });

  return NextResponse.json({
    status: "active",
    endpoint: "POST /api/webhook/generate-poster",
    requestsLast24h: recentRequests,
    authRequired: !!WEBHOOK_SECRET,
    timestamp: new Date().toISOString(),
  });
}
