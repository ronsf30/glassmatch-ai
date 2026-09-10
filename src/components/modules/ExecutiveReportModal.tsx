"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Printer, Download, Briefcase, Building2, Calendar, CheckCircle2, DollarSign } from "lucide-react";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { JobOffer, UserProfile } from "@/types";

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  jobs: JobOffer[];
}

export function ExecutiveReportModal({
  isOpen,
  onClose,
  profile,
  jobs,
}: ExecutiveReportModalProps) {
  if (!isOpen) return null;

  const trackedJobs = jobs.filter((j) => j.tracking && j.tracking.status !== "discovered");
  const appliedCount = trackedJobs.filter((j) => j.tracking?.status === "applied").length;
  const interviewCount = trackedJobs.filter((j) => j.tracking?.status === "interviewing").length;
  const offeredCount = trackedJobs.filter((j) => j.tracking?.status === "offered").length;
  const savedCount = trackedJobs.filter((j) => j.tracking?.status === "saved").length;

  const totalInProcess = appliedCount + interviewCount + offeredCount;
  const responseRate = totalInProcess > 0 ? Math.round(((interviewCount + offeredCount) / totalInProcess) * 100) : 0;
  const totalInterviewsPlusOffers = interviewCount + offeredCount;
  const offerRate = totalInterviewsPlusOffers > 0 ? Math.round((offeredCount / totalInterviewsPlusOffers) * 100) : 0;

  const handlePrint = () => {
    window.print();
  };

  const todayStr = new Date().toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs cursor-pointer print:hidden"
        />

        {/* Report Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-4xl z-10 my-auto bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden print:m-0 print:p-0 print:border-none print:shadow-none print:w-full print:max-w-none"
        >
          {/* Top Bar (Hidden in Print) */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 print:hidden">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Vista Previa de Reporte Ejecutivo
            </span>
            <div className="flex items-center gap-2">
              <GlassButton
                type="button"
                variant="primary"
                size="sm"
                onClick={handlePrint}
                icon={<Printer className="w-3.5 h-3.5" />}
              >
                Imprimir / Guardar en PDF
              </GlassButton>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Document Body */}
          <div className="p-6 sm:p-10 space-y-6 text-slate-900 bg-white print:p-0">
            {/* Report Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-300 gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-teal-800">
                  GlassMatch AI • Informe Ejecutivo de Postulaciones
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
                  {profile.fullName || "Candidato"}
                </h1>
                <p className="text-sm font-semibold text-slate-600 mt-0.5">
                  {profile.currentTitle} • {profile.seniority}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Roles objetivo: {profile.targetRoles.join(", ")}
                </p>
              </div>

              <div className="text-left sm:text-right text-xs text-slate-500 space-y-1">
                <div>
                  <span className="font-semibold text-slate-700">Fecha de emisión:</span> {todayStr}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Piso Salarial Deseado:</span>{" "}
                  {profile.minSalary ? `$${profile.minSalary.toLocaleString()} USD / año` : "A convenir"}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Condición Migratoria:</span>{" "}
                  {profile.visaStatus || "Contractor Remoto"}
                </div>
              </div>
            </div>

            {/* KPI Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">
                  Postuladas
                </span>
                <span className="text-2xl font-black text-slate-900">{appliedCount}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">En espera de respuesta</span>
              </div>

              <div className="p-3.5 rounded-xl border border-cyan-200 bg-cyan-50/50">
                <span className="text-[11px] font-bold text-cyan-800 uppercase block">
                  En Entrevista
                </span>
                <span className="text-2xl font-black text-cyan-950">{interviewCount}</span>
                <span className="text-[10px] text-cyan-700 block mt-0.5">Procesos activos</span>
              </div>

              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50">
                <span className="text-[11px] font-bold text-emerald-800 uppercase block">
                  Ofertas Recibidas
                </span>
                <span className="text-2xl font-black text-emerald-950">{offeredCount}</span>
                <span className="text-[10px] text-emerald-700 block mt-0.5">Propuestas formales</span>
              </div>

              <div className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/50">
                <span className="text-[11px] font-bold text-teal-800 uppercase block">
                  Tasa de Respuesta
                </span>
                <span className="text-2xl font-black text-teal-950">{responseRate}%</span>
                <span className="text-[10px] text-teal-700 block mt-0.5">Postuladas a Entrevista</span>
              </div>
            </div>

            {/* Table of Applications */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Detalle Cronológico de Oportunidades ({trackedJobs.length})
              </h2>

              {trackedJobs.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-300 rounded-xl text-slate-500 text-xs">
                  No hay postulaciones registradas en el pipeline actualmente.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                        <th className="py-2.5 px-3">Puesto & Empresa</th>
                        <th className="py-2.5 px-3">Modalidad / Ubicación</th>
                        <th className="py-2.5 px-3">Salario</th>
                        <th className="py-2.5 px-3">Afinidad ATS</th>
                        <th className="py-2.5 px-3">Estado</th>
                        <th className="py-2.5 px-3">Fecha / Notas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {trackedJobs.map((job) => (
                        <tr key={job.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-semibold text-slate-900">
                            <div>{job.title}</div>
                            <div className="text-[11px] text-slate-600 font-normal">{job.company}</div>
                          </td>
                          <td className="py-2 px-3 text-slate-600">
                            <div>{job.workMode.toUpperCase()}</div>
                            <div className="text-[10px] text-slate-500">{job.location}</div>
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-800">
                            {job.salaryText || "A convenir"}
                          </td>
                          <td className="py-2 px-3 font-bold text-teal-800">
                            {job.match?.matchScore ? `${job.match.matchScore}%` : "-"}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                job.tracking?.status === "offered"
                                  ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                                  : job.tracking?.status === "interviewing"
                                  ? "bg-amber-100 text-amber-900 border-amber-300"
                                  : job.tracking?.status === "applied"
                                  ? "bg-cyan-100 text-cyan-900 border-cyan-300"
                                  : job.tracking?.status === "rejected"
                                  ? "bg-rose-100 text-rose-900 border-rose-300"
                                  : "bg-slate-100 text-slate-800 border-slate-300"
                              }`}
                            >
                              {job.tracking?.status?.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-600 text-[11px] max-w-xs">
                            <div className="font-medium text-slate-700">
                              {job.tracking?.appliedDate || "Reciente"}
                            </div>
                            {job.tracking?.personalNotes && (
                              <div className="text-[10px] text-slate-500 italic truncate">
                                &quot;{job.tracking.personalNotes}&quot;
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Document Footer */}
            <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span>GlassMatch AI • Sistema Local-First con Trazabilidad SQLite</span>
              <span>Página 1 de 1</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
