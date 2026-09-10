"use client";

import React, { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { MatchRing } from "@/components/ui/MatchRing";
import { JobNotesModal } from "@/components/modules/JobNotesModal";
import {
  Calendar,
  Building2,
  MapPin,
  FileEdit,
  Sparkles,
  CheckCircle2,
  Clock,
  Briefcase,
  Archive,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Send,
  TrendingUp,
  RotateCcw,
  DollarSign,
  Plus,
} from "lucide-react";
import { JobOffer, ApplicationStatus } from "@/types";
import { useApp } from "@/context/AppContext";

interface GlassPipelinePreviewProps {
  onSelectJob: (job: JobOffer) => void;
}

interface ColumnDef {
  id: ApplicationStatus;
  title: string;
  badgeVariant: "neutral" | "sky" | "amber" | "emerald" | "rose";
  accentBorder: string;
  badgeColor: string;
}

const ALL_COLUMNS: ColumnDef[] = [
  {
    id: "saved",
    title: "Radar / Guardadas",
    badgeVariant: "neutral",
    accentBorder: "border-slate-300/70",
    badgeColor: "bg-slate-100 text-slate-800 border-slate-300",
  },
  {
    id: "applied",
    title: "Postuladas",
    badgeVariant: "sky",
    accentBorder: "border-cyan-400/50",
    badgeColor: "bg-cyan-50 text-cyan-900 border-cyan-300",
  },
  {
    id: "interviewing",
    title: "En Entrevistas",
    badgeVariant: "amber",
    accentBorder: "border-amber-400/50",
    badgeColor: "bg-amber-50 text-amber-900 border-amber-300",
  },
  {
    id: "offered",
    title: "Ofertas Recibidas",
    badgeVariant: "emerald",
    accentBorder: "border-emerald-400/50",
    badgeColor: "bg-emerald-50 text-emerald-900 border-emerald-300",
  },
  {
    id: "rejected",
    title: "Archivadas / Rechazadas",
    badgeVariant: "rose",
    accentBorder: "border-rose-400/50",
    badgeColor: "bg-rose-50 text-rose-900 border-rose-300",
  },
];

export function GlassPipelinePreview({ onSelectJob }: GlassPipelinePreviewProps) {
  const { jobs, jobTracker, updateJobStatus, updateJobNotes } = useApp();
  const [selectedJobForNotes, setSelectedJobForNotes] = useState<JobOffer | null>(null);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const handleOpenNotes = (job: JobOffer, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedJobForNotes(job);
    setIsNotesOpen(true);
  };

  // Pipeline metrics
  const totalTracked = Object.keys(jobTracker).length;
  const savedCount = Object.values(jobTracker).filter((t) => t.status === "saved").length;
  const appliedCount = Object.values(jobTracker).filter((t) => t.status === "applied").length;
  const interviewCount = Object.values(jobTracker).filter((t) => t.status === "interviewing").length;
  const offeredCount = Object.values(jobTracker).filter((t) => t.status === "offered").length;
  const rejectedCount = Object.values(jobTracker).filter((t) => t.status === "rejected").length;

  // Conversion rates calculation
  const totalInProcess = appliedCount + interviewCount + offeredCount;
  const responseRate = totalInProcess > 0 ? Math.round(((interviewCount + offeredCount) / totalInProcess) * 100) : 0;
  const totalInterviewsPlusOffers = interviewCount + offeredCount;
  const offerRate = totalInterviewsPlusOffers > 0 ? Math.round((offeredCount / totalInterviewsPlusOffers) * 100) : 0;

  // Untracked radar jobs available for quick import
  const untrackedJobs = jobs.filter((job) => !jobTracker[job.id]);

  // Determine active columns to display
  const activeColumns = showArchived ? ALL_COLUMNS : ALL_COLUMNS.filter((col) => col.id !== "rejected");

  // Helper functions for bidirectional stage movement
  const getPreviousStatus = (status: ApplicationStatus): ApplicationStatus | null => {
    switch (status) {
      case "applied":
        return "saved";
      case "interviewing":
        return "applied";
      case "offered":
        return "interviewing";
      case "rejected":
        return "applied";
      default:
        return null;
    }
  };

  const getNextStatus = (status: ApplicationStatus): ApplicationStatus | null => {
    switch (status) {
      case "saved":
        return "applied";
      case "applied":
        return "interviewing";
      case "interviewing":
        return "offered";
      case "offered":
        return null;
      default:
        return null;
    }
  };

  const getStatusShortLabel = (status: ApplicationStatus): string => {
    switch (status) {
      case "saved":
        return "Guardadas";
      case "applied":
        return "Postuladas";
      case "interviewing":
        return "Entrevistas";
      case "offered":
        return "Ofertas";
      case "rejected":
        return "Archivadas";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Subheader with Funnel Metrics */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/90 shadow-[0_8px_30px_rgba(13,148,136,0.06)] space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Mini-CRM Glass Pipeline</span>
              <GlassBadge variant="emerald" size="sm">
                SQLite Persistente
              </GlassBadge>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Gestión bidireccional de postulaciones, preparación técnica y notas privadas.
            </p>
          </div>

          {/* Actions: Add untracked + Toggle Archived */}
          <div className="flex flex-wrap items-center gap-2.5">
            {untrackedJobs.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">Radar:</span>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      updateJobStatus(e.target.value, "saved");
                      e.target.value = "";
                    }
                  }}
                  className="text-xs bg-teal-50 text-teal-950 font-semibold border border-teal-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer max-w-[200px] truncate"
                >
                  <option value="" disabled>
                    + Importar del Radar ({untrackedJobs.length})
                  </option>
                  {untrackedJobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.company} - {j.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                showArchived
                  ? "bg-slate-800 text-white border-slate-700 shadow-2xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{showArchived ? "Ocultar Archivadas" : `Ver Archivadas (${rejectedCount})`}</span>
            </button>
          </div>
        </div>

        {/* Funnel Metrics Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-950 font-semibold flex items-center gap-1.5 shadow-2xs">
            <Briefcase className="w-3.5 h-3.5 text-teal-600" />
            <span>{totalTracked} en Embudo</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold flex items-center gap-1.5 shadow-2xs">
            <span>{savedCount} Guardadas</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-950 font-semibold flex items-center gap-1.5 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-cyan-600" />
            <span>{appliedCount} Postuladas</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 font-semibold flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>{interviewCount} En Entrevista</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 font-bold flex items-center gap-1.5 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{offeredCount} Ofertas</span>
          </div>

          {/* Conversion indicators */}
          <div className="ml-auto hidden xl:flex items-center gap-3 text-xs text-slate-600 font-semibold">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
              <span>Respuesta:</span>
              <span className="font-bold text-teal-900">{responseRate}%</span>
            </div>
            {totalInterviewsPlusOffers > 0 && (
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ofertas:</span>
                <span className="font-bold text-emerald-900">{offerRate}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kanban Board Columns Grid */}
      <div
        className={`grid gap-4 ${
          showArchived
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
        }`}
      >
        {activeColumns.map((col) => {
          const colJobs = jobs.filter((job) => {
            const track = jobTracker[job.id];
            return track?.status === col.id;
          });

          return (
            <div
              key={col.id}
              className="flex flex-col rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 bg-white/60 backdrop-blur-xl border border-white/85 shadow-[0_4px_20px_rgba(13,148,136,0.05)] min-h-[520px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-teal-900/10">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    {col.title}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${col.badgeColor}`}>
                  {colJobs.length}
                </span>
              </div>

              {/* Column Cards */}
              <div className="flex-1 space-y-3">
                {colJobs.length === 0 ? (
                  <div className="h-44 flex flex-col items-center justify-center text-center p-4 border border-dashed border-teal-900/15 rounded-2xl text-slate-400 text-xs">
                    <span>Sin vacantes en este estado</span>
                  </div>
                ) : (
                  colJobs.map((job) => {
                    const track = jobTracker[job.id];
                    const hasNotes = Boolean(track?.notes);
                    const currentStatus = track?.status || col.id;
                    const prevStatus = getPreviousStatus(currentStatus);
                    const nextStatus = getNextStatus(currentStatus);

                    return (
                      <GlassCard
                        key={job.id}
                        hoverable
                        onClick={() => onSelectJob(job)}
                        className={`p-3.5 bg-white/95 border ${col.accentBorder} hover:border-teal-500/40 shadow-xs space-y-2.5`}
                      >
                        {/* Title & Match Ring */}
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-900 tracking-tight leading-snug line-clamp-2">
                            {job.title}
                          </h4>
                          {job.match && (
                            <div className="shrink-0">
                              <MatchRing score={job.match.matchScore} size="sm" />
                            </div>
                          )}
                        </div>

                        {/* Company, Location & Salary */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-[11px] text-teal-850 font-semibold truncate">
                            <Building2 className="w-3 h-3 text-teal-600 shrink-0" />
                            <span className="truncate">{job.company}</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{job.location}</span>
                            </span>
                            {job.salaryText && (
                              <span className="font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/80 shrink-0">
                                {job.salaryText}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Note Snippet preview if exists */}
                        {hasNotes && (
                          <div className="p-2 rounded-lg bg-teal-50/80 border border-teal-200/70 text-[11px] text-slate-700 italic line-clamp-2">
                            &quot;{track?.notes}&quot;
                          </div>
                        )}

                        {/* Date & Note Button */}
                        <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-100 text-slate-500">
                          <span className="flex items-center gap-1 font-medium text-slate-600">
                            <Calendar className="w-3 h-3 text-teal-600" />
                            {track?.date || "Reciente"}
                          </span>

                          <button
                            onClick={(e) => handleOpenNotes(job, e)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold text-teal-800 hover:bg-teal-50 border border-teal-200 transition-colors cursor-pointer"
                          >
                            <FileEdit className="w-3 h-3 text-teal-600" />
                            <span>{hasNotes ? "Ver Nota" : "+ Nota"}</span>
                          </button>
                        </div>

                        {/* Contextual Prep Actions */}
                        <div
                          className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => onSelectJob(job)}
                            title="Simular 3 Preguntas de Entrevista con Gemini"
                            className="flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[10px] font-bold text-teal-900 bg-teal-50/90 hover:bg-teal-100 border border-teal-200/80 transition-colors cursor-pointer text-center"
                          >
                            <HelpCircle className="w-3 h-3 text-teal-600 shrink-0" />
                            <span className="truncate">Simular Entrevista</span>
                          </button>

                          <button
                            onClick={() => onSelectJob(job)}
                            title="Abrir y Copiar Pitch Personalizado"
                            className="flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[10px] font-bold text-cyan-900 bg-cyan-50/90 hover:bg-cyan-100 border border-cyan-200/80 transition-colors cursor-pointer text-center"
                          >
                            <Send className="w-3 h-3 text-cyan-600 shrink-0" />
                            <span className="truncate">Pitch Reclutador</span>
                          </button>
                        </div>

                        {/* Bidirectional Controls & Quick Stage Switcher */}
                        <div
                          className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Previous Stage Button */}
                          {prevStatus ? (
                            <button
                              onClick={() => updateJobStatus(job.id, prevStatus)}
                              title={`Mover atrás a ${getStatusShortLabel(prevStatus)}`}
                              className="p-1 rounded-md text-slate-600 hover:text-teal-900 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 transition-colors cursor-pointer shrink-0"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <div className="w-6" />
                          )}

                          {/* Quick Stage Dropdown */}
                          <select
                            value={currentStatus}
                            onChange={(e) =>
                              updateJobStatus(job.id, e.target.value as ApplicationStatus)
                            }
                            className="text-[10px] font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-md px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer max-w-[130px] truncate"
                          >
                            <option value="saved">Guardadas</option>
                            <option value="applied">Postuladas</option>
                            <option value="interviewing">Entrevistas</option>
                            <option value="offered">Ofertas</option>
                            <option value="rejected">Archivadas</option>
                          </select>

                          {/* Next Stage Button or Archive / Restore */}
                          {nextStatus ? (
                            <button
                              onClick={() => updateJobStatus(job.id, nextStatus)}
                              title={`Avanzar a ${getStatusShortLabel(nextStatus)}`}
                              className="flex items-center gap-0.5 px-1.5 py-1 rounded-md text-[10px] font-bold text-teal-950 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors cursor-pointer shrink-0"
                            >
                              <span className="hidden sm:inline">{getStatusShortLabel(nextStatus)}</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          ) : currentStatus === "rejected" ? (
                            <button
                              onClick={() => updateJobStatus(job.id, "saved")}
                              title="Restaurar al Radar"
                              className="p-1 rounded-md text-teal-800 hover:bg-teal-50 border border-teal-200 transition-colors cursor-pointer shrink-0"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => updateJobStatus(job.id, "rejected")}
                              title="Archivar"
                              className="p-1 rounded-md text-slate-400 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer shrink-0"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </GlassCard>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Personal Notes Modal */}
      <JobNotesModal
        job={selectedJobForNotes}
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        onSaveNotes={(jobId, status, notes) =>
          updateJobNotes(jobId, status, notes)
        }
      />
    </div>
  );
}
