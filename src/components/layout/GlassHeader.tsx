"use client";

import React from "react";
import { Sparkles, Radar, Kanban, UserCheck, Plus, Zap, RefreshCw, HelpCircle, Cloud, Cpu } from "lucide-react";
import { GlassButton } from "@/components/ui/GlassButton";
import { ActiveTab } from "@/types";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";

interface GlassHeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onQuickAdd?: () => void;
  onOpenSync?: () => void;
  onOpenTutorial?: () => void;
}

export function GlassHeader({
  activeTab,
  onTabChange,
  onQuickAdd,
  onOpenSync,
  onOpenTutorial,
}: GlassHeaderProps) {
  const { aiEngineMode, toggleAiEngineMode } = useApp();

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "radar",
      label: "Match Radar",
      icon: <Radar className="w-4 h-4" />,
    },
    {
      id: "pipeline",
      label: "Glass Pipeline",
      icon: <Kanban className="w-4 h-4" />,
    },
    {
      id: "profile",
      label: "CV & Perfil Studio",
      icon: <UserCheck className="w-4 h-4" />,
    },
  ];

  return (
    <header className="sticky top-3 sm:top-5 z-40 w-full max-w-6xl mx-auto px-4 sm:px-6">
      <div className="relative flex items-center justify-between h-16 px-4 sm:px-6 rounded-2xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_10px_32px_0_rgba(13,148,136,0.08)] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-teal-400/30 before:to-transparent before:rounded-t-2xl">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400/25 via-cyan-400/20 to-teal-600/20 border border-teal-500/30 shadow-[0_0_20px_rgba(20,184,166,0.25)]">
            <Sparkles className="w-5 h-5 text-teal-600 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
                GlassMatch
              </span>
              <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-teal-500/15 border border-teal-500/30 text-teal-800">
                AI
              </span>
            </div>
            <span className="text-[11px] text-teal-800/70 font-medium hidden sm:inline">
              Caribbean Sea Glass Edition
            </span>
          </div>
        </div>

        {/* Center Navigation Tabs (iOS Frosted Capsule) */}
        <nav className="flex items-center p-1 rounded-xl bg-slate-100/70 border border-teal-900/5 backdrop-blur-md">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "relative flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer",
                  isActive
                    ? "text-teal-950 bg-white shadow-[0_2px_8px_rgba(13,148,136,0.1)] border border-teal-500/20 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50 border border-transparent"
                )}
              >
                <span className={cn(isActive ? "text-teal-600" : "text-slate-500")}>
                  {tab.icon}
                </span>
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Switch Modo IA + Tutorial + Sincronizar + Nueva Vacante */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Dual Pill Switch (Desktop) */}
          <div className="hidden md:flex items-center p-0.5 rounded-xl bg-slate-100/80 border border-teal-900/10 backdrop-blur-md shadow-2xs mr-1">
            <button
              type="button"
              onClick={() => toggleAiEngineMode("cloud")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer",
                aiEngineMode === "cloud"
                  ? "bg-white text-teal-950 shadow-xs border border-teal-500/25 font-semibold"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/40 border border-transparent"
              )}
              title="Modo IA Nube: Análisis semántico con Gemini 3.8 y respaldo Groq"
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  aiEngineMode === "cloud" ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                )}
              />
              <Cloud className="w-3.5 h-3.5 text-teal-600" />
              <span>IA Nube</span>
            </button>
            <button
              type="button"
              onClick={() => toggleAiEngineMode("offline_deterministic")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer",
                aiEngineMode === "offline_deterministic"
                  ? "bg-white text-teal-950 shadow-xs border border-teal-500/25 font-semibold"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/40 border border-transparent"
              )}
              title="Modo Local: Motor determinista a costo cero (0 Tokens)"
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  aiEngineMode === "offline_deterministic" ? "bg-cyan-500" : "bg-slate-300"
                )}
              />
              <Cpu className="w-3.5 h-3.5 text-cyan-600" />
              <span>Local (0 Tokens)</span>
            </button>
          </div>

          {/* Compact Pill Switch (Mobile) */}
          <button
            type="button"
            onClick={() =>
              toggleAiEngineMode(
                aiEngineMode === "cloud" ? "offline_deterministic" : "cloud"
              )
            }
            className={cn(
              "flex md:hidden items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer mr-0.5",
              aiEngineMode === "cloud"
                ? "bg-emerald-50 text-emerald-800 border-emerald-500/30"
                : "bg-cyan-50 text-cyan-800 border-cyan-500/30"
            )}
            title="Alternar entre IA Nube y Modo Local (0 Tokens)"
          >
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                aiEngineMode === "cloud" ? "bg-emerald-500 animate-pulse" : "bg-cyan-500"
              )}
            />
            <span>{aiEngineMode === "cloud" ? "Nube" : "Local"}</span>
          </button>

          <GlassButton
            variant="glass"
            size="sm"
            icon={<HelpCircle className="w-3.5 h-3.5 text-teal-700" />}
            onClick={onOpenTutorial}
            title="Ver Tutorial y Guía Rápida"
          >
            <span className="hidden sm:inline">Tutorial</span>
          </GlassButton>

          <GlassButton
            variant="glass"
            size="sm"
            icon={<RefreshCw className="w-3.5 h-3.5 text-teal-700" />}
            onClick={onOpenSync}
          >
            <span className="hidden sm:inline">Sincronizar</span>
          </GlassButton>

          <GlassButton
            variant="primary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={onQuickAdd}
          >
            <span className="hidden sm:inline">Nueva Vacante</span>
          </GlassButton>
        </div>
      </div>
    </header>
  );
}
