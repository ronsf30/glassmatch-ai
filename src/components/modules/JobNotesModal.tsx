"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileEdit,
  Save,
  Building2,
  Calendar,
  Sparkles,
  CheckCircle2,
  Tag,
  Clock,
} from "lucide-react";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { JobOffer, ApplicationStatus } from "@/types";

interface JobNotesModalProps {
  job: JobOffer | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveNotes: (jobId: string, status: ApplicationStatus, notes: string) => void;
}

const PRESET_TAGS = [
  "Primera ronda técnica completada",
  "Prueba técnica enviada",
  "Esperando feedback de RRHH",
  "Segunda entrevista con Hiring Manager",
  "Oferta económica recibida a evaluar",
  "Rechazo amable / Guardado para futuro",
];

export function JobNotesModal({
  job,
  isOpen,
  onClose,
  onSaveNotes,
}: JobNotesModalProps) {
  const [notes, setNotes] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>("applied");

  useEffect(() => {
    if (job) {
      setNotes(job.tracking?.personalNotes || "");
      setSelectedStatus(job.tracking?.status || "saved");
    }
  }, [job]);

  if (!isOpen || !job) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveNotes(job.id, selectedStatus, notes);
    onClose();
  };

  const handleAddPresetTag = (tag: string) => {
    const dateStamp = new Date().toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    });
    const entry = `[${dateStamp}] ${tag}`;
    setNotes((prev) => {
      const clean = prev.trim();
      if (!clean) return entry;
      return `${clean}\n• ${entry}`;
    });
  };

  const statusOptions: { id: ApplicationStatus; label: string }[] = [
    { id: "saved", label: "Radar / Guardada" },
    { id: "applied", label: "Postulada (Esperando)" },
    { id: "interviewing", label: "En Entrevista" },
    { id: "offered", label: "Oferta Recibida" },
    { id: "rejected", label: "Archivada / Rechazada" },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg z-10"
        >
          <GlassCard className="p-6 bg-white/95 backdrop-blur-3xl border-teal-500/25 shadow-[0_20px_60px_rgba(13,148,136,0.2)]">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-teal-900/10">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-700 shrink-0 mt-0.5">
                  <FileEdit className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
                    {job.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1 text-teal-800 font-semibold">
                      <Building2 className="w-3 h-3 text-teal-600" />
                      {job.company}
                    </span>
                    <span>•</span>
                    <span>{job.location}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-teal-500/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notes Form */}
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Funnel Stage Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Estado en el Glass Pipeline
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {statusOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedStatus(opt.id)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all text-center cursor-pointer ${
                        selectedStatus === opt.id
                          ? "bg-teal-100 text-teal-950 border-teal-400 font-bold shadow-xs"
                          : "bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-white"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preset Tags for 1-Click Note Insertion */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-teal-600" />
                    Etiquetas Rápidas de Progreso:
                  </span>
                  <span className="text-[10px] text-slate-400">Clic para insertar con fecha</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddPresetTag(tag)}
                      className="px-2 py-1 rounded-lg text-[11px] font-medium bg-teal-50/80 hover:bg-teal-100 text-teal-900 border border-teal-200/80 transition-colors cursor-pointer"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Personal Notes Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Notas Privadas de Seguimiento (SQLite Local)
                  </label>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-teal-600" />
                    100% privado en tu máquina
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Escribe aquí tus apuntes: nombre del reclutador, preguntas clave de la entrevista técnica, detalles de salario acordado, fechas de respuesta..."
                  className="w-full p-3 rounded-xl bg-white border border-teal-900/15 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-400/20 resize-none shadow-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <GlassButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                >
                  Cancelar
                </GlassButton>
                <GlassButton
                  type="submit"
                  variant="primary"
                  size="sm"
                  icon={<Save className="w-3.5 h-3.5" />}
                >
                  Guardar en SQLite
                </GlassButton>
              </div>
            </form>
          </GlassCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
