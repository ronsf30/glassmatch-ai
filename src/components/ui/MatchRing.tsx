"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface MatchRingProps {
  score: number; // 0 - 100
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function MatchRing({
  score,
  size = "md",
  showLabel = false,
  className,
}: MatchRingProps) {
  // Determine tier colors & labels
  const isElite = score >= 85;
  const isNotable = score >= 70 && score < 85;

  const colorConfig = isElite
    ? {
        stroke: "#059669",
        textColor: "text-emerald-700",
        glow: "shadow-[0_0_16px_rgba(5,150,105,0.22)]",
        label: "High Affinity",
        bgBadge: "bg-emerald-50 text-emerald-800 border-emerald-300",
      }
    : isNotable
    ? {
        stroke: "#D97706",
        textColor: "text-amber-700",
        glow: "shadow-[0_0_14px_rgba(217,119,6,0.2)]",
        label: "Good Match",
        bgBadge: "bg-amber-50 text-amber-800 border-amber-300",
      }
    : {
        stroke: "#0D9488",
        textColor: "text-teal-700",
        glow: "shadow-[0_0_12px_rgba(13,148,136,0.15)]",
        label: "Exploratory",
        bgBadge: "bg-teal-50 text-teal-800 border-teal-200",
      };

  const dimensions = {
    sm: { diameter: 44, strokeWidth: 3.5, textSize: "text-xs font-bold" },
    md: { diameter: 60, strokeWidth: 4.5, textSize: "text-base font-extrabold" },
    lg: { diameter: 80, strokeWidth: 5.5, textSize: "text-2xl font-black" },
  };

  const { diameter, strokeWidth, textSize } = dimensions[size];
  const padding = 3;
  const radius = (diameter - strokeWidth - padding * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div
      className={cn("inline-flex flex-col items-center gap-1.5", className)}
      title={
        isElite
          ? `Afinidad Alta (${score}%): Compatible sin fricciones ni cláusulas restrictivas.`
          : `Afinidad Parcial (${score}%): Advertencia: Presenta posibles condiciones de ubicación, idioma o requisitos secundarios.`
      }
    >
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full bg-white/95 backdrop-blur-md transition-all duration-300 border border-white",
          colorConfig.glow
        )}
        style={{ width: diameter, height: diameter }}
      >
        <svg
          width={diameter}
          height={diameter}
          viewBox={`0 0 ${diameter} ${diameter}`}
          className="rotate-[-90deg] origin-center overflow-visible"
        >
          {/* Background track */}
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(20, 184, 166, 0.15)"
            strokeWidth={strokeWidth}
          />
          {/* Animated dynamic progress arc */}
          <motion.circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill="transparent"
            stroke={colorConfig.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            strokeLinecap="round"
          />
        </svg>

        {/* Center score percentage */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(textSize, colorConfig.textColor, "tracking-tight")}>
            {score}%
          </span>
        </div>
      </div>

      {showLabel && (
        <span
          className={cn(
            "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border",
            colorConfig.bgBadge
          )}
        >
          {colorConfig.label}
        </span>
      )}
    </div>
  );
}
