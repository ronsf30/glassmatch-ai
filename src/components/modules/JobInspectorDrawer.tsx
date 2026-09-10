"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Building2,
  MapPin,
  DollarSign,
  Sparkles,
  Send,
  BookmarkCheck,
  RefreshCw,
  HelpCircle,
  Eye,
  EyeOff,
  Globe2,
  Cpu,
} from "lucide-react";
import { JobOffer, InterviewQuestion } from "@/types";
import { MatchRing } from "@/components/ui/MatchRing";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { GlassButton } from "@/components/ui/GlassButton";
import { useApp } from "@/context/AppContext";
import { getLiveJobUrl, meetsProgressiveSalaryExpectation } from "@/lib/utils";

interface JobInspectorDrawerProps {
  job: JobOffer | null;
  isOpen: boolean;
  onClose: () => void;
  onTrack?: (jobId: string) => void;
}

export function JobInspectorDrawer({
  job,
  isOpen,
  onClose,
  onTrack,
}: JobInspectorDrawerProps) {
  const { profile } = useApp();
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [pitchText, setPitchText] = useState<string>("");
  const [pitchTone, setPitchTone] = useState<"direct" | "executive" | "impact">("direct");
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Mock interview states
  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQuestion[] | null>(null);
  const [isLoadingInterview, setIsLoadingInterview] = useState(false);
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});

  // Sync pitch with selected job
  React.useEffect(() => {
    if (job?.match?.generatedPitch) {
      setPitchText(job.match.generatedPitch);
    }
    setInterviewQuestions(null);
    setRevealedAnswers({});
  }, [job]);

  if (!job) return null;

  const handleCopyPitch = () => {
    if (pitchText) {
      navigator.clipboard.writeText(pitchText);
      setCopiedPitch(true);
      setTimeout(() => setCopiedPitch(false), 2000);
    }
  };

  const handleRegeneratePitch = async (newTone: "direct" | "executive" | "impact") => {
    setPitchTone(newTone);
    setIsRegenerating(true);
    try {
      const res = await fetch("/api/pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          jobTitle: job.title,
          company: job.company,
          tone: newTone,
        }),
      });
      const data = await res.json();
      if (data.pitch) {
        setPitchText(data.pitch);
      }
    } catch (e) {
      console.error("Error al regenerar pitch:", e);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleLoadInterviewQuestions = async () => {
    setIsLoadingInterview(true);
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: job.title,
          company: job.company,
          description: job.description,
          profile,
        }),
      });
      const data = await res.json();
      if (data.questions) {
        setInterviewQuestions(data.questions);
      }
    } catch (err) {
      console.error("Error cargando preguntas de entrevista:", err);
    } finally {
      setIsLoadingInterview(false);
    }
  };

  const toggleRevealAnswer = (id: number) => {
    setRevealedAnswers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Frosted Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-900/25 backdrop-blur-xs cursor-pointer"
          />

          {/* Slide-in Caribbean Sea Glass Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white/95 backdrop-blur-3xl border-l border-teal-500/25 shadow-[0_0_50px_rgba(13,148,136,0.18)] flex flex-col overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="relative p-6 border-b border-teal-900/10 flex items-start justify-between gap-4 bg-gradient-to-r from-teal-50/50 to-cyan-50/30">
              <div className="flex-1 pr-2">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <GlassBadge variant="indigo" size="sm">
                    {job.source}
                  </GlassBadge>
                  <GlassBadge
                    variant={job.workMode === "remote" ? "emerald" : "neutral"}
                    size="sm"
                  >
                    {job.workMode.toUpperCase()}
                  </GlassBadge>

                  {/* Engine Traceability Badge */}
                  {job.match?.aiProvider === "offline_deterministic" || !job.match?.isLiveAi ? (
                    <GlassBadge variant="sky" size="sm" icon={<Cpu className="w-3 h-3 text-cyan-700" />}>
                      Evaluado en Local (0 Tokens)
                    </GlassBadge>
                  ) : job.match?.aiProvider === "groq" ? (
                    <GlassBadge variant="indigo" size="sm" icon={<Cpu className="w-3 h-3 text-indigo-600" />}>
                      Auditado con Groq Cloud (70B)
                    </GlassBadge>
                  ) : (
                    <GlassBadge variant="emerald" size="sm" icon={<Sparkles className="w-3 h-3 text-teal-600" />}>
                      Auditado con Gemini 3.8
                    </GlassBadge>
                  )}

                  {/* ATS Kill Switch Status Badge */}
                  {job.match?.killSwitchTriggered ? (
                    <GlassBadge variant="rose" size="sm">
                      ATS: {job.match.killSwitchTriggered}
                    </GlassBadge>
                  ) : job.match?.isMatch ? (
                    <GlassBadge variant="emerald" size="sm">
                      ATS: Aprobado
                    </GlassBadge>
                  ) : null}

                  {/* Language Requirement */}
                  <GlassBadge variant="sky" size="sm" icon={<Globe2 className="w-3 h-3" />}>
                    {job.match?.languageRequirement || "Inglés B1/B2 OK"}
                  </GlassBadge>

                  {/* Progressive Salary Badge */}
                  {job.salaryText && (() => {
                    const check = meetsProgressiveSalaryExpectation(job.salaryText, profile.minSalary || 35000, true);
                    return (
                      <GlassBadge
                        variant={check.parsed && check.diff > 0 ? "emerald" : check.parsed && check.diff < 0 ? "rose" : "amber"}
                        size="sm"
                        icon={<DollarSign className="w-3 h-3" />}
                      >
                        {job.salaryText} {check.parsed && check.diff > 0 ? `(+${Math.round(check.diff / 1000)}k sobre piso)` : ""}
                      </GlassBadge>
                    );
                  })()}
                </div>

                <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">
                  {job.title}
                </h2>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600">
                  <span className="flex items-center gap-1 font-semibold text-slate-800">
                    <Building2 className="w-3.5 h-3.5 text-teal-600" />
                    {job.company}
                  </span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {job.location}
                  </span>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-teal-500/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* ATS Kill Switch Alert Banner */}
              {job.match?.killSwitchTriggered ? (
                <div className="p-5 rounded-2xl bg-rose-50/95 border border-rose-300 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-rose-900 font-bold text-xs uppercase tracking-wider">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>ATS Kill Switch: {job.match.killSwitchTriggered}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-200/90 text-rose-900 border border-rose-400">
                      Match 0%
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-rose-950 font-semibold leading-relaxed">
                    {job.match.reason || "Esta vacante no cumple los criterios de descarte absoluto del candidato."}
                  </p>
                  <p className="text-[11px] text-rose-800/80">
                    El motor ATS Zero-Trust descarta esta posición de forma automática para ahorrarte tiempo en postulaciones incompatibles.
                  </p>
                </div>
              ) : job.match?.isMatch ? (
                <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-300/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Superó los 5 Kill Switches del ATS</span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-300">
                    Perfil Aprobado
                  </span>
                </div>
              ) : null}

              {/* Match Diagnostic Banner */}
              {job.match && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-50/90 via-cyan-50/60 to-emerald-50/40 border border-teal-200/80 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-5">
                  <MatchRing score={job.match.matchScore} size="md" showLabel />
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold uppercase tracking-wider mb-1">
                      {job.match.aiProvider === "offline_deterministic" || !job.match.isLiveAi ? (
                        <>
                          <Cpu className="w-3.5 h-3.5 text-cyan-600" />
                          <span className="text-cyan-900">Diagnóstico Determinista Motor Local</span>
                        </>
                      ) : job.match.aiProvider === "groq" ? (
                        <>
                          <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="text-indigo-900">Diagnóstico Semántico Groq Cloud (70B)</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                          <span className="text-teal-900">Diagnóstico Semántico Gemini Flash AI</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                      {job.match.executiveSummary}
                    </p>
                  </div>
                </div>
              )}

              {/* Strengths & Missing Skills Grid */}
              {job.match && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Strengths */}
                  <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200/90 shadow-xs">
                    <div className="flex items-center gap-2 mb-3 text-xs font-bold text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Tus Fortalezas Clave
                    </div>
                    <ul className="space-y-2 text-xs text-slate-700">
                      {job.match.strengths.map((strength, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-600 font-bold">•</span>
                          <span className="font-medium">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Missing / Gaps */}
                  <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 shadow-xs">
                    <div className="flex items-center gap-2 mb-3 text-xs font-bold text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Puntos a Defender
                    </div>
                    <ul className="space-y-2 text-xs text-slate-700">
                      {job.match.missingSkills.map((gap, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-600 font-bold">•</span>
                          <span className="font-medium">{gap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Flash Mock Interview Simulator */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-50/60 via-teal-50/40 to-white border border-teal-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-teal-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-teal-950">
                      Simulador de Entrevista Técnica (Gemini)
                    </h4>
                  </div>
                  {!interviewQuestions && (
                    <GlassButton
                      variant="primary"
                      size="sm"
                      isLoading={isLoadingInterview}
                      onClick={handleLoadInterviewQuestions}
                      icon={<Sparkles className="w-3.5 h-3.5" />}
                    >
                      Simular Preguntas
                    </GlassButton>
                  )}
                </div>

                {interviewQuestions ? (
                  <div className="space-y-3 pt-2">
                    {interviewQuestions.map((q) => {
                      const isRevealed = Boolean(revealedAnswers[q.id]);
                      return (
                        <div
                          key={q.id}
                          className="p-3.5 rounded-xl bg-white border border-teal-100 shadow-2xs space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                              Foco: {q.focus}
                            </span>
                            <button
                              onClick={() => toggleRevealAnswer(q.id)}
                              className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                            >
                              {isRevealed ? (
                                <>
                                  <EyeOff className="w-3 h-3" />
                                  <span>Ocultar Puntos Clave</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3 h-3" />
                                  <span>Ver Respuesta Modelo</span>
                                </>
                              )}
                            </button>
                          </div>

                          <p className="text-xs font-semibold text-slate-900 leading-snug">
                            {q.id}. {q.question}
                          </p>

                          {isRevealed && (
                            <div className="p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200/70 text-xs text-emerald-900 leading-relaxed font-medium animate-fade-in">
                              <span className="font-bold">Respuesta sugerida: </span>
                              {q.modelAnswer}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Gemini asume el rol del Hiring Manager de {job.company} y formula 3 preguntas técnicas de alto nivel basadas en los requisitos de esta vacante.
                  </p>
                )}
              </div>

              {/* Generated Recruiter Pitch with Tone Selector */}
              <div className="p-4 rounded-2xl bg-white border border-teal-200/80 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-950">
                    <Send className="w-3.5 h-3.5 text-teal-600" />
                    <span>Pitch Personalizado para Reclutador</span>
                  </div>

                  {/* Tone selector */}
                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100/90 text-[10px] font-semibold">
                    <button
                      onClick={() => handleRegeneratePitch("direct")}
                      disabled={isRegenerating}
                      className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                        pitchTone === "direct"
                          ? "bg-white text-teal-950 shadow-xs border border-teal-500/20 font-bold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Directo
                    </button>
                    <button
                      onClick={() => handleRegeneratePitch("executive")}
                      disabled={isRegenerating}
                      className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                        pitchTone === "executive"
                          ? "bg-white text-teal-950 shadow-xs border border-teal-500/20 font-bold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Ejecutivo
                    </button>
                    <button
                      onClick={() => handleRegeneratePitch("impact")}
                      disabled={isRegenerating}
                      className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                        pitchTone === "impact"
                          ? "bg-white text-teal-950 shadow-xs border border-teal-500/20 font-bold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Impacto
                    </button>
                  </div>
                </div>

                <div className="relative">
                  {isRegenerating ? (
                    <div className="p-6 text-center space-y-2 bg-slate-50/80 rounded-xl border border-slate-200/70">
                      <RefreshCw className="w-5 h-5 mx-auto text-teal-600 animate-spin" />
                      <p className="text-xs text-teal-900 font-semibold">
                        Reescribiendo pitch con Gemini ({pitchTone})...
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 font-sans">
                      {pitchText || "Generando pitch..."}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => handleRegeneratePitch(pitchTone)}
                    disabled={isRegenerating}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-teal-800 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Re-generar con IA</span>
                  </button>

                  <button
                    onClick={handleCopyPitch}
                    className="flex items-center gap-1 text-xs text-teal-800 hover:text-teal-950 transition-colors cursor-pointer px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 font-bold shadow-xs"
                  >
                    {copiedPitch ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-800">¡Copiado al Portapapeles!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-teal-700" />
                        <span>Copiar Mensaje</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Job Description Excerpt */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Descripción Oficial del Puesto
                </h3>
                <div className="text-xs text-slate-700 leading-relaxed bg-white p-4 rounded-2xl border border-slate-200/80 max-h-60 overflow-y-auto whitespace-pre-line shadow-xs">
                  {job.description}
                </div>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="p-4 sm:p-5 border-t border-teal-900/10 bg-white/90 backdrop-blur-xl flex items-center gap-3">
              <GlassButton
                variant="accent"
                className="flex-1"
                icon={<BookmarkCheck className="w-4 h-4" />}
                onClick={() => onTrack?.(job.id)}
              >
                Mover a Postulado
              </GlassButton>

              <a
                href={getLiveJobUrl(job)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <GlassButton
                  variant="primary"
                  icon={<ExternalLink className="w-4 h-4" />}
                >
                  Postular ↗
                </GlassButton>
              </a>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
