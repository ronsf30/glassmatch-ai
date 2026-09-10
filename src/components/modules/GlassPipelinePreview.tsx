"use client";

import React, { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { MatchRing } from "@/components/ui/MatchRing";
import { GlassButton } from "@/components/ui/GlassButton";
import { JobNotesModal } from "@/components/modules/JobNotesModal";
import {
  Calendar,
  Building2,
  FileEdit,
  Sparkles,
  CheckCircle2,
  Clock,
  Briefcase,
} from "lucide-react";
import { JobOffer, ApplicationStatus } from "@/types";
import { useApp } from "@/context/AppContext";

interface GlassPipelinePreviewProps {
  onSelectJob: (job: JobOffer) => void;
}

export function GlassPipelinePreview({ onSelectJob }: GlassPipelinePreviewProps) {
  const { jobs, jobTracker, updateJobStatus, updateJobNotes } = useApp();
  const [selectedJobForNotes, setSelectedJobForNotes] = useState<JobOffer | null>(null);
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  const handleOpenNotes = (job: JobOffer, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedJobForNotes(job);
    setIsNotesOpen(true);
  };

  const columnDefs: {
    id: ApplicationStatus;
    title: string;
    nextStatus?: ApplicationStatus;
    nextLabel?: string;
  }[] = [
    {
      id: "saved",
      title: "Radar / Guardadas",
      nextStatus: "applied",
      nextLabel: "Marcar Postulada →",
    },
    {
      id: "applied",
      title: "Postuladas (Esperando)",
      nextStatus: "interviewing",
      nextLabel: "Pasa a Entrevista →",
    },
    {
      id: "interviewing",
      title: "En Entrevistas",
      nextStatus: "offered",
      nextLabel: "Oferta Recibida →",
    },
    {
      id: "offered",
      title: "Ofertas / Resueltas",
    },
  ];

  // Pipeline metrics
  const totalTracked = Object.keys(jobTracker).length;
  const appliedCount = Object.values(jobTracker).filter(
    (t) => t.status === "applied"
  ).length;
  const interviewCount = Object.values(jobTracker).filter(
    (t) => t.status === "interviewing"
  ).length;
  const offeredCount = Object.values(jobTracker).filter(
    (t) => t.status === "offered"
  ).length;

  return (
    <div className="space-y-6">
      {/* Module Subheader with Funnel Metrics */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-[0_8px_30px_rgba(13,148,136,0.06)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Mini-CRM Glass Pipeline</span>
            <GlassBadge variant="emerald" size="sm">
              SQLite Persistente
            </GlassBadge>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Seguimiento confidencial de tus aplicaciones laborales, fechas y notas privadas.
          </p>
        </div>

        {/* Funnel stats */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 font-semibold flex items-center gap-1.5 shadow-2xs">
            <Briefcase className="w-3.5 h-3.5 text-teal-600" />
            <span>{totalTracked} en Embudo</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-900 font-semibold flex items-center gap-1.5 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-cyan-600" />
            <span>{appliedCount} Postuladas</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-semibold flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>{interviewCount} En Entrevista</span>
          </div>
          {offeredCount > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold flex items-center gap-1.5 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{offeredCount} Ofertas</span>
            </div>
          )}
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columnDefs.map((col) => {
          const colJobs = jobs.filter((job) => {
            const track = jobTracker[job.id];
            return track?.status === col.id;
          });

          return (
            <div
              key={col.id}
              className="flex flex-col rounded-2xl sm:rounded-3xl p-4 bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_4px_20px_rgba(13,148,136,0.05)] min-h-[500px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-teal-900/10">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-950">
                  {col.title}
                </span>
                <span className="w-5 h-5 flex items-center justify-center rounded-full text-[11px] font-bold bg-teal-500/15 text-teal-900">
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

                    return (
                      <GlassCard
                        key={job.id}
                        hoverable
                        onClick={() => onSelectJob(job)}
                        className="p-4 bg-white/95 border-teal-500/20 hover:border-teal-500/40 shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h4 className="text-xs font-bold text-slate-900 tracking-tight leading-snug line-clamp-2">
                            {job.title}
                          </h4>
                          {job.match && (
                            <MatchRing score={job.match.matchScore} size="sm" />
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-[11px] text-teal-800 font-semibold mb-2">
                          <Building2 className="w-3 h-3 text-teal-600" />
                          <span>{job.company}</span>
                        </div>

                        {/* Note Snippet preview if exists */}
                        {hasNotes && (
                          <div className="mb-2.5 p-2 rounded-lg bg-teal-50/70 border border-teal-200/60 text-[11px] text-slate-700 italic line-clamp-2">
                            &quot;{track?.notes}&quot;
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-100 text-slate-500">
                          <span className="flex items-center gap-1 font-medium text-slate-600">
                            <Calendar className="w-3 h-3 text-teal-600" />
                            {track?.date || "Reciente"}
                          </span>

                          {/* Open Notes Button */}
                          <button
                            onClick={(e) => handleOpenNotes(job, e)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold text-teal-800 hover:bg-teal-50 border border-transparent hover:border-teal-200 transition-colors cursor-pointer"
                          >
                            <FileEdit className="w-3 h-3 text-teal-600" />
                            <span>{hasNotes ? "Nota" : "+ Nota"}</span>
                          </button>
                        </div>

                        {/* Advance Stage Button */}
                        {col.nextStatus && (
                          <div
                            className="mt-2.5 pt-2 border-t border-slate-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() =>
                                updateJobStatus(job.id, col.nextStatus!)
                              }
                              className="w-full text-center py-1 rounded-lg text-[10px] font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 transition-colors border border-teal-200 cursor-pointer"
                            >
                              {col.nextLabel}
                            </button>
                          </div>
                        )}
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
