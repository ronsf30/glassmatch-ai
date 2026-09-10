"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Building2,
  MapPin,
  ExternalLink,
  ChevronRight,
  BookmarkPlus,
  RefreshCw,
  Dices,
  Ban,
  Globe2,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Sparkles,
  TrendingUp,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";
import { JobOffer, JobLanguageRequirement } from "@/types";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { MatchRing } from "@/components/ui/MatchRing";
import { useApp } from "@/context/AppContext";
import {
  cn,
  getLiveJobUrl,
  getJobFingerprint,
  meetsProgressiveSalaryExpectation,
} from "@/lib/utils";

interface MatchRadarPreviewProps {
  onSelectJob: (job: JobOffer) => void;
  onTrackJob: (jobId: string) => void;
  onOpenSync?: (query?: string) => void;
  onRerollSuccess?: (count: number) => void;
}

interface StatusDiagnosis {
  isElite: boolean;
  badgeLabel: string;
  verdictPrefix: string;
  verdictText: string;
}

function getMatchStatusDiagnosis(job: JobOffer): StatusDiagnosis {
  const score = job.match?.matchScore ?? 0;
  const isElite = score >= 85;

  if (isElite) {
    return {
      isElite: true,
      badgeLabel: "Match Óptimo (Sin Fricciones)",
      verdictPrefix: "Veredicto:",
      verdictText:
        job.match?.executiveSummary ||
        "Afinidad técnica confirmada sin cláusulas restrictivas ni exclusiones.",
    };
  }

  // Not elite (< 85, yellow tier) -> Diagnose the exact friction
  const locLower = (job.location || "").toLowerCase();
  const descLower = (job.description || "").toLowerCase();
  const isLocationFriction =
    locLower.includes("dallas") ||
    locLower.includes("tx") ||
    locLower.includes("austin") ||
    locLower.includes("ny") ||
    locLower.includes("ca") ||
    locLower.includes("united states") ||
    locLower.includes("usa") ||
    descLower.includes("office environment") ||
    descLower.includes("in-office") ||
    descLower.includes("on-site") ||
    descLower.includes("hybrid");

  if (isLocationFriction) {
    return {
      isElite: false,
      badgeLabel: `Alerta: Residencia / Ubicación (${job.location})`,
      verdictPrefix: "Advertencia de Ubicación:",
      verdictText: `Condicionada por requerimiento de presencia u oficina en ${job.location}. Requiere validar cláusula de residencia local.`,
    };
  }

  if (job.match?.languageRequirement === "English C1/C2") {
    return {
      isElite: false,
      badgeLabel: "Alerta: Exige Inglés C1/C2 Avanzado",
      verdictPrefix: "Advertencia de Idioma:",
      verdictText:
        "Requiere fluidez oral en inglés C1/C2 para reuniones ejecutivas en tiempo real.",
    };
  }

  if (job.match?.missingSkills && job.match.missingSkills.length > 0) {
    const missing = job.match.missingSkills[0];
    return {
      isElite: false,
      badgeLabel: "Alerta: Requisitos Secundarios",
      verdictPrefix: "Fricción de Requisitos:",
      verdictText: `Alineado al rol, pero exige requisitos complementarios: ${missing}`,
    };
  }

  return {
    isElite: false,
    badgeLabel: "Afinidad Parcial (Validar Cláusulas)",
    verdictPrefix: "Advertencia:",
    verdictText:
      job.match?.executiveSummary ||
      "Requiere validar condiciones específicas del empleador.",
  };
}

