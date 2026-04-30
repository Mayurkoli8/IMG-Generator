"use client";
// src/app/studio/page.tsx — The core AI poster generation interface
import { AppLayout } from "@/components/AppLayout";
import { Button, Card, Select, Textarea, Input, Badge } from "@/components/ui";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Wand2, Download, Copy, ExternalLink, RefreshCw,
  ChevronDown, ChevronUp, Sparkles, Info
} from "lucide-react";
import { ASPECT_RATIO_OPTIONS } from "@/lib/prompt-builder";

interface Brand {
  id: string;
  name: string;
  slug: string;
  primaryColor: string;
  secondaryColor: string;
}

interface CampaignTemplate {
  id: string;
  campaignType: string;
  label: string;
  examplePrompt: string | null;
}

interface GenerationResult {
  success: boolean;
  generationId: string;
  imageUrl: string;
  thumbnailUrl: string;
  brandId?: string;
  campaignType?: string;
  promptUsed: string;
  createdAt: string;
  error?: string;
}

const QUICK_PROMPTS = [
  "Create a Happy New Year 2025 greeting post",
  "Create a luxury 3BHK apartment launch post",
  "Create a Diwali festival greeting",
  "Create a site visit invitation for this weekend",
  "Create a 10% off limited time offer post",
  "Create a possession handover celebration post",
];

