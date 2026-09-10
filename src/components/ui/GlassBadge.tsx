"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface GlassBadgeProps {
  children: React.ReactNode;
  variant?: "neutral" | "emerald" | "amber" | "indigo" | "sky" | "rose";
  size?: "sm" | "md";
  className?: string;
  icon?: React.ReactNode;
}

export function GlassBadge({
  children,
  variant = "neutral",
  size = "sm",
  className,
  icon,
}: GlassBadgeProps) {
  const variantStyles = {
    neutral:
      "bg-white/80 text-slate-700 border-slate-200/80 hover:bg-white shadow-[0_1px_4px_rgba(0,0,0,0.03)]",
    emerald:
      "bg-emerald-50/90 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100/90 shadow-[0_1px_4px_rgba(5,150,105,0.06)]",
    amber:
      "bg-amber-50/90 text-amber-800 border-amber-200/80 hover:bg-amber-100/90 shadow-[0_1px_4px_rgba(217,119,6,0.06)]",
    indigo:
      "bg-teal-50/90 text-teal-900 border-teal-200/80 hover:bg-teal-100/90 shadow-[0_1px_4px_rgba(13,148,136,0.06)]",
    sky:
      "bg-cyan-50/90 text-cyan-900 border-cyan-200/80 hover:bg-cyan-100/90 shadow-[0_1px_4px_rgba(6,182,212,0.06)]",
    rose:
      "bg-rose-50/90 text-rose-800 border-rose-200/80 hover:bg-rose-100/90 shadow-[0_1px_4px_rgba(225,29,72,0.06)]",
  };

  const sizeStyles = {
    sm: "text-[11px] px-2.5 py-0.5 rounded-full font-medium gap-1",
    md: "text-xs px-3 py-1 rounded-full font-medium gap-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center backdrop-blur-md border transition-colors select-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
