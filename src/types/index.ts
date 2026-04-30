// src/types/index.ts

export interface BrandProfile {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  instagramHandle: string | null;
  facebookHandle: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontPrimary: string;
  fontSecondary: string;
  designRules: string | null;
  logoUrl: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AssetRecord {
  id: string;
  brandId: string;
  type: AssetType;
  name: string;
  url: string;
  mimeType: string | null;
  sizeBytes: number | null;
  description: string | null;
  tags: string | null;
  createdAt: string;
}

export type AssetType =
  | "logo"
  | "sample_poster"
  | "property_photo"
  | "reference"
  | "brochure"
  | "document";

export type CampaignType =
  | "new_year"
  | "festival"
  | "property_launch"
  | "offer_promotion"
  | "site_visit"
  | "possession"
  | "milestone"
  | "brand_awareness"
  | "testimonial"
  | "project_highlight"
  | "construction_update";

export type AspectRatio = "1:1" | "4:5" | "9:16" | "16:9";
export type OutputFormat = "png" | "jpeg" | "webp";
export type GenerationStatus = "pending" | "processing" | "done" | "failed";
export type GenerationSource = "manual" | "webhook";

export interface GenerationJobRecord {
  id: string;
  brandId: string | null;
  requestId: string | null;
  campaignType: CampaignType | null;
  userPrompt: string;
  enhancedPrompt: string | null;
  aspectRatio: AspectRatio;
  outputFormat: OutputFormat;
  status: GenerationStatus;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  fileSizeBytes: number | null;
  errorMessage: string | null;
  metadata: string | null;
  source: GenerationSource;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookPayload {
  requestId?: string;
  brandId?: string;
  campaignType?: CampaignType;
  prompt: string;
  aspectRatio?: AspectRatio;
  outputFormat?: OutputFormat;
  referenceImageUrls?: string[];
  customFields?: Record<string, string>;
}

export interface WebhookResponse {
  success: boolean;
  generationId?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  brandId?: string | null;
  campaignType?: string | null;
  promptUsed?: string;
  createdAt?: string;
  processingTimeMs?: number;
  metadata?: Record<string, unknown>;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
