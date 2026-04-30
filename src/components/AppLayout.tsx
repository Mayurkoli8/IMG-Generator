"use client";
// src/components/AppLayout.tsx
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function AppLayout({ children, className }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-slate-950 bg-grid">
      <Sidebar />
      <main className={cn("flex-1 ml-[220px] min-h-screen", className)}>
        {children}
      </main>
    </div>
  );
}
