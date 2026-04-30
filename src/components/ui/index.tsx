"use client";
// src/components/ui/index.tsx
// Minimal, polished UI component library

import { cn } from "@/lib/utils";
import { Loader2, X } from "lucide-react";
import React from "react";

// ─── BUTTON ──────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 cursor-pointer select-none shine",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        {
          "gradient-gold text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:brightness-110 active:scale-[0.98]":
            variant === "primary",
          "bg-white/[0.06] text-slate-300 border border-white/10 hover:bg-white/[0.1] hover:text-white active:scale-[0.98]":
            variant === "secondary",
          "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]":
            variant === "ghost",
          "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 active:scale-[0.98]":
            variant === "danger",
          "border border-brand-500/40 text-brand-300 hover:bg-brand-500/10 active:scale-[0.98]":
            variant === "outline",
        },
        {
          "px-3 py-1.5 text-xs": size === "sm",
          "px-4 py-2 text-sm": size === "md",
          "px-6 py-3 text-base": size === "lg",
        },
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        icon && <span className="flex-shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
}

// ─── INPUT ───────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
}

export function Input({ label, error, hint, leftIcon, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            {leftIcon}
          </span>
        )}
        <input
          className={cn(
            "w-full bg-white/[0.04] border border-white/10 rounded-lg text-sm text-slate-200",
            "placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500/50 focus:border-brand-500/40",
            "transition-colors",
            leftIcon ? "pl-10 pr-3 py-2.5" : "px-3 py-2.5",
            error && "border-red-500/50 focus:ring-red-500/30",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-600">{hint}</p>}
    </div>
  );
}

// ─── TEXTAREA ────────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, className, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          "w-full bg-white/[0.04] border border-white/10 rounded-lg text-sm text-slate-200",
          "placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500/50 focus:border-brand-500/40",
          "transition-colors resize-none px-3 py-2.5",
          error && "border-red-500/50",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-600">{hint}</p>}
    </div>
  );
}

// ─── SELECT ──────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({ label, error, hint, options, placeholder, className, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
          {label}
        </label>
      )}
      <select
        className={cn(
          "w-full bg-slate-900 border border-white/10 rounded-lg text-sm text-slate-200",
          "focus:outline-none focus:ring-1 focus:ring-brand-500/50 focus:border-brand-500/40",
          "transition-colors px-3 py-2.5 cursor-pointer",
          error && "border-red-500/50",
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-slate-900">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-600">{hint}</p>}
    </div>
  );
}

// ─── CARD ────────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-slate-900/60 border border-white/[0.06] rounded-xl",
        hover && "hover:border-white/[0.12] hover:bg-slate-900/80 transition-all duration-200 cursor-pointer",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── BADGE ───────────────────────────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "gold";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        {
          "bg-slate-800 text-slate-400": variant === "default",
          "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20": variant === "success",
          "bg-amber-500/10 text-amber-400 border border-amber-500/20": variant === "warning",
          "bg-red-500/10 text-red-400 border border-red-500/20": variant === "error",
          "bg-brand-500/10 text-brand-300 border border-brand-500/20": variant === "gold",
        },
        className
      )}
    >
      {children}
    </span>
  );
}

// ─── MODAL ───────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ open, onClose, title, children, maxWidth = "max-w-lg" }: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={cn(
          "bg-slate-900 border border-white/10 rounded-2xl w-full shadow-2xl animate-slide-up",
          maxWidth
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <h2 className="font-semibold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── SKELETON ────────────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4 text-slate-500">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-medium text-slate-300 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-600 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── COLOR PICKER SWATCH ──────────────────────────────────────────────────────
interface ColorInputProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
}

export function ColorInput({ label, value, onChange }: ColorInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg border border-white/20 cursor-pointer flex-shrink-0"
          style={{ backgroundColor: value }}
        />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-8 bg-transparent cursor-pointer rounded"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 bg-white/[0.04] border border-white/10 rounded px-2 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:ring-1 focus:ring-brand-500/50"
        />
      </div>
    </div>
  );
}
