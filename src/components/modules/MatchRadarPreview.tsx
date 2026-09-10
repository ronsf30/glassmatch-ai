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
} from "lucide-react";
import { JobOffer, JobLanguageRequirement } from "@/types";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { MatchRing } from "@/components/ui/MatchRing";
import { useApp } from "@/context/AppContext";
import { cn, getLiveJobUrl } from "@/lib/utils";

interface MatchRadarPreviewProps {
  onSelectJob: (job: JobOffer) => void;
  onTrackJob: (jobId: string) => void;
  onOpenSync?: () => void;
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
  const { jobs, profile, rerollJobs, isRerolling, blacklistCompany } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterScore85, setFilterScore85] = useState(false);
  const [filterRemoteOnly, setFilterRemoteOnly] = useState(false);
  const [filterSalary, setFilterSalary] = useState(false);
  const [filterLanguageB1B2, setFilterLanguageB1B2] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string>("all");

  const handleReroll = async () => {
    const count = await rerollJobs();
    onRerollSuccess?.(count);
  };

  // Filtered Job List: strictly exclude non-matching or kill switch jobs
  const filteredJobs = useMemo(() => {
    const blacklist = (profile.blacklistCompanies || []).map((b) =>
      b.toLowerCase()
    );

    const termLower = searchTerm.trim().toLowerCase();

    return jobs.filter((job) => {
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

      // Source filter
      if (selectedSource !== "all" && job.source !== selectedSource) {
        return false;
      }

      // Score filter: Elite >=85
      if (filterScore85 && (job.match?.matchScore ?? 0) < 85) return false;

      // Remote filter
      if (filterRemoteOnly && job.workMode !== "remote") return false;

      // Salary filter
      if (filterSalary && !job.salaryText) return false;

      // Language filter: exclude C1/C2 if user wants B1/B2 compatible
      if (filterLanguageB1B2) {
        const req = job.match?.languageRequirement;
        if (req === "English C1/C2") return false;
      }

      return true;
    });
  }, [
    jobs,
    profile.blacklistCompanies,
    searchTerm,
    selectedSource,
    filterScore85,
    filterRemoteOnly,
    filterSalary,
    filterLanguageB1B2,
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
      {/* Barra Superior de Filtros y Búsqueda */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por cargo, tecnología (React, Tailwind, Next), empresa o ubicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
            />
          </div>

          {/* Reroll Button */}
          <GlassButton
            variant="primary"
            size="md"
            icon={
              isRerolling ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Dices className="w-4 h-4 text-white" />
              )
            }
            isLoading={isRerolling}
            onClick={handleReroll}
            className="shrink-0"
          >
            {isRerolling ? "Actualizando..." : "Actualizar 10 Ofertas"}
          </GlassButton>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterLanguageB1B2(!filterLanguageB1B2)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5",
                filterLanguageB1B2
                  ? "bg-teal-50 text-teal-900 border-teal-500 font-bold"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              <Globe2 className="w-3.5 h-3.5 text-teal-600" />
              <span>Compatible con mi Inglés</span>
            </button>

            <button
              onClick={() => setFilterScore85(!filterScore85)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer",
                filterScore85
                  ? "bg-emerald-50 text-emerald-900 border-emerald-500 font-bold"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              Afinidad Alta (&gt; 85%)
            </button>

            <button
              onClick={() => setFilterRemoteOnly(!filterRemoteOnly)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer",
                filterRemoteOnly
                  ? "bg-teal-50 text-teal-900 border-teal-500 font-bold"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              Solo Remoto
            </button>

            <button
              onClick={() => setFilterSalary(!filterSalary)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer",
                filterSalary
                  ? "bg-amber-50 text-amber-900 border-amber-500 font-bold"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              Con Salario
            </button>
          </div>

          {/* Portals filter */}
          <div className="flex items-center gap-1 text-xs text-slate-600">
            {["all", "LinkedIn", "Remotive", "Jobicy", "Arbeitnow"].map((src) => (
              <button
                key={src}
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
        </div>
      </div>

      {/* Feed Counter & Sync Trigger */}
      <div className="flex items-center justify-between px-2 text-xs text-slate-600">
        <span>
          Mostrando <strong className="text-slate-900 font-bold">{filteredJobs.length}</strong> de{" "}
          <strong className="text-slate-900 font-bold">{jobs.length}</strong> oportunidades
        </span>
        <button
          onClick={onOpenSync}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold border border-teal-200 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
          <span>Sincronizar Ofertas en Vivo</span>
        </button>
      </div>

      {/* Lista de Vacantes: Escaneo en 3 Segundos */}
      <div className="space-y-3.5">
        {filteredJobs.length === 0 ? (
          <GlassCard className="p-10 text-center text-slate-500">
            <p className="text-sm font-medium">
              {jobs.length === 0
                ? "No hay vacantes en el radar. Inicia una sincronización en vivo para consultar ofertas remotas activas."
                : "No se encontraron vacantes con los filtros seleccionados."}
            </p>
            <div className="flex justify-center gap-3 mt-4">
              <GlassButton
                variant="primary"
                size="sm"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={onOpenSync}
              >
                Buscar Ofertas en Vivo
              </GlassButton>
              {jobs.length > 0 && (
                <GlassButton
                  variant="glass"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterScore85(false);
                    setFilterRemoteOnly(false);
                    setFilterSalary(false);
                    setFilterLanguageB1B2(false);
                    setSelectedSource("all");
                  }}
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
                      {/* Meta Row: Indicador Semántico Explícito Verde vs Amarillo */}
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

                        {/* Modalidad */}
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {job.workMode === "remote" ? "Remoto Global" : job.workMode.toUpperCase()}
                        </span>

                        {job.salaryText && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                            {job.salaryText}
                          </span>
                        )}

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
