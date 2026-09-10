"use client";

import React from "react";

export function AmbientGlow() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 select-none">
      {/* Luminous Caribbean Lagoon Base */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#ECFEFF] via-[#F0FDFA] to-[#F8FAFC]" />

      {/* Subtle Caribbean Water Mesh Gradients */}
      {/* Orb 1: Vibrant Caribbean Turquoise - Top Center */}
      <div
        className="ambient-orb-1 absolute -top-32 left-1/2 -translate-x-1/2 w-[750px] h-[550px] rounded-full blur-[140px] opacity-45"
        style={{
          background:
            "radial-gradient(circle, rgba(20, 184, 166, 0.5) 0%, rgba(13, 148, 136, 0.25) 50%, transparent 80%)",
        }}
      />

      {/* Orb 2: Crystal Lagoon Cyan - Left Mid */}
      <div
        className="ambient-orb-2 absolute top-[25%] -left-40 w-[650px] h-[650px] rounded-full blur-[160px] opacity-40"
        style={{
          background:
            "radial-gradient(circle, rgba(6, 182, 212, 0.45) 0%, rgba(56, 189, 248, 0.2) 60%, transparent 80%)",
        }}
      />

      {/* Orb 3: Seafoam & Emerald Mist - Bottom Right */}
      <div
        className="ambient-orb-3 absolute -bottom-32 -right-32 w-[700px] h-[700px] rounded-full blur-[170px] opacity-35"
        style={{
          background:
            "radial-gradient(circle, rgba(52, 211, 153, 0.4) 0%, rgba(20, 184, 166, 0.2) 60%, transparent 80%)",
        }}
      />

      {/* Orb 4: Soft Azure Blue - Bottom Left */}
      <div
        className="ambient-orb-1 absolute bottom-[10%] left-[15%] w-[500px] h-[500px] rounded-full blur-[150px] opacity-25"
        style={{
          background:
            "radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(6, 182, 212, 0.15) 60%, transparent 80%)",
        }}
      />

      {/* Subtle fine water caustics / optical crystal pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-multiply"
        style={{
          backgroundImage:
            "radial-gradient(rgba(13, 148, 136, 0.8) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />
    </div>
  );
}
