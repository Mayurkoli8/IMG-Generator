"use client";
// src/app/history/page.tsx
import { AppLayout } from "@/components/AppLayout";
import { Button, Card, Select, Badge, EmptyState, Modal } from "@/components/ui";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  History, Download, Copy, ExternalLink, RefreshCw,
  CheckCircle, XCircle, Clock, Loader2, Sparkles, Search
} from "lucide-react";
import { formatDate, formatRelativeTime, truncate } from "@/lib/utils";

interface Job {
  id: string; brandId: string | null; campaignType: string | null;
  userPrompt: string; enhancedPrompt: string | null; aspectRatio: string;
  status: string; imageUrl: string | null; thumbnailUrl: string | null;
  imageWidth: number | null; imageHeight: number | null;
  fileSizeBytes: number | null; errorMessage: string | null;
  source: string; createdAt: string;
  brand?: { name: string; slug: string } | null;
}

interface Pagination { page: number; limit: number; total: number; totalPages: number; }

const STATUS_ICONS: Record<string, React.ReactNode> = {
  done: <CheckCircle className="w-3 h-3 text-emerald-400" />,
  failed: <XCircle className="w-3 h-3 text-red-400" />,
  processing: <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />,
  pending: <Clock className="w-3 h-3 text-slate-500" />,
};

const STATUS_BADGE: Record<string, "success" | "error" | "warning" | "default"> = {
  done: "success", failed: "error", processing: "warning", pending: "default",
};

