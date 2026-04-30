// src/lib/storage.ts
// Abstracted storage layer — swap provider by changing STORAGE_MODE env var
//
// KEY FIX: Uses require() with /* webpackIgnore: true */ comments instead of
// dynamic import() — Next.js webpack statically resolves ALL import() calls
// at build time even inside if-blocks, causing "Module not found: cloudinary".

import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const STORAGE_MODE = process.env.STORAGE_MODE || "local";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export interface StoredFile {
  url: string;
  filePath: string;
  fileName: string;
  sizeBytes: number;
}

// ─── LOCAL STORAGE ───────────────────────────────────────────────────────────
async function saveLocal(
  buffer: Buffer,
  folder: "uploads" | "generated",
  extension: string,
  originalName?: string
): Promise<StoredFile> {
  const dir = path.join(process.cwd(), "public", folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const safeName = originalName
    ? originalName.replace(/[^a-zA-Z0-9.-]/g, "_").slice(0, 50)
    : "file";
  const fileName = `${uuidv4()}_${safeName}.${extension}`;
  const filePath = path.join(dir, fileName);

  fs.writeFileSync(filePath, buffer);

  return {
    url: `${APP_URL}/${folder}/${fileName}`,
    filePath: `/${folder}/${fileName}`,
    fileName,
    sizeBytes: buffer.length,
  };
}

async function deleteLocal(filePath: string): Promise<void> {
  const fullPath = path.join(process.cwd(), "public", filePath);
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
}

// ─── CLOUDINARY ──────────────────────────────────────────────────────────────
// Using require() + webpackIgnore so Next.js bundler never touches this module
async function saveCloudinary(
  buffer: Buffer,
  folder: string,
  _extension: string,
  _originalName?: string
): Promise<StoredFile> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const cloudinaryPkg = require(/* webpackIgnore: true */ "cloudinary");
  const cloudinary = cloudinaryPkg.v2;

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const uploadFolder = `${process.env.CLOUDINARY_FOLDER || "brandposter"}/${folder}`;

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: uploadFolder, resource_type: "auto" },
        (err: Error | null, result: Record<string, unknown> | undefined) => {
          if (err || !result) return reject(err || new Error("Cloudinary upload failed"));
          resolve({
            url: result.secure_url as string,
            filePath: result.public_id as string,
            fileName: (result.original_filename as string) || (result.public_id as string),
            sizeBytes: result.bytes as number,
          });
        }
      )
      .end(buffer);
  });
}

// ─── AWS S3 ──────────────────────────────────────────────────────────────────
// Using require() + webpackIgnore so Next.js bundler never touches this module
async function saveS3(
  buffer: Buffer,
  folder: string,
  extension: string,
  originalName?: string
): Promise<StoredFile> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { S3Client, PutObjectCommand } = require(/* webpackIgnore: true */ "@aws-sdk/client-s3");

  const client = new S3Client({
    region: process.env.AWS_REGION || "ap-south-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  const safeName = originalName
    ? originalName.replace(/[^a-zA-Z0-9.-]/g, "_").slice(0, 50)
    : "file";
  const key = `${folder}/${uuidv4()}_${safeName}.${extension}`;
  const bucket = process.env.AWS_S3_BUCKET!;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: extension === "png" ? "image/png" : "image/jpeg",
    })
  );

  const baseUrl = process.env.AWS_S3_PUBLIC_URL || `https://${bucket}.s3.amazonaws.com`;

  return {
    url: `${baseUrl}/${key}`,
    filePath: key,
    fileName: key.split("/").pop()!,
    sizeBytes: buffer.length,
  };
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────
export async function saveFile(
  buffer: Buffer,
  folder: "uploads" | "generated",
  extension: string,
  originalName?: string
): Promise<StoredFile> {
  switch (STORAGE_MODE) {
    case "cloudinary":
      return saveCloudinary(buffer, folder, extension, originalName);
    case "s3":
      return saveS3(buffer, folder, extension, originalName);
    default:
      return saveLocal(buffer, folder, extension, originalName);
  }
}

export async function deleteFile(filePath: string): Promise<void> {
  if (STORAGE_MODE === "local") await deleteLocal(filePath);
}

export function readLocalFile(publicPath: string): Buffer | null {
  try {
    const fullPath = path.join(process.cwd(), "public", publicPath);
    if (fs.existsSync(fullPath)) return fs.readFileSync(fullPath);
    return null;
  } catch {
    return null;
  }
}
