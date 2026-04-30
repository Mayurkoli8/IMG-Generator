"use client";
// src/app/webhook-settings/page.tsx
import { AppLayout } from "@/components/AppLayout";
import { Button, Card, Input, Select, Textarea, Badge } from "@/components/ui";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Webhook, Copy, Play, CheckCircle, XCircle, Code, Globe } from "lucide-react";

interface Brand { id: string; name: string; slug: string; }
interface WebhookStatus { status: string; requestsLast24h: number; authRequired: boolean; endpoint: string; }

const CAMPAIGN_TYPES = [
  "new_year","festival","property_launch","offer_promotion","site_visit",
  "possession","milestone","brand_awareness","testimonial","project_highlight","construction_update",
];

const SAMPLE_PAYLOAD = (brandId: string) => ({
  requestId: `req_${Date.now()}`,
  brandId: brandId || "YOUR_BRAND_ID",
  campaignType: "new_year",
  prompt: "Create a premium Happy New Year 2025 greeting post",
  aspectRatio: "1:1",
  outputFormat: "png",
});

export default function WebhookSettingsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [webhookStatus, setWebhookStatus] = useState<WebhookStatus | null>(null);
  const [appUrl, setAppUrl] = useState("");

  // Tester state
  const [testBrandId, setTestBrandId] = useState("");
  const [testCampaign, setTestCampaign] = useState("new_year");
  const [testPrompt, setTestPrompt] = useState("Create a premium Happy New Year greeting post");
  const [testAspect, setTestAspect] = useState("1:1");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<Record<string, unknown> | null>(null);
  const [testError, setTestError] = useState("");
  const [customPayload, setCustomPayload] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  useEffect(() => {
    const url = window.location.origin;
    setAppUrl(url);

    fetch("/api/brands").then(r => r.json()).then(d => {
      setBrands(d.brands || []);
      if (d.brands?.length > 0) setTestBrandId(d.brands[0].id);
    });

    fetch("/api/webhook/generate-poster").then(r => r.json()).then(d => setWebhookStatus(d)).catch(() => {});
  }, []);

  const webhookUrl = `${appUrl}/api/webhook/generate-poster`;

  async function copyText(text: string, label = "Copied!") {
    await navigator.clipboard.writeText(text);
    toast.success(label);
  }

  async function runTest() {
    setTesting(true);
    setTestResult(null);
    setTestError("");

    let payload: Record<string, unknown>;
    if (useCustom) {
      try { payload = JSON.parse(customPayload); }
      catch { setTestError("Invalid JSON in custom payload"); setTesting(false); return; }
    } else {
      payload = {
        requestId: `test_${Date.now()}`,
        brandId: testBrandId || undefined,
        campaignType: testCampaign,
        prompt: testPrompt,
        aspectRatio: testAspect,
        outputFormat: "png",
      };
    }

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (webhookSecret) headers["x-webhook-secret"] = webhookSecret;

      const res = await fetch("/api/webhook/generate-poster", {
        method: "POST", headers, body: JSON.stringify(payload),
      });
      const data = await res.json();
      setTestResult(data);
      if (data.success) toast.success("Webhook test succeeded!");
      else { toast.error("Webhook returned error"); setTestError(data.error || "Unknown error"); }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Request failed";
      setTestError(msg); toast.error(msg);
    } finally { setTesting(false); }
  }

  const currentPayload = useCustom
    ? customPayload
    : JSON.stringify(SAMPLE_PAYLOAD(testBrandId), null, 2);

  const n8nExample = `// n8n HTTP Request Node settings:
// Method: POST
// URL: ${webhookUrl}
// Headers: Content-Type: application/json${webhookSecret ? `\n//         x-webhook-secret: ${webhookSecret}` : ""}
// Body (JSON):
${JSON.stringify(SAMPLE_PAYLOAD(testBrandId), null, 2)}