export default function HistoryPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [selected, setSelected] = useState<Job | null>(null);
  const [searchQ, setSearchQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page), limit: "18",
        ...(filterStatus && { status: filterStatus }),
        ...(filterSource && { source: filterSource }),
      });
      const res = await fetch(`/api/history?${params}`);
      const data = await res.json();
      setJobs(data.jobs || []);
      setPagination(data.pagination);
    } catch { toast.error("Failed to load history"); }
    finally { setLoading(false); }
  }, [page, filterStatus, filterSource]);

  useEffect(() => { load(); }, [load]);

  const filtered = searchQ.trim()
    ? jobs.filter(j => j.userPrompt.toLowerCase().includes(searchQ.toLowerCase()))
    : jobs;

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url);
    toast.success("URL copied!");
  }

  function downloadImage(job: Job) {
    if (!job.imageUrl) return;
    const a = document.createElement("a");
    a.href = job.imageUrl;
    a.download = `poster_${job.id}.png`;
    a.target = "_blank";
    a.click();
  }

  return (
    <AppLayout>
      <div className="p-8 space-y-6 animate-fade-in">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold text-white">Generation History</h1>
            <p className="text-slate-500 mt-1 text-sm">
              Browse all past poster generations — {pagination?.total || 0} total
            </p>
          </div>
          <Button variant="secondary" onClick={load} icon={<RefreshCw className="w-4 h-4" />} size="sm">
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              className="bg-white/[0.04] border border-white/10 rounded-lg text-sm text-slate-300 pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-500/50 w-56 placeholder:text-slate-600"
              placeholder="Search prompts..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
            />
          </div>
          <div className="w-36">
            <Select
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
              options={[
                { value: "done", label: "✅ Done" },
                { value: "failed", label: "❌ Failed" },
                { value: "processing", label: "⏳ Processing" },
              ]}
              placeholder="All statuses"
            />
          </div>
          <div className="w-36">
            <Select
              value={filterSource}
              onChange={e => { setFilterSource(e.target.value); setPage(1); }}
              options={[
                { value: "manual", label: "🎨 Manual" },
                { value: "webhook", label: "🔗 Webhook" },
              ]}
              placeholder="All sources"
            />
          </div>
          {(filterStatus || filterSource || searchQ) && (
            <Button variant="ghost" size="sm" onClick={() => { setFilterStatus(""); setFilterSource(""); setSearchQ(""); setPage(1); }}>
              Clear filters
            </Button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[...Array(12)].map((_, i) => <div key={i} className="skeleton aspect-square rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<History className="w-5 h-5" />}
            title="No generations found"
            description="Try adjusting filters or generate your first poster in the Studio"
          />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {filtered.map(job => (
                <div key={job.id} className="group cursor-pointer" onClick={() => setSelected(job)}>
                  <div className="aspect-square rounded-xl overflow-hidden bg-slate-800 border border-white/[0.06] relative group-hover:border-white/20 transition-all">
                    {job.thumbnailUrl || job.imageUrl ? (
                      <img
                        src={job.thumbnailUrl || job.imageUrl!}
                        alt={job.userPrompt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {STATUS_ICONS[job.status]}
                      </div>
                    )}
                    {/* Status badge */}
                    <div className="absolute top-1.5 right-1.5">
                      <Badge variant={STATUS_BADGE[job.status] || "default"}>
                        {job.status}
                      </Badge>
                    </div>
                    {/* Source tag */}
                    {job.source === "webhook" && (
                      <div className="absolute bottom-1.5 left-1.5">
                        <span className="text-[9px] bg-purple-500/20 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded-full">webhook</span>
                      </div>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                      {job.imageUrl && (
                        <>
                          <button onClick={e => { e.stopPropagation(); downloadImage(job); }}
                            className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors">
                            <Download className="w-3 h-3" />
                          </button>
                          <button onClick={e => { e.stopPropagation(); copyUrl(job.imageUrl!); }}
                            className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors">
                            <Copy className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="mt-1.5 px-0.5">
                    <p className="text-[11px] text-slate-400 leading-tight">{truncate(job.userPrompt, 45)}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {STATUS_ICONS[job.status]}
                      <p className="text-[10px] text-slate-600">{formatRelativeTime(job.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button variant="secondary" size="sm" disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}>← Prev</Button>
                <span className="text-xs text-slate-500 px-3">
                  Page {page} of {pagination.totalPages}
                </span>
                <Button variant="secondary" size="sm" disabled={page >= pagination.totalPages}
                  onClick={() => setPage(p => p + 1)}>Next →</Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <Modal open={!!selected} onClose={() => setSelected(null)} title="Poster Detail" maxWidth="max-w-3xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Image */}
            <div className="aspect-square rounded-xl overflow-hidden bg-slate-800">
              {selected.imageUrl ? (
                <img src={selected.imageUrl} alt="" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {STATUS_ICONS[selected.status]}
                </div>
              )}
            </div>

            {/* Meta */}
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-600 uppercase tracking-wide">Status</p>
                <Badge variant={STATUS_BADGE[selected.status] || "default"} className="mt-1">
                  {selected.status}
                </Badge>
              </div>

              <div>
                <p className="text-xs text-slate-600 uppercase tracking-wide">Prompt</p>
                <p className="text-sm text-slate-300 mt-1">{selected.userPrompt}</p>
              </div>

              {selected.brand && (
                <div>
                  <p className="text-xs text-slate-600 uppercase tracking-wide">Brand</p>
                  <p className="text-sm text-slate-300 mt-1">{selected.brand.name}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-slate-600">Aspect ratio</p>
                  <p className="text-slate-300 mt-0.5">{selected.aspectRatio}</p>
                </div>
                <div>
                  <p className="text-slate-600">Source</p>
                  <p className="text-slate-300 mt-0.5 capitalize">{selected.source}</p>
                </div>
                {selected.imageWidth && (
                  <div>
                    <p className="text-slate-600">Dimensions</p>
                    <p className="text-slate-300 mt-0.5">{selected.imageWidth}×{selected.imageHeight}px</p>
                  </div>
                )}
                <div>
                  <p className="text-slate-600">Created</p>
                  <p className="text-slate-300 mt-0.5">{formatDate(selected.createdAt)}</p>
                </div>
              </div>

              {selected.errorMessage && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-xs text-red-400">{selected.errorMessage}</p>
                </div>
              )}

              {selected.imageUrl && (
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => downloadImage(selected)} icon={<Download className="w-4 h-4" />} className="flex-1">
                    Download
                  </Button>
                  <Button variant="secondary" onClick={() => copyUrl(selected.imageUrl!)} icon={<Copy className="w-4 h-4" />}>
                    Copy URL
                  </Button>
                  <a href={selected.imageUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" icon={<ExternalLink className="w-4 h-4" />} />
                  </a>
                </div>
              )}

              {selected.enhancedPrompt && (
                <details className="group">
                  <summary className="text-xs text-slate-600 cursor-pointer flex items-center gap-1 hover:text-slate-400">
                    <Sparkles className="w-3 h-3" /> View enhanced prompt
                  </summary>
                  <p className="text-[11px] text-slate-500 font-mono mt-2 leading-relaxed bg-white/[0.02] p-2 rounded border border-white/[0.06]">
                    {selected.enhancedPrompt}
                  </p>
                </details>
              )}
            </div>
          </div>
        </Modal>
      )}
    </AppLayout>
  );
}
