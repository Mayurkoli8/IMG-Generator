// src/lib/openai-image.ts
// Isolated OpenAI image provider - swap this file to change AI providers

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type AspectRatio = "1:1" | "4:5" | "9:16" | "16:9";
export type OutputFormat = "png" | "jpeg" | "webp";
export type ImageQuality = "standard" | "hd";

export interface GenerateImageOptions {
  prompt: string;
  aspectRatio?: AspectRatio;
  outputFormat?: OutputFormat;
  quality?: ImageQuality;
  referenceImages?: string[]; // base64 or URLs
}

export interface GenerateImageResult {
  imageBuffer: Buffer;
  model: string;
  promptUsed: string;
  revisedPrompt?: string;
}

// Map aspect ratio to OpenAI size strings
const ASPECT_RATIO_MAP: Record<AspectRatio, string> = {
  "1:1": "1024x1024",
  "4:5": "1024x1280",
  "9:16": "1024x1792",
  "16:9": "1792x1024",
};

const MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

/**
 * Generate a poster image using OpenAI
 * Uses gpt-image-1 by default; falls back to dall-e-3 if needed
 */
export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResult> {
  const {
    prompt,
    aspectRatio = "1:1",
    outputFormat = "png",
    quality = "hd",
  } = options;

  const size = ASPECT_RATIO_MAP[aspectRatio] as
    | "1024x1024"
    | "1024x1792"
    | "1792x1024"
    | "1024x1280";

  try {
    // Try gpt-image-1 first (supports image inputs)
    if (MODEL === "gpt-image-1") {
      return await generateWithGptImage1(prompt, size, outputFormat, quality, options.referenceImages);
    }

    // Fall back to dall-e-3
    return await generateWithDallE3(prompt, size, quality);
  } catch (error: unknown) {
    const err = error as Error & { status?: number; code?: string };

    // If gpt-image-1 fails, try dall-e-3
    if (MODEL === "gpt-image-1" && (err.status === 404 || err.code === "model_not_found")) {
      console.warn("gpt-image-1 not available, falling back to dall-e-3");
      return await generateWithDallE3(
        prompt,
        size === "1024x1280" ? "1024x1024" : size, // dall-e-3 doesn't support 1024x1280
        quality
      );
    }

    throw new Error(`Image generation failed: ${err.message || "Unknown error"}`);
  }
}

async function generateWithGptImage1(
  prompt: string,
  size: string,
  outputFormat: string,
  quality: string,
  referenceImages?: string[]
): Promise<GenerateImageResult> {
  // Build request - gpt-image-1 uses responses.create with image output
  const params: OpenAI.Images.ImageGenerateParams = {
    model: "gpt-image-1",
    prompt,
    n: 1,
    size: size as "1024x1024" | "1024x1792" | "1792x1024",
    quality: quality as "standard" | "hd",
    // output_format is supported in newer versions
  };

  const response = await client.images.generate(params);

  const imageData = response.data?.[0];
  if (!imageData) throw new Error("No image data returned from OpenAI");

  let imageBuffer: Buffer;
  if (imageData.b64_json) {
    imageBuffer = Buffer.from(imageData.b64_json, "base64");
  } else if (imageData.url) {
    const { default: https } = await import("https");
    imageBuffer = await downloadImageBuffer(imageData.url);
  } else {
    throw new Error("No image URL or base64 in response");
  }

  return {
    imageBuffer,
    model: "gpt-image-1",
    promptUsed: prompt,
    revisedPrompt: imageData.revised_prompt,
  };
}

async function generateWithDallE3(
  prompt: string,
  size: string,
  quality: string
): Promise<GenerateImageResult> {
  const validSizes = ["1024x1024", "1792x1024", "1024x1792"];
  const safeSize = validSizes.includes(size) ? size : "1024x1024";

  const response = await client.images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size: safeSize as "1024x1024" | "1792x1024" | "1024x1792",
    quality: quality === "hd" ? "hd" : "standard",
    response_format: "b64_json",
  });

  const imageData = response.data?.[0];
  if (!imageData?.b64_json) throw new Error("No image data from DALL-E 3");

  return {
    imageBuffer: Buffer.from(imageData.b64_json, "base64"),
    model: "dall-e-3",
    promptUsed: prompt,
    revisedPrompt: imageData.revised_prompt,
  };
}

function downloadImageBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? require("https") : require("http");
    lib.get(url, (res: any) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    });
  });
}
