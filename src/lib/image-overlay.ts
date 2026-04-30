// src/lib/image-overlay.ts
// Overlays brand identity elements (logo, contact info, CTA) onto generated images
// This ensures 100% consistent branding regardless of AI output

import sharp from "sharp";
import path from "path";
import fs from "fs";

interface OverlayOptions {
  imageBuffer: Buffer;
  brandName?: string;
  phone?: string;
  website?: string;
  instagramHandle?: string;
  primaryColor?: string;    // hex
  secondaryColor?: string;  // hex
  logoPath?: string;        // local public path like /uploads/xxxx.png
  tagline?: string;
}

interface OverlayResult {
  buffer: Buffer;
  width: number;
  height: number;
}

// Convert hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16) || 0,
    g: parseInt(h.slice(2, 4), 16) || 0,
    b: parseInt(h.slice(4, 6), 16) || 0,
  };
}

// Determine text color (black or white) based on background color
function contrastColor(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#1a1a1a" : "#ffffff";
}

// Build SVG footer bar with contact info
function buildContactFooterSvg(opts: {
  width: number;
  footerHeight: number;
  brandName: string;
  phone?: string;
  website?: string;
  instagramHandle?: string;
  primaryColor: string;
  textColor: string;
}): Buffer {
  const {
    width,
    footerHeight,
    brandName,
    phone,
    website,
    instagramHandle,
    primaryColor,
    textColor,
  } = opts;

  const { r, g, b } = hexToRgb(primaryColor);

  // Build contact segments
  const segments: string[] = [];
  if (phone) segments.push(`📞 ${phone}`);
  if (website) segments.push(`🌐 ${website}`);
  if (instagramHandle) segments.push(`📷 ${instagramHandle}`);

  const contactText = segments.join("  •  ");

  const brandFontSize = Math.round(footerHeight * 0.32);
  const contactFontSize = Math.round(footerHeight * 0.24);
  const brandY = footerHeight * 0.4;
  const contactY = footerHeight * 0.72;

  const svgContent = `
<svg width="${width}" height="${footerHeight}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="footerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(${r},${g},${b},0.92)" />
      <stop offset="100%" style="stop-color:rgba(${r},${g},${b},1)" />
    </linearGradient>
  </defs>
  
  <!-- Footer background -->
  <rect width="${width}" height="${footerHeight}" fill="url(#footerGrad)" />
  
  <!-- Top separator line -->
  <rect width="${width}" height="1.5" fill="rgba(255,255,255,0.25)" />
  
  <!-- Brand name -->
  <text 
    x="${width / 2}" 
    y="${brandY}" 
    text-anchor="middle" 
    dominant-baseline="middle"
    font-family="Georgia, 'Times New Roman', serif" 
    font-size="${brandFontSize}" 
    font-weight="700"
    letter-spacing="2"
    fill="${textColor}"
    opacity="1"
  >${brandName.toUpperCase()}</text>
  
  <!-- Contact info -->
  ${
    contactText
      ? `<text 
    x="${width / 2}" 
    y="${contactY}" 
    text-anchor="middle" 
    dominant-baseline="middle"
    font-family="Arial, Helvetica, sans-serif" 
    font-size="${contactFontSize}"
    letter-spacing="0.5"
    fill="${textColor}"
    opacity="0.9"
  >${contactText}</text>`
      : ""
  }
</svg>`;

  return Buffer.from(svgContent.trim());
}

/**
 * Main overlay function:
 * 1. Resizes generated image
 * 2. Adds branded footer bar with contact info
 * 3. Optionally overlays logo in top-left corner
 */
export async function applyBrandOverlay(opts: OverlayOptions): Promise<OverlayResult> {
  const {
    imageBuffer,
    brandName = "Real Estate",
    phone,
    website,
    instagramHandle,
    primaryColor = "#1a1a2e",
    secondaryColor = "#e8c07d",
    logoPath,
    tagline,
  } = opts;

  // Get source image metadata
  const srcMeta = await sharp(imageBuffer).metadata();
  const width = srcMeta.width || 1024;
  const height = srcMeta.height || 1024;

  const textColor = contrastColor(primaryColor);

  // Calculate footer height (~12% of image height, min 80px)
  const footerHeight = Math.max(80, Math.round(height * 0.12));
  const totalHeight = height + footerHeight;

  // Build footer SVG
  const footerSvg = buildContactFooterSvg({
    width,
    footerHeight,
    brandName: brandName || "Brand",
    phone,
    website,
    instagramHandle,
    primaryColor,
    textColor,
  });

  // Composite: paste footer below main image
  let compositeOps: sharp.OverlayOptions[] = [
    {
      input: await sharp(footerSvg).png().toBuffer(),
      left: 0,
      top: height,
    },
  ];

  // Optionally add logo overlay in top-left
  if (logoPath) {
    try {
      const logoBuffer = readLocalAsset(logoPath);
      if (logoBuffer) {
        const logoSize = Math.round(width * 0.14); // 14% of width
        const logoPadding = Math.round(width * 0.025);

        // Resize logo with white padding square background
        const processedLogo = await sharp(logoBuffer)
          .resize(logoSize - logoPadding * 2, logoSize - logoPadding * 2, {
            fit: "contain",
            background: { r: 255, g: 255, b: 255, alpha: 0 },
          })
          .png()
          .toBuffer();

        // Build logo container SVG
        const logoContainerSvg = Buffer.from(`
<svg width="${logoSize}" height="${logoSize}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${logoSize}" height="${logoSize}" rx="6" fill="rgba(255,255,255,0.88)" />
</svg>`);

        const logoContainer = await sharp(logoContainerSvg)
          .png()
          .composite([
            {
              input: processedLogo,
              left: logoPadding,
              top: logoPadding,
            },
          ])
          .toBuffer();

        compositeOps.push({
          input: logoContainer,
          left: Math.round(width * 0.025),
          top: Math.round(height * 0.025),
        });
      }
    } catch (e) {
      console.warn("Logo overlay failed:", e);
    }
  }

  // Build final canvas and composite everything
  const finalBuffer = await sharp({
    create: {
      width,
      height: totalHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 255 },
    },
  })
    .composite([
      { input: imageBuffer, left: 0, top: 0 },
      ...compositeOps,
    ])
    .png()
    .toBuffer();

  return {
    buffer: finalBuffer,
    width,
    height: totalHeight,
  };
}

/**
 * Create a thumbnail version of the poster (400px wide)
 */
export async function createThumbnail(imageBuffer: Buffer): Promise<Buffer> {
  return sharp(imageBuffer)
    .resize(400, undefined, { fit: "inside" })
    .jpeg({ quality: 80 })
    .toBuffer();
}

function readLocalAsset(publicPath: string): Buffer | null {
  try {
    const fullPath = path.join(process.cwd(), "public", publicPath);
    if (fs.existsSync(fullPath)) return fs.readFileSync(fullPath);
    return null;
  } catch {
    return null;
  }
}
