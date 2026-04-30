"use client";
// src/app/page.tsx
import { AppLayout } from "@/components/AppLayout";
import { Card, Badge, Button, Skeleton } from "@/components/ui";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Wand2,
  Building2,
  ImageIcon,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { formatRelativeTime, truncate } from "@/lib/utils";

interface Stats {
  totalBrands: number;
  totalGenerations: number;
  successfulGenerations: number;
  failedGenerations: number;
}

interface RecentJob {
  id: string;
  brandId: string | null;
  campaignType: string | null;
  userPrompt: string;
  status: string;
  thumbnailUrl: string | null;
  imageUrl: string | null;
  createdAt: string;
  brand?: { name: string } | null;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [brandsRes, historyRes] = await Promise.all([
          fetch("/api/brands"),
          fetch("/api/history?limit=6"),
        ]);
        const brandsData = await brandsRes.json();
        const historyData = await historyRes.json();

        const jobs: RecentJob[] = historyData.jobs || [];
        setStats({
          totalBrands: brandsData.brands?.length || 0,
          totalGenerations: historyData.pagination?.total || 0,
          successfulGenerations: jobs.filter((j) => j.status === "done").length,
          failedGenerations: jobs.filter((j) => j.status === "failed").length,
        });
        setRecent(jobs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <AppLayout>
      <div className="p-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold text-white">
              Studio Dashboard
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Your AI-powered real estate poster generation hub
            </p>
          </div>
          <Link href="/studio">
            <Button icon={<Wand2 className="w-4 h-4" />} size="md">
              New Poster
            </Button>
          </Link>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Brand Profiles",
              value: stats?.totalBrands,
              icon: Building2,
              color: "text-blue-400",
              bg: "bg-blue-500/10",
              border: "border-blue-500/20",
            },
            {
              label: "Total Posters",
              value: stats?.totalGenerations,
              icon: ImageIcon,
              color: "text-purple-400",
              bg: "bg-purple-500/10",
              border: "border-purple-500/20",
            },
            {
              label: "Successful",
              value: stats?.successfulGenerations,
              icon: CheckCircle,
              color: "text-emerald-400",
              bg: "bg-emerald-500/10",
              border: "border-emerald-500/20",
            },
            {
              label: "AI Generations",
              value: stats?.totalGenerations,
              icon: Zap,
              color: "text-brand-400",
              bg: "bg-brand-500/10",
              border: "border-brand-500/20",
            },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                    {loading ? (
                      <Skeleton className="w-12 h-7 mt-2" />
                    ) : (
                      <p className="text-2xl font-semibold text-white mt-1">
                        {stat.value ?? 0}
                      </p>
                    )}
                  </div>
                  <div className={`w-9 h-9 rounded-lg ${stat.bg} border ${stat.border} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                href: "/studio",
                icon: Wand2,
                title: "Generate Poster",
                desc: "Create a new AI poster with your brand",
                accent: "from-brand-500/20 to-transparent",
              },
              {
                href: "/brands",
                icon: Building2,
                title: "Manage Brands",
                desc: "Set up or edit your brand profiles",
                accent: "from-blue-500/20 to-transparent",
              },
              {
                href: "/history",
                icon: TrendingUp,
                title: "View History",
                desc: "Browse past generations and re-use",
                accent: "from-purple-500/20 to-transparent",
              },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href}>
                  <Card
                    hover
                    className={`p-5 bg-gradient-to-br ${action.accent} group`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="w-5 h-5 text-slate-400 group-hover:text-white mt-0.5 transition-colors flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-200 text-sm group-hover:text-white transition-colors">
                          {action.title}
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5">{action.desc}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-slate-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent generations */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide">
              Recent Generations
            </h2>
            <Link href="/history" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <Card className="p-12 text-center">
              <ImageIcon className="w-8 h-8 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No posters generated yet</p>
              <Link href="/studio" className="mt-3 inline-block">
                <Button size="sm" variant="secondary">
                  Generate your first poster
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {recent.map((job) => (
                <div key={job.id} className="group relative">
                  <div className="aspect-square rounded-lg overflow-hidden bg-slate-800 border border-white/[0.06]">
                    {job.thumbnailUrl || job.imageUrl ? (
                      <img
                        src={job.thumbnailUrl || job.imageUrl || ""}
                        alt={job.userPrompt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {job.status === "failed" ? (
                          <XCircle className="w-6 h-6 text-red-500/40" />
                        ) : (
                          <Clock className="w-6 h-6 text-slate-700 animate-pulse" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="mt-1.5">
                    <p className="text-xs text-slate-400 leading-tight">
                      {truncate(job.userPrompt, 40)}
                    </p>
                    <p className="text-[10px] text-slate-700 mt-0.5">
                      {formatRelativeTime(job.createdAt)}
                    </p>
                  </div>
                  {job.status !== "done" && (
                    <div className="absolute top-1.5 right-1.5">
                      <Badge
                        variant={
                          job.status === "failed"
                            ? "error"
                            : job.status === "processing"
                            ? "warning"
                            : "default"
                        }
                      >
                        {job.status}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
