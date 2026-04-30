"use client";
// src/components/Sidebar.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Upload,
  Wand2,
  History,
  Webhook,
  Zap,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/brands", label: "Brand Settings", icon: Building2 },
  { href: "/assets", label: "Asset Library", icon: Upload },
  { href: "/studio", label: "Prompt Studio", icon: Wand2 },
  { href: "/history", label: "History", icon: History },
  { href: "/webhook-settings", label: "Webhook", icon: Webhook },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] flex flex-col bg-slate-900/80 backdrop-blur-xl border-r border-white/[0.06] z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg gradient-gold flex items-center justify-center shadow-lg shadow-brand-500/30 group-hover:shadow-brand-500/50 transition-shadow">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-none">BrandPoster</p>
            <p className="text-[10px] text-slate-500 mt-0.5 font-mono">AI Studio</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || 
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group",
                isActive
                  ? "bg-brand-500/15 text-brand-300 border border-brand-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 flex-shrink-0 transition-colors",
                  isActive ? "text-brand-400" : "text-slate-500 group-hover:text-slate-300"
                )}
                strokeWidth={isActive ? 2 : 1.75}
              />
              <span className="font-medium">{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/[0.06]">
        <p className="text-[10px] text-slate-600 font-mono">v1.0.0</p>
        <p className="text-[10px] text-slate-600 mt-0.5">Real Estate Poster AI</p>
      </div>
    </aside>
  );
}