export default function StudioPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customFields, setCustomFields] = useState({
    price: "",
    location: "",
    offer: "",
    date: "",
    customCTA: "",
  });
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [showEnhancedPrompt, setShowEnhancedPrompt] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [brandsRes, templatesRes] = await Promise.all([
        fetch("/api/brands"),
        fetch("/api/templates"),
      ]);
      const brandsData = await brandsRes.json();
      const templatesData = await templatesRes.json();
      setBrands(brandsData.brands || []);
      setTemplates(templatesData.templates || []);
    }
    loadData();
  }, []);

  async function handleGenerate() {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setGenerating(true);
    setResult(null);

    const toastId = toast.loading("✨ Generating your poster...", {
      description: "This may take 15-30 seconds",
    });

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: selectedBrand || undefined,
          userPrompt: prompt,
          campaignType: selectedCampaign || undefined,
          aspectRatio,
          customFields: Object.fromEntries(
            Object.entries(customFields).filter(([, v]) => v.trim())
          ),
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Generation failed");
      }

      setResult(data);
      toast.success("Poster generated!", { id: toastId });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Generation failed";
      toast.error(msg, { id: toastId });
    } finally {
      setGenerating(false);
    }
  }

  function applyQuickPrompt(p: string) {
    setPrompt(p);
    toast.success("Prompt applied!");
  }

  async function copyUrl() {
    if (!result?.imageUrl) return;
    await navigator.clipboard.writeText(result.imageUrl);
    toast.success("URL copied to clipboard!");
  }

  function downloadImage() {
    if (!result?.imageUrl) return;
    const a = document.createElement("a");
    a.href = result.imageUrl;
    a.download = `poster_${result.generationId}.png`;
    a.target = "_blank";
    a.click();
  }

  const selectedBrandObj = brands.find((b) => b.id === selectedBrand);

  return (
    <AppLayout>
      <div className="p-8 animate-fade-in">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl font-semibold text-white">Prompt Studio</h1>
            <p className="text-slate-500 mt-1 text-sm">
              Generate brand-consistent marketing posters with AI
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[480px,1fr] gap-6">
          {/* Left: Controls */}
          <div className="space-y-5">
            {/* Brand selector */}
            <Card className="p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 text-xs flex items-center justify-center font-bold">1</span>
                Brand & Campaign
              </h3>

              <Select
                label="Brand Profile"
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                options={brands.map((b) => ({ value: b.id, label: b.name }))}
                placeholder="Select a brand (optional)"
              />

              {selectedBrandObj && (
                <div className="flex items-center gap-2 p-2 bg-white/[0.03] rounded-lg border border-white/[0.06]">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: selectedBrandObj.primaryColor }}
                  />
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: selectedBrandObj.secondaryColor }}
                  />
                  <span className="text-xs text-slate-400">Brand colors applied</span>
                </div>
              )}

              <Select
                label="Campaign Type"
                value={selectedCampaign}
                onChange={(e) => {
                  setSelectedCampaign(e.target.value);
                  const t = templates.find((t) => t.campaignType === e.target.value);
                  if (t?.examplePrompt && !prompt) setPrompt(t.examplePrompt);
                }}
                options={templates.map((t) => ({
                  value: t.campaignType,
                  label: t.label,
                }))}
                placeholder="Select campaign type (optional)"
              />
            </Card>

            {/* Prompt input */}
            <Card className="p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 text-xs flex items-center justify-center font-bold">2</span>
                Your Prompt
              </h3>

              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Create a New Year post..."
                rows={4}
                hint={`${prompt.length}/2000 characters`}
              />

              <div>
                <p className="text-xs text-slate-600 mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Quick prompts
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.slice(0, 4).map((qp) => (
                    <button
                      key={qp}
                      onClick={() => applyQuickPrompt(qp)}
                      className="text-[10px] px-2 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-slate-500 hover:text-slate-300 hover:border-white/20 transition-colors"
                    >
                      {qp.length > 30 ? qp.slice(0, 30) + "..." : qp}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Format settings */}
            <Card className="p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 text-xs flex items-center justify-center font-bold">3</span>
                Format
              </h3>

              <div className="grid grid-cols-2 gap-2">
                {ASPECT_RATIO_OPTIONS.map((ar) => (
                  <button
                    key={ar.value}
                    onClick={() => setAspectRatio(ar.value)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      aspectRatio === ar.value
                        ? "border-brand-500/50 bg-brand-500/10 text-brand-300"
                        : "border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{ar.icon}</span>
                      <div>
                        <p className="text-xs font-medium">{ar.label}</p>
                        <p className="text-[10px] text-slate-600 mt-0.5">{ar.hint}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Advanced settings */}
            <Card className="overflow-hidden">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full p-5 flex items-center justify-between text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                <span className="font-medium">Advanced Fields (optional)</span>
                {showAdvanced ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showAdvanced && (
                <div className="px-5 pb-5 space-y-3 border-t border-white/[0.06]">
                  <p className="text-xs text-slate-600 pt-3 flex items-center gap-1.5">
                    <Info className="w-3 h-3" />
                    These will be overlaid as text instructions to the AI
                  </p>
                  {[
                    { key: "price", label: "Price / Offer", placeholder: "₹45 Lakhs onwards" },
                    { key: "location", label: "Location", placeholder: "Pune, Wakad" },
                    { key: "offer", label: "Special Offer", placeholder: "Free parking for first 10 bookings" },
                    { key: "date", label: "Date / Event", placeholder: "Sunday, 25th Jan 2025" },
                    { key: "customCTA", label: "CTA Text", placeholder: "Call Now to Book!" },
                  ].map(({ key, label, placeholder }) => (
                    <Input
                      key={key}
                      label={label}
                      value={customFields[key as keyof typeof customFields]}
                      onChange={(e) =>
                        setCustomFields((f) => ({ ...f, [key]: e.target.value }))
                      }
                      placeholder={placeholder}
                    />
                  ))}
                </div>
              )}
            </Card>

            {/* Generate button */}
            <Button
              onClick={handleGenerate}
              loading={generating}
              size="lg"
              className="w-full"
              icon={<Wand2 className="w-5 h-5" />}
            >
              {generating ? "Generating Poster..." : "Generate Poster"}
            </Button>
          </div>

          {/* Right: Preview panel */}
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-300">Preview</h3>
                {result && (
                  <div className="flex items-center gap-2">
                    <Badge variant="success">Generated</Badge>
                    <span className="text-xs text-slate-600 font-mono">{result.generationId?.slice(0, 8)}</span>
                  </div>
                )}
              </div>

              {/* Preview area */}
              <div className="aspect-square max-w-lg mx-auto p-6">
                {generating ? (
                  <div className="w-full h-full rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-col items-center justify-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin" />
                      <Wand2 className="w-5 h-5 text-brand-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-400 font-medium">AI is creating your poster</p>
                      <p className="text-xs text-slate-600 mt-1">Usually takes 15-30 seconds...</p>
                    </div>
                    <div className="flex gap-1 mt-2">
                      {["Analyzing brand...", "Building prompt...", "Generating image...", "Applying overlay..."].map(
                        (step, i) => (
                          <div
                            key={step}
                            className="w-1.5 h-1.5 rounded-full bg-brand-500/40 animate-pulse"
                            style={{ animationDelay: `${i * 0.3}s` }}
                          />
                        )
                      )}
                    </div>
                  </div>
                ) : result?.imageUrl ? (
                  <div className="w-full h-full rounded-xl overflow-hidden border border-white/10 shadow-2xl animate-scale-in">
                    <img
                      src={result.imageUrl}
                      alt="Generated poster"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full rounded-xl bg-white/[0.02] border border-dashed border-white/10 flex flex-col items-center justify-center gap-3 text-center">
                    <Wand2 className="w-10 h-10 text-slate-700" />
                    <div>
                      <p className="text-sm text-slate-500 font-medium">Your poster will appear here</p>
                      <p className="text-xs text-slate-700 mt-1">Configure your settings and click Generate</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Output panel with actions */}
            {result?.success && (
              <Card className="p-5 space-y-4 animate-slide-up">
                <h3 className="text-sm font-semibold text-slate-300">Export & Share</h3>

                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    onClick={downloadImage}
                    icon={<Download className="w-4 h-4" />}
                    className="flex-1"
                  >
                    Download PNG
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={copyUrl}
                    icon={<Copy className="w-4 h-4" />}
                  >
                    Copy URL
                  </Button>
                  <a href={result.imageUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" icon={<ExternalLink className="w-4 h-4" />} />
                  </a>
                </div>

                {/* Image URL display */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3 group">
                  <p className="text-xs text-slate-600 mb-1">Public Image URL</p>
                  <p className="text-xs text-slate-400 font-mono break-all">{result.imageUrl}</p>
                </div>

                {/* Enhanced prompt toggle */}
                <div>
                  <button
                    onClick={() => setShowEnhancedPrompt(!showEnhancedPrompt)}
                    className="text-xs text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    {showEnhancedPrompt ? "Hide" : "Show"} enhanced prompt
                  </button>
                  {showEnhancedPrompt && (
                    <div className="mt-2 p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                      <p className="text-[11px] text-slate-500 leading-relaxed font-mono">
                        {result.promptUsed}
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setResult(null)}
                  icon={<RefreshCw className="w-3 h-3" />}
                  className="w-full"
                >
                  Generate Another
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
