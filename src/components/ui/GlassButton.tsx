"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

export interface GlassButtonProps
  extends Omit<HTMLMotionProps<"button">, "children"> {
  children?: React.ReactNode;
  variant?: "primary" | "glass" | "accent" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

export function GlassButton({
  children,
  variant = "glass",
  size = "md",
  icon,
  isLoading = false,
  className,
  disabled,
  ...props
}: GlassButtonProps) {
  const sizeClasses = {
    sm: "h-8 px-3 text-xs gap-1.5 rounded-xl",
    md: "h-10 px-4 text-sm gap-2 rounded-xl",
    lg: "h-12 px-6 text-base gap-2.5 rounded-2xl",
  };

  const variantClasses = {
    primary:
      "bg-gradient-to-r from-teal-500 via-teal-600 to-cyan-600 text-white font-semibold border border-teal-400/40 shadow-[0_4px_16px_rgba(13,148,136,0.28)] hover:shadow-[0_6px_22px_rgba(13,148,136,0.4)] hover:brightness-105",
    glass:
      "bg-white/85 hover:bg-white text-slate-800 font-medium border border-teal-900/10 hover:border-teal-500/40 shadow-[0_2px_10px_rgba(13,148,136,0.06)] hover:shadow-[0_4px_14px_rgba(13,148,136,0.12)]",
    accent:
      "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 font-semibold border border-emerald-500/30 hover:border-emerald-500/50 shadow-[0_2px_10px_rgba(5,150,105,0.1)]",
    ghost:
      "bg-transparent hover:bg-teal-500/10 text-teal-950 font-medium border border-transparent hover:border-teal-500/20",
    danger:
      "bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium border border-rose-200 shadow-[0_2px_8px_rgba(244,63,94,0.1)]",
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      disabled={disabled || isLoading}
      className={cn(
        "relative inline-flex items-center justify-center backdrop-blur-md transition-all duration-200 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1" />
      ) : (
        icon && <span className="inline-flex shrink-0">{icon}</span>
      )}
      {children}
    </motion.button>
  );
}