// Response will contain:
// {
//   "success": true,
//   "imageUrl": "https://...",
//   "thumbnailUrl": "https://...",
//   "generationId": "...",
//   ...
// }`;

  return (
    <AppLayout>
      <div className="p-8 space-y-6 animate-fade-in">
        <div>
          <h1 className="font-display text-3xl font-semibold text-white">Webhook & n8n Integration</h1>
          <p className="text-slate-500 mt-1 text-sm">Trigger poster generation from n8n or any automation platform</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Config */}
          <div className="space-y-5">
            {/* Endpoint info */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-brand-400" />
                <h3 className="text-sm font-semibold text-slate-200">Webhook Endpoint</h3>
                {webhookStatus && (
                  <Badge variant={webhookStatus.status === "active" ? "success" : "error"}>
                    {webhookStatus.status}
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                  <span>Method: <span className="text-brand-400 font-mono">POST</span></span>
                  {webhookStatus && <span>Requests (24h): <span className="text-slate-300">{webhookStatus.requestsLast24h}</span></span>}
                </div>
                <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
                  <code className="text-xs text-slate-300 font-mono flex-1 break-all">{webhookUrl}</code>
                  <button onClick={() => copyText(webhookUrl, "Endpoint copied!")}
                    className="text-slate-600 hover:text-slate-300 transition-colors flex-shrink-0">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-white/[0.06]">
                <p className="text-xs text-slate-500 mb-3">Authentication (optional)</p>
                <Input
                  label="Webhook Secret"
                  value={webhookSecret}
                  onChange={e => setWebhookSecret(e.target.value)}
                  placeholder="From WEBHOOK_SECRET env var"
                  hint="Send as x-webhook-secret header"
                />
              </div>
            </Card>

            {/* Payload schema */}
            <Card className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-200">Request Schema</h3>
              </div>
              <div className="text-xs font-mono space-y-1.5">
                {[
                  { field: "prompt", type: "string", req: true, desc: "Your poster prompt" },
                  { field: "brandId", type: "string", req: false, desc: "Brand profile ID" },
                  { field: "campaignType", type: "string", req: false, desc: "Campaign type key" },
                  { field: "aspectRatio", type: "1:1|4:5|9:16", req: false, desc: "Output format" },
                  { field: "outputFormat", type: "png|jpeg", req: false, desc: "Image format" },
                  { field: "requestId", type: "string", req: false, desc: "Idempotency key" },
                  { field: "customFields", type: "object", req: false, desc: "price, location, offer…" },
                ].map(f => (
                  <div key={f.field} className="grid grid-cols-[120px,80px,1fr] gap-2 items-start py-1 border-b border-white/[0.04] last:border-0">
                    <span className="text-brand-300">{f.field}</span>
                    <span className="text-slate-600 truncate">{f.type}</span>
                    <span className="text-slate-500 flex items-center gap-1">
                      {f.req && <span className="text-red-400 text-[9px] font-bold">REQ</span>}
                      {f.desc}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* n8n setup guide */}
            <Card className="p-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Webhook className="w-4 h-4 text-purple-400" /> n8n Setup
              </h3>
              <div className="space-y-2 text-xs text-slate-500">
                <p className="flex gap-2"><span className="text-brand-400 font-bold">1.</span> Add an <span className="text-slate-300 font-medium">HTTP Request</span> node in n8n</p>
                <p className="flex gap-2"><span className="text-brand-400 font-bold">2.</span> Set method to <span className="font-mono text-slate-300">POST</span>, paste the endpoint URL</p>
                <p className="flex gap-2"><span className="text-brand-400 font-bold">3.</span> Set body type to <span className="font-mono text-slate-300">JSON</span> and paste your payload</p>
                <p className="flex gap-2"><span className="text-brand-400 font-bold">4.</span> Access <span className="font-mono text-slate-300">{"{{ $json.imageUrl }}"}</span> in the next node</p>
                <p className="flex gap-2"><span className="text-brand-400 font-bold">5.</span> Send to Telegram, Drive, WhatsApp — anything!</p>
              </div>
              <div className="bg-black/40 border border-white/[0.06] rounded-lg p-3 relative">
                <pre className="text-[10px] text-slate-400 font-mono overflow-x-auto whitespace-pre-wrap">{n8nExample}</pre>
                <button
                  onClick={() => copyText(n8nExample, "n8n example copied!")}
                  className="absolute top-2 right-2 text-slate-600 hover:text-slate-300 transition-colors"
                ><Copy className="w-3 h-3" /></button>
              </div>
            </Card>
          </div>

          {/* Right: Live tester */}
          <div className="space-y-5">
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Play className="w-4 h-4 text-emerald-400" /> Webhook Tester
                </h3>
                <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                  <input type="checkbox" checked={useCustom} onChange={e => setUseCustom(e.target.checked)} className="rounded" />
                  Custom JSON
                </label>
              </div>

              {!useCustom ? (
                <div className="space-y-3">
                  <Select
                    label="Brand"
                    value={testBrandId}
                    onChange={e => setTestBrandId(e.target.value)}
                    options={brands.map(b => ({ value: b.id, label: b.name }))}
                    placeholder="No brand (generic)"
                  />
                  <Select
                    label="Campaign Type"
                    value={testCampaign}
                    onChange={e => setTestCampaign(e.target.value)}
                    options={CAMPAIGN_TYPES.map(c => ({ value: c, label: c.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) }))}
                  />
                  <Input
                    label="Prompt"
                    value={testPrompt}
                    onChange={e => setTestPrompt(e.target.value)}
                  />
                  <Select
                    label="Aspect Ratio"
                    value={testAspect}
                    onChange={e => setTestAspect(e.target.value)}
                    options={[
                      { value: "1:1", label: "Square (1:1)" },
                      { value: "4:5", label: "Portrait (4:5)" },
                      { value: "9:16", label: "Story (9:16)" },
                    ]}
                  />
                </div>
              ) : (
                <Textarea
                  label="Custom JSON Payload"
                  value={customPayload || JSON.stringify(SAMPLE_PAYLOAD(testBrandId), null, 2)}
                  onChange={e => setCustomPayload(e.target.value)}
                  rows={8}
                  className="font-mono text-xs"
                />
              )}

              {/* Payload preview */}
              <div className="bg-black/40 border border-white/[0.06] rounded-lg p-3 relative">
                <p className="text-[10px] text-slate-600 mb-1.5">Payload preview</p>
                <pre className="text-[10px] text-slate-400 font-mono overflow-x-auto whitespace-pre-wrap max-h-36">
                  {currentPayload}
                </pre>
                <button onClick={() => copyText(currentPayload, "Payload copied!")}
                  className="absolute top-2 right-2 text-slate-600 hover:text-slate-300 transition-colors">
                  <Copy className="w-3 h-3" />
                </button>
              </div>

              <Button
                onClick={runTest}
                loading={testing}
                className="w-full"
                icon={<Play className="w-4 h-4" />}
              >
                {testing ? "Generating poster via webhook..." : "Send Test Request"}
              </Button>
            </Card>

            {/* Test result */}
            {(testResult || testError) && (
              <Card className="p-5 space-y-3 animate-slide-up">
                <div className="flex items-center gap-2">
                  {testResult?.success
                    ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                    : <XCircle className="w-4 h-4 text-red-400" />}
                  <h3 className="text-sm font-semibold text-slate-200">
                    {testResult?.success ? "Test Passed ✓" : "Test Failed ✗"}
                  </h3>
                </div>

                {testError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-xs text-red-400">{testError}</p>
                  </div>
                )}

                {testResult?.imageUrl && (
                  <div className="rounded-xl overflow-hidden border border-white/10">
                    <img src={String(testResult.imageUrl)} alt="Webhook result" className="w-full" />
                  </div>
                )}

                {testResult && (
                  <div className="bg-black/40 border border-white/[0.06] rounded-lg p-3 relative">
                    <p className="text-[10px] text-slate-600 mb-1">Response JSON</p>
                    <pre className="text-[10px] text-slate-400 font-mono overflow-x-auto whitespace-pre-wrap max-h-48">
                      {JSON.stringify(testResult, null, 2)}
                    </pre>
                    <button onClick={() => copyText(JSON.stringify(testResult, null, 2), "Response copied!")}
                      className="absolute top-2 right-2 text-slate-600 hover:text-slate-300">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
