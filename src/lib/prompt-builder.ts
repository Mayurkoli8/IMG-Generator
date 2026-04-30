// src/lib/prompt-builder.ts
// Builds enhanced AI prompts by combining user input with brand data and campaign templates

import { Brand, CampaignTemplate } from "@prisma/client";

export interface PromptContext {
  brand?: Brand | null;
  template?: CampaignTemplate | null;
  userPrompt: string;
  aspectRatio?: string;
  customFields?: Record<string, string>;
}

// Style presets for different poster moods
const UNIVERSAL_STYLE_RULES = `
Use a premium, professional real estate marketing aesthetic.
The composition must have clean visual hierarchy, strong typography, and balanced negative space.
Design must feel aspirational, modern, and suitable for Instagram.
Avoid cluttered layouts. Use generous padding and elegant proportions.
Leave clear designated areas for logo placement (top-left or bottom), 
contact information (footer area), and CTA text.
The overall image quality must be photorealistic and publication-ready.
No watermarks, no sample text, no placeholder boxes visible in the output.
`.trim();

const ASPECT_RATIO_DIRECTIVES: Record<string, string> = {
  "1:1":
    "Square 1080x1080 Instagram post format. Center-balanced composition.",
  "4:5":
    "Portrait Instagram post format (4:5 ratio). Vertical composition with upper visual focus.",
  "9:16":
    "Instagram Story / Reels format (9:16). Tall vertical layout, bold central element.",
  "16:9": "Wide landscape format. Horizontal panoramic composition.",
};

/**
 * Build an enhanced AI generation prompt from brand data + campaign context + user input
 */
export function buildEnhancedPrompt(ctx: PromptContext): string {
  const { brand, template, userPrompt, aspectRatio = "1:1", customFields } = ctx;

  const parts: string[] = [];

  // 1. Campaign-specific directive
  if (template?.promptPrefix) {
    parts.push(template.promptPrefix);
  } else {
    parts.push("Create a premium real estate marketing poster");
  }

  // 2. Brand identity injection
  if (brand) {
    parts.push(`for ${brand.name}`);
    if (brand.tagline) {
      parts.push(`(brand tagline: "${brand.tagline}")`);
    }

    // Color guidance
    if (brand.primaryColor || brand.secondaryColor) {
      const colors = [brand.primaryColor, brand.secondaryColor, brand.accentColor]
        .filter(Boolean)
        .join(", ");
      parts.push(
        `The color palette should feature brand colors: ${colors}. Incorporate these as dominant tones.`
      );
    }
  }

  // 3. User's actual prompt intent
  parts.push(`Core design intent: ${userPrompt}`);

  // 4. Campaign-specific style hints
  if (template?.styleHints) {
    try {
      const hints = JSON.parse(template.styleHints);
      if (hints.mood) parts.push(`Overall mood: ${hints.mood}`);
      if (hints.colors) parts.push(`Color theme: ${hints.colors}`);
      if (hints.elements) parts.push(`Key visual elements: ${hints.elements}`);
      if (hints.composition)
        parts.push(`Composition approach: ${hints.composition}`);
    } catch {}
  }

  // 5. Style keywords
  if (template?.keywords) {
    parts.push(`Style keywords: ${template.keywords}`);
  }

  // 6. Custom field injection (prices, dates, taglines from user)
  if (customFields && Object.keys(customFields).length > 0) {
    const fieldLines = Object.entries(customFields)
      .filter(([, v]) => v?.trim())
      .map(([k, v]) => `${k}: "${v}"`)
      .join(", ");
    if (fieldLines) {
      parts.push(
        `The poster must incorporate these specific details (leave readable text areas): ${fieldLines}`
      );
    }
  }

  // 7. Overlay notice (we add text programmatically, so AI should leave space)
  if (brand?.phone || brand?.website || brand?.logoUrl) {
    parts.push(
      "IMPORTANT: Leave a clean footer zone (bottom 12-15% of image) with a semi-transparent or solid dark/light strip for overlaying contact information programmatically. Do NOT render contact details in the image itself."
    );
    parts.push(
      "Leave a safe zone in the top-left corner (approximately 15% width, 10% height) for logo placement."
    );
  }

  // 8. Aspect ratio direction
  parts.push(ASPECT_RATIO_DIRECTIVES[aspectRatio] || ASPECT_RATIO_DIRECTIVES["1:1"]);

  // 9. Universal quality rules
  parts.push(UNIVERSAL_STYLE_RULES);

  return parts.join(" ");
}

/**
 * Build a short prompt preview for UI display (truncated)
 */
export function buildPromptPreview(ctx: PromptContext): string {
  const full = buildEnhancedPrompt(ctx);
  if (full.length <= 120) return full;
  return full.slice(0, 117) + "...";
}

/**
 * Campaign type labels for UI display
 */
export const CAMPAIGN_TYPE_LABELS: Record<string, string> = {
  new_year: "New Year Greeting",
  festival: "Festival Greeting",
  property_launch: "Property Launch",
  offer_promotion: "Offer / Promotion",
  site_visit: "Site Visit Invitation",
  possession: "Possession Update",
  milestone: "Milestone Announcement",
  brand_awareness: "Brand Awareness",
  testimonial: "Testimonial Post",
  project_highlight: "Project Highlight",
  construction_update: "Construction Progress",
};

/**
 * Aspect ratio options for UI
 */
export const ASPECT_RATIO_OPTIONS = [
  { value: "1:1", label: "Square (1:1)", hint: "Instagram Feed", icon: "□" },
  { value: "4:5", label: "Portrait (4:5)", hint: "Instagram Portrait", icon: "▭" },
  { value: "9:16", label: "Story (9:16)", hint: "Stories / Reels", icon: "▯" },
  { value: "16:9", label: "Landscape (16:9)", hint: "Facebook / YouTube", icon: "▬" },
];
