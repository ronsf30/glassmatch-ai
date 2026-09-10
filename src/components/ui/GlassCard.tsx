"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  glowOnHover?: boolean;
}

export function GlassCard({
  children,
  className,
  hoverable = false,
  glowOnHover = false,
  ...props
}: GlassCardProps) {
  return (
    <motion.div
      whileHover={hoverable ? { y: -1, transition: { duration: 0.15 } } : undefined}
      className={cn(
        "relative rounded-2xl p-5 md:p-6",
        "bg-white border border-slate-200/80",
        "shadow-xs",
        hoverable &&
          "transition-all duration-200 hover:border-teal-500/50 hover:shadow-md cursor-pointer",
        glowOnHover && "hover:border-teal-400",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
