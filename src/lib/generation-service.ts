// src/lib/generation-service.ts
// Orchestrates the full poster generation pipeline

import { db } from "./db";
import { generateImage, AspectRatio, OutputFormat } from "./openai-image";
import { buildEnhancedPrompt } from "./prompt-builder";
import { applyBrandOverlay, createThumbnail } from "./image-overlay";
import { saveFile } from "./storage";

export interface GenerationRequest {
  brandId?: string;
  userPrompt: string;
  campaignType?: string;
  aspectRatio?: AspectRatio;
  outputFormat?: OutputFormat;
  referenceImageUrls?: string[];
  customFields?: Record<string, string>;
  requestId?: string;         // for idempotency
  source?: "manual" | "webhook";
}

export interface GenerationResult {
  generationId: string;
  imageUrl: string;
  thumbnailUrl: string;
  brandId?: string;
  campaignType?: string;
  promptUsed: string;
  createdAt: string;
  width?: number;
  height?: number;
}

export async function runGenerationPipeline(
  req: GenerationRequest
): Promise<GenerationResult> {
  const {
    brandId,
    userPrompt,
    campaignType,
    aspectRatio = "1:1",
    outputFormat = "png",
    customFields,
    requestId,
    source = "manual",
  } = req;

  // ── Idempotency check ──────────────────────────────────────────────────
  if (requestId) {
    const existing = await db.generationJob.findUnique({
      where: { requestId },
    });
    if (existing?.status === "done" && existing.imageUrl) {
      return {
        generationId: existing.id,
        imageUrl: existing.imageUrl,
        thumbnailUrl: existing.thumbnailUrl || existing.imageUrl,
        brandId: existing.brandId || undefined,
        campaignType: existing.campaignType || undefined,
        promptUsed: existing.enhancedPrompt || existing.userPrompt,
        createdAt: existing.createdAt.toISOString(),
        width: existing.imageWidth || undefined,
        height: existing.imageHeight || undefined,
      };
    }
  }

  // ── Create job record ──────────────────────────────────────────────────
  const job = await db.generationJob.create({
    data: {
      brandId: brandId || null,
      requestId: requestId || null,
      campaignType: campaignType || null,
      userPrompt,
      aspectRatio,
      outputFormat,
      status: "processing",
      source,
    },
  });

  try {
    // ── Fetch brand + template data ────────────────────────────────────
    const [brand, template] = await Promise.all([
      brandId ? db.brand.findUnique({ where: { id: brandId } }) : null,
      campaignType
        ? db.campaignTemplate.findUnique({ where: { campaignType } })
        : null,
    ]);

    // ── Build enhanced prompt ──────────────────────────────────────────
    const enhancedPrompt = buildEnhancedPrompt({
      brand,
      template,
      userPrompt,
      aspectRatio,
      customFields,
    });

    // Update job with enhanced prompt
    await db.generationJob.update({
      where: { id: job.id },
      data: { enhancedPrompt },
    });

    // ── Generate image via OpenAI ──────────────────────────────────────
    const { imageBuffer, model } = await generateImage({
      prompt: enhancedPrompt,
      aspectRatio,
      outputFormat,
      quality: "hd",
    });

    // ── Apply brand overlay ────────────────────────────────────────────
    let finalBuffer = imageBuffer;
    let overlayResult = { width: 1024, height: 1024 };

    if (brand) {
      const overlaid = await applyBrandOverlay({
        imageBuffer,
        brandName: brand.name,
        phone: brand.phone || undefined,
        website: brand.website || undefined,
        instagramHandle: brand.instagramHandle || undefined,
        primaryColor: brand.primaryColor,
        secondaryColor: brand.secondaryColor,
        logoPath: brand.logoUrl || undefined,
      });
      finalBuffer = overlaid.buffer;
      overlayResult = { width: overlaid.width, height: overlaid.height };
    }

    // ── Create thumbnail ───────────────────────────────────────────────
    const thumbnailBuffer = await createThumbnail(finalBuffer);

    // ── Save files to storage ──────────────────────────────────────────
    const [storedImage, storedThumb] = await Promise.all([
      saveFile(finalBuffer, "generated", outputFormat, `poster_${job.id}`),
      saveFile(thumbnailBuffer, "generated", "jpg", `thumb_${job.id}`),
    ]);

    // ── Save prompt to history ─────────────────────────────────────────
    await db.promptHistory.create({
      data: {
        brandId: brandId || null,
        campaignType: campaignType || null,
        userPrompt,
        enhanced: enhancedPrompt,
      },
    });

    // ── Update job to done ─────────────────────────────────────────────
    const updatedJob = await db.generationJob.update({
      where: { id: job.id },
      data: {
        status: "done",
        imageUrl: storedImage.url,
        thumbnailUrl: storedThumb.url,
        imageWidth: overlayResult.width,
        imageHeight: overlayResult.height,
        fileSizeBytes: storedImage.sizeBytes,
        metadata: JSON.stringify({ model }),
      },
    });

    return {
      generationId: job.id,
      imageUrl: storedImage.url,
      thumbnailUrl: storedThumb.url,
      brandId: brandId || undefined,
      campaignType: campaignType || undefined,
      promptUsed: enhancedPrompt,
      createdAt: updatedJob.createdAt.toISOString(),
      width: overlayResult.width,
      height: overlayResult.height,
    };
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    await db.generationJob.update({
      where: { id: job.id },
      data: { status: "failed", errorMessage: errMsg },
    });

    throw new Error(errMsg);
  }
}