export function MatchRadarPreview({
  onSelectJob,
  onTrackJob,
  onOpenSync,
  onRerollSuccess,
}: MatchRadarPreviewProps) {
  const { jobs, profile, rerollJobs, isRerolling, blacklistCompany, aiEngineMode } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Advanced Filters State (Manual & Customizable)
  const [minScoreThreshold, setMinScoreThreshold] = useState<number>(0);
  const [workModeFilter, setWorkModeFilter] = useState<"all" | "remote" | "hybrid" | "onsite">("all");
  const [languageFilter, setLanguageFilter] = useState<"all" | "b1_b2" | "spanish_only">("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [salaryMode, setSalaryMode] = useState<"progressive_all" | "declared_only">("progressive_all");

  const handleReroll = async () => {
    const count = await rerollJobs();
    onRerollSuccess?.(count);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setMinScoreThreshold(0);
    setWorkModeFilter("all");
    setLanguageFilter("all");
    setSelectedSource("all");
    setSalaryMode("progressive_all");
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (minScoreThreshold > 0) count++;
    if (workModeFilter !== "all") count++;
    if (languageFilter !== "all") count++;
    if (selectedSource !== "all") count++;
    if (salaryMode === "declared_only") count++;
    return count;
  }, [minScoreThreshold, workModeFilter, languageFilter, selectedSource, salaryMode]);

  // Filtered Job List: strictly exclude non-matching or kill switch jobs + default progressive salary + deduplication
  const filteredJobs = useMemo(() => {
    const blacklist = (profile.blacklistCompanies || []).map((b) =>
      b.toLowerCase()
    );

    const termLower = searchTerm.trim().toLowerCase();
    const minExpectedSalary = profile.minSalary ?? 0;

    const candidates = jobs.filter((job) => {
      // Excluir de inmediato vacantes que no hacen match o dispararon un Kill Switch
      if (
        job.match &&
        (job.match.isMatch === false ||
          job.match.matchScore === 0 ||
          Boolean(job.match.killSwitchTriggered))
      ) {
        return false;
      }

      // Blacklist filter
      if (blacklist.includes(job.company.toLowerCase())) {
        return false;
      }

      // Search term: title, company, location, description, or strengths
      if (termLower) {
        const matchesSearch =
          job.title.toLowerCase().includes(termLower) ||
          job.company.toLowerCase().includes(termLower) ||
          job.location.toLowerCase().includes(termLower) ||
          job.description.toLowerCase().includes(termLower) ||
          (job.match?.strengths.some((s) =>
            s.toLowerCase().includes(termLower)
          ) ?? false);

        if (!matchesSearch) return false;
      }

      // Source portal filter
      if (selectedSource !== "all" && job.source !== selectedSource) {
        return false;
      }

      // Score threshold filter
      if (minScoreThreshold > 0 && (job.match?.matchScore ?? 0) < minScoreThreshold) {
        return false;
      }

      // Work mode filter
      if (workModeFilter === "remote" && job.workMode !== "remote") return false;
      if (workModeFilter === "hybrid" && job.workMode !== "hybrid") return false;
      if (workModeFilter === "onsite" && job.workMode !== "onsite") return false;

      // Progressive Salary filter: ACTIVO POR DEFECTO
      // Si salaryMode === "progressive_all": vacantes sin salario declarado pasan, y vacantes con salario deben ser >= minExpectedSalary.
      // Si salaryMode === "declared_only": se descartan vacantes sin salario y las restantes deben ser >= minExpectedSalary.
      const allowUndisclosed = salaryMode === "progressive_all";
      const salaryCheck = meetsProgressiveSalaryExpectation(
        job.salaryText,
        minExpectedSalary,
        allowUndisclosed
      );
      if (!salaryCheck.meets) return false;

      // Language filter
      if (languageFilter === "b1_b2") {
        if (job.match?.languageRequirement === "English C1/C2") return false;
      } else if (languageFilter === "spanish_only") {
        if (job.match?.languageRequirement !== "Spanish") return false;
      }

      return true;
    });

    // Deduplicación canónica en pantalla por huella digital (empresa normalizada + cargo)
    const seenFingerprints = new Set<string>();
    const deduplicated: JobOffer[] = [];
    for (const job of candidates) {
      const fp = getJobFingerprint(job.company, job.title);
      if (!seenFingerprints.has(fp)) {
        seenFingerprints.add(fp);
        deduplicated.push(job);
      }
    }

    return deduplicated;
  }, [
    jobs,
    profile.blacklistCompanies,
    profile.minSalary,
    searchTerm,
    selectedSource,
    minScoreThreshold,
    workModeFilter,
    languageFilter,
    salaryMode,
  ]);

  // Language badge renderer (minimalist)
  const renderLanguageBadge = (req?: JobLanguageRequirement) => {
    if (req === "Spanish") {
      return (
        <GlassBadge variant="sky" size="sm" icon={<Globe2 className="w-3 h-3" />}>
          Español Nativo
        </GlassBadge>
      );
    }
    if (req === "English C1/C2") {
      return (
        <GlassBadge variant="amber" size="sm" icon={<Globe2 className="w-3 h-3" />}>
          Inglés C1/C2
        </GlassBadge>
      );
    }
    return null;
  };

  return (
    <div className="space-y-5">
      {/* Central Command Station: Unified Search & Live Extraction */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col gap-3">
        <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center">
          {/* Unified Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar en vacantes o ingresar cargo para extraer en vivo (ej. UI UX, Frontend, React)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onOpenSync?.(searchTerm.trim());
                }
              }}
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
            />
          </div>

          {/* Action Buttons: Buscar en Vivo + Filtros Avanzados + Reroll */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Primary Action: Buscar en Vivo */}
            <GlassButton
              variant="primary"
              size="md"
              icon={<Globe2 className="w-4 h-4" />}
              onClick={() => onOpenSync?.(searchTerm.trim())}
              title="Buscar y extraer nuevas vacantes de portales externos (LinkedIn, Remotive, Jobicy, Arbeitnow)"
              className="h-11 shadow-sm"
            >
              Buscar en Vivo
            </GlassButton>

            {/* Toggle Advanced Filters */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={cn(
                "h-11 px-3.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-2 shrink-0",
                showAdvancedFilters || activeFiltersCount > 0
                  ? "bg-teal-50 text-teal-950 border-teal-500/40 shadow-xs font-bold"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
              )}
              title="Ajustar filtros avanzados"
            >
              <SlidersHorizontal className="w-4 h-4 text-teal-700" />
              <span className="hidden sm:inline">Filtros Avanzados</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Reroll Button (Compact) */}
            <button
              type="button"
              onClick={handleReroll}
              disabled={isRerolling}
              title="Rebarajar 10 ofertas del pool disponible"
              className={cn(
                "h-11 w-11 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer shrink-0",
                isRerolling && "opacity-50 cursor-not-allowed"
              )}
            >
              {isRerolling ? (
                <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
              ) : (
                <Dices className="w-4 h-4 text-slate-600" />
              )}
            </button>
          </div>
        </div>

        {/* Expandable Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 text-xs">
              {/* 1. Score Mínimo ATS */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Umbral Score ATS</span>
                  <span className="font-bold text-teal-800">
                    {minScoreThreshold === 0 ? "Sin mínimo" : `≥ ${minScoreThreshold}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="95"
                  step="5"
                  value={minScoreThreshold}
                  onChange={(e) => setMinScoreThreshold(Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0% (Todos)</span>
                  <span>70%</span>
                  <span>95% (Elite)</span>
                </div>
              </div>

              {/* 2. Modalidad */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-700 block">Modalidad</span>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { id: "all", label: "Todas" },
                    { id: "remote", label: "Solo Remoto" },
                    { id: "hybrid", label: "Híbrido" },
                    { id: "onsite", label: "Presencial" },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setWorkModeFilter(mode.id as any)}
                      className={cn(
                        "py-1.5 px-2 rounded-lg font-medium text-[11px] border transition-all text-center cursor-pointer",
                        workModeFilter === mode.id
                          ? "bg-teal-600 text-white border-teal-600 font-bold shadow-2xs"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Requisito de Idioma */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-700 block">Filtro de Idioma</span>
                <div className="flex flex-col gap-1">
                  {[
                    { id: "all", label: "Todos los idiomas" },
                    { id: "b1_b2", label: "Compatible B1/B2 (Sin C1/C2 oral)" },
                    { id: "spanish_only", label: "Solo Español nativo" },
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => setLanguageFilter(lang.id as any)}
                      className={cn(
                        "py-1 px-2 rounded-lg font-medium text-[11px] border transition-all text-left cursor-pointer",
                        languageFilter === lang.id
                          ? "bg-teal-600 text-white border-teal-600 font-bold shadow-2xs"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Criterio Salarial */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-700 block">Criterio Salarial</span>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => setSalaryMode("progressive_all")}
                    className={cn(
                      "py-1 px-2 rounded-lg font-medium text-[11px] border transition-all text-left cursor-pointer",
                      salaryMode === "progressive_all"
                        ? "bg-teal-600 text-white border-teal-600 font-bold shadow-2xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    Progresivo (≥ piso o a convenir)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSalaryMode("declared_only")}
                    className={cn(
                      "py-1 px-2 rounded-lg font-medium text-[11px] border transition-all text-left cursor-pointer",
                      salaryMode === "declared_only"
                        ? "bg-teal-600 text-white border-teal-600 font-bold shadow-2xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    Solo Salario Público Declarado
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 pt-0.5 leading-tight">
                  Piso en CV Studio: <strong className="text-slate-700">${(profile.minSalary ?? 0).toLocaleString()} USD</strong>
                  {(profile.minSalary ?? 0) === 0 ? " (Todo monto califica)" : ""}
                </p>
              </div>
            </div>

            {/* Portals and Reset Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500">Portal:</span>
                {["all", "LinkedIn", "Remotive", "Jobicy", "Arbeitnow"].map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setSelectedSource(src)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                      selectedSource === src
                        ? "bg-teal-600 text-white font-semibold shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                    )}
                  >
                    {src === "all" ? "Todos" : src}
                  </button>
                ))}
              </div>

              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restablecer Filtros</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Feed Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span>
            Mostrando <strong className="text-slate-900 font-bold">{filteredJobs.length}</strong> ofertas únicas (Deduplicadas) de{" "}
            <strong className="text-slate-900 font-bold">{jobs.length}</strong> en radar
          </span>
          {profile.minSalary !== undefined && profile.minSalary > 0 && (
            <span className="hidden md:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300">
              Piso salarial: ≥ ${profile.minSalary.toLocaleString()} USD
            </span>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-teal-700 hover:text-teal-900 underline font-semibold text-xs cursor-pointer"
          >
            Restablecer {activeFiltersCount} filtro{activeFiltersCount > 1 ? "s" : ""}
          </button>
        )}
      </div>

      {/* Lista de Vacantes: Escaneo en 3 Segundos */}
      <div className="space-y-3.5">
        {filteredJobs.length === 0 ? (
          <GlassCard className="p-10 text-center text-slate-500">
            <p className="text-sm font-medium">
              {jobs.length === 0
                ? "No hay vacantes en el radar. Inicia una búsqueda en vivo para consultar ofertas remotas activas."
                : "No se encontraron vacantes con los filtros seleccionados."}
            </p>
            <div className="flex justify-center gap-3 mt-4">
              <GlassButton
                variant="primary"
                size="sm"
                icon={<Globe2 className="w-4 h-4" />}
                onClick={() => onOpenSync?.(searchTerm.trim())}
              >
                Buscar Ofertas en Vivo
              </GlassButton>
              {jobs.length > 0 && (
                <GlassButton
                  variant="glass"
                  size="sm"
                  onClick={handleResetFilters}
                >
                  Restablecer Filtros
                </GlassButton>
              )}
            </div>
          </GlassCard>
        ) : (
          filteredJobs.map((job) => {
            const diagnosis = getMatchStatusDiagnosis(job);

            return (
              <GlassCard
                key={job.id}
                hoverable
                onClick={() => onSelectJob(job)}
                className="group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left Column: Jerarquía con Feedback Visual Inmediato */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* 1. Score Visual (MatchRing) */}
                    {job.match && (
                      <div className="shrink-0 pt-1 self-start">
                        <MatchRing score={job.match.matchScore} size="md" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      {/* Meta Row: Indicador Semántico Explícito Verde vs Amarillo + Motor + Sueldo */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-1.5 text-[11px]">
                        {/* Indicador Explícito de Estado de Compatibilidad */}
                        {diagnosis.isElite ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {diagnosis.badgeLabel}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold bg-amber-50 text-amber-900 border border-amber-300">
                            <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                            {diagnosis.badgeLabel}
                          </span>
                        )}

                        {/* Insignia de Trazabilidad del Motor Evaluador */}
                        {job.match?.aiProvider === "offline_deterministic" || !job.match?.isLiveAi ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold bg-cyan-50 text-cyan-900 border border-cyan-200">
                            <Cpu className="w-3 h-3 text-cyan-700" />
                            Local (0 Tokens)
                          </span>
                        ) : job.match?.aiProvider === "groq" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold bg-cyan-50 text-cyan-950 border border-cyan-300">
                            <Cpu className="w-3 h-3 text-cyan-600" />
                            Groq Cloud (70B)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold bg-teal-50 text-teal-900 border border-teal-300">
                            <Sparkles className="w-3 h-3 text-teal-600" />
                            Gemini 3.8
                          </span>
                        )}

                        {/* Modalidad */}
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {job.workMode === "remote" ? "Remoto Global" : job.workMode.toUpperCase()}
                        </span>

                        {/* Sueldo Progresivo con Comparación de Piso */}
                        {job.salaryText && (() => {
                          const check = meetsProgressiveSalaryExpectation(
                            job.salaryText,
                            profile.minSalary || 35000,
                            true
                          );
                          return (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold border",
                                check.parsed && check.diff > 0
                                  ? "bg-emerald-50 text-emerald-900 border-emerald-300 font-bold"
                                  : check.parsed && check.diff < 0
                                  ? "bg-rose-50 text-rose-900 border-rose-200"
                                  : "bg-slate-100 text-slate-800 border-slate-200"
                              )}
                            >
                              <span>{job.salaryText}</span>
                              {check.parsed && check.diff > 0 && (
                                <span className="text-[10px] text-emerald-700 font-bold">
                                  (+${Math.round(check.diff / 1000)}k/año)
                                </span>
                              )}
                            </span>
                          );
                        })()}

                        {renderLanguageBadge(job.match?.languageRequirement)}

                        <span className="text-slate-400 ml-auto sm:ml-0">
                          {job.source}
                        </span>
                      </div>

                      {/* 3. Título y Empresa con Fuerte Contraste */}
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors tracking-tight truncate">
                        {job.title}
                      </h3>

                      <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-600">
                        <span className="flex items-center gap-1 font-semibold text-slate-800">
                          <Building2 className="w-3.5 h-3.5 text-teal-600" />
                          {job.company}
                        </span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {job.location}
                        </span>
                      </div>

                      {/* 4. Veredicto con Diagnóstico Visual de Causa */}
                      {job.match && (
                        <div className="mt-2">
                          {diagnosis.isElite ? (
                            <p className="text-xs text-slate-600 line-clamp-1 leading-normal">
                              <span className="font-semibold text-emerald-800">{diagnosis.verdictPrefix} </span>
                              {diagnosis.verdictText}
                            </p>
                          ) : (
                            <p className="text-xs text-amber-900 line-clamp-1 leading-normal bg-amber-50/90 px-2 py-1 rounded-lg border border-amber-200/90 font-medium">
                              <span className="font-bold text-amber-800">{diagnosis.verdictPrefix} </span>
                              {diagnosis.verdictText}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Acciones Directas */}
                  <div
                    className="flex items-center justify-between md:justify-end gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Blacklist / Discard Button */}
                    <button
                      onClick={() => blacklistCompany(job.company)}
                      title={`Bloquear ofertas de ${job.company}`}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Ban className="w-4 h-4" />
                    </button>

                    <GlassButton
                      variant="ghost"
                      size="sm"
                      icon={<BookmarkPlus className="w-4 h-4 text-teal-700" />}
                      onClick={() => onTrackJob(job.id)}
                    >
                      Guardar
                    </GlassButton>

                    <GlassButton
                      variant="glass"
                      size="sm"
                      icon={<ChevronRight className="w-4 h-4 text-teal-700" />}
                      onClick={() => onSelectJob(job)}
                    >
                      Análisis
                    </GlassButton>

                    <a
                      href={getLiveJobUrl(job)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex"
                    >
                      <GlassButton
                        variant="primary"
                        size="sm"
                        icon={<ExternalLink className="w-3.5 h-3.5" />}
                      >
                        Postular ↗
                      </GlassButton>
                    </a>
                  </div>
                </div>
              </GlassCard>
            );
          })
        )}
      </div>
    </div>
  );
}
