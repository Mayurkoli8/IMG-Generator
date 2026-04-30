"use client";
// src/app/assets/page.tsx
import { AppLayout } from "@/components/AppLayout";
import { Button, Card, Select, Badge, EmptyState } from "@/components/ui";
import { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import {
  Upload, Image as ImageIcon, FileText, Trash2,
  Loader2, FolderOpen, Check
} from "lucide-react";
import { formatFileSize, formatRelativeTime } from "@/lib/utils";

interface Brand { id: string; name: string; }
interface Asset {
  id: string; brandId: string; type: string; name: string;
  url: string; mimeType: string | null; sizeBytes: number | null;
  description: string | null; createdAt: string;
}

const ASSET_TYPES = [
  { value: "logo", label: "Logo" },
  { value: "sample_poster", label: "Sample Poster" },
  { value: "property_photo", label: "Property Photo" },
  { value: "reference", label: "Reference Image" },
  { value: "brochure", label: "Brochure / PDF" },
  { value: "document", label: "Document" },
];

const TYPE_COLORS: Record<string, string> = {
  logo: "gold", sample_poster: "success", property_photo: "default",
  reference: "warning", brochure: "error", document: "default",
};

export default function AssetsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetType, setAssetType] = useState("reference");
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  useEffect(() => {
    fetch("/api/brands")
      .then(r => r.json())
      .then(d => {
        setBrands(d.brands || []);
        if (d.brands?.length > 0) setSelectedBrand(d.brands[0].id);
      });
  }, []);

  useEffect(() => {
    if (!selectedBrand) return;
    setLoadingAssets(true);
    fetch(`/api/upload?brandId=${selectedBrand}`)
      .then(r => r.json())
      .then(d => setAssets(d.assets || []))
      .catch(() => toast.error("Failed to load assets"))
      .finally(() => setLoadingAssets(false));
  }, [selectedBrand]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!selectedBrand) { toast.error("Please select a brand first"); return; }
    setUploading(true);
    const newUploaded: string[] = [];

    for (const file of acceptedFiles) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("brandId", selectedBrand);
      fd.append("assetType", assetType);

      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        newUploaded.push(file.name);
        toast.success(`Uploaded: ${file.name}`);
      } catch (e: unknown) {
        toast.error(`Failed: ${file.name} — ${e instanceof Error ? e.message : "error"}`);
      }
    }

    setUploadedFiles(p => [...p, ...newUploaded]);
    setUploading(false);

    // Reload assets
    fetch(`/api/upload?brandId=${selectedBrand}`)
      .then(r => r.json())
      .then(d => setAssets(d.assets || []));
  }, [selectedBrand, assetType]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"],
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    maxSize: 20 * 1024 * 1024,
    multiple: true,
  });

  async function deleteAsset(assetId: string) {
    if (!confirm("Delete this asset?")) return;
    try {
      await fetch(`/api/upload/${assetId}`, { method: "DELETE" });
      setAssets(a => a.filter(x => x.id !== assetId));
      toast.success("Asset deleted");
    } catch { toast.error("Delete failed"); }
  }

  const isImage = (mime: string | null) => mime?.startsWith("image/") ?? false;

  return (
    <AppLayout>
      <div className="p-8 space-y-6 animate-fade-in">
        <div>
          <h1 className="font-display text-3xl font-semibold text-white">Asset Library</h1>
          <p className="text-slate-500 mt-1 text-sm">Upload logos, reference images, brochures and photos</p>
        </div>

        {/* Controls row */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-56">
            <Select
              label="Brand"
              value={selectedBrand}
              onChange={e => setSelectedBrand(e.target.value)}
              options={brands.map(b => ({ value: b.id, label: b.name }))}
              placeholder="Select brand"
            />
          </div>
          <div className="w-48">
            <Select
              label="Upload as"
              value={assetType}
              onChange={e => setAssetType(e.target.value)}
              options={ASSET_TYPES}
            />
          </div>
        </div>

        {/* Drop zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
            isDragActive
              ? "border-brand-500/60 bg-brand-500/5"
              : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3">
            {uploading ? (
              <Loader2 className="w-10 h-10 text-brand-400 animate-spin" />
            ) : isDragActive ? (
              <div className="w-14 h-14 rounded-2xl bg-brand-500/20 flex items-center justify-center">
                <Upload className="w-7 h-7 text-brand-400" />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
                <Upload className="w-7 h-7 text-slate-500" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-slate-300">
                {uploading ? "Uploading..." : isDragActive ? "Drop files here" : "Drop files or click to upload"}
              </p>
              <p className="text-xs text-slate-600 mt-1">PNG, JPG, WebP, PDF, DOCX, TXT — max 20MB each</p>
            </div>
            {uploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 justify-center mt-1">
                {uploadedFiles.slice(-4).map(f => (
                  <span key={f} className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <Check className="w-2.5 h-2.5" /> {f.length > 20 ? f.slice(0, 20) + "…" : f}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Asset grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide">
              Uploaded Assets {assets.length > 0 && `(${assets.length})`}
            </h2>
          </div>

          {loadingAssets ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton aspect-square rounded-xl" />
              ))}
            </div>
          ) : !selectedBrand ? (
            <EmptyState icon={<FolderOpen className="w-5 h-5" />} title="Select a brand" description="Choose a brand above to view its assets" />
          ) : assets.length === 0 ? (
            <EmptyState icon={<Upload className="w-5 h-5" />} title="No assets yet" description="Upload your first file using the dropzone above" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {assets.map(asset => (
                <Card key={asset.id} className="group overflow-hidden">
                  <div className="aspect-square bg-slate-800 relative">
                    {isImage(asset.mimeType) ? (
                      <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                        <FileText className="w-8 h-8 text-slate-600" />
                        <span className="text-[10px] text-slate-600 font-mono uppercase">
                          {asset.name.split(".").pop()}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button variant="danger" size="sm" onClick={() => deleteAsset(asset.id)}
                        icon={<Trash2 className="w-3 h-3" />}>Delete</Button>
                    </div>
                    <div className="absolute top-1.5 left-1.5">
                      <Badge variant={(TYPE_COLORS[asset.type] || "default") as "default" | "success" | "warning" | "error" | "gold"}>
                        {asset.type.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-slate-400 truncate">{asset.name}</p>
                    <p className="text-[10px] text-slate-700 mt-0.5">
                      {asset.sizeBytes ? formatFileSize(asset.sizeBytes) : ""} • {formatRelativeTime(asset.createdAt)}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
