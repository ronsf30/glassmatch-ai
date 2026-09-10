"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  Link as LinkIcon,
  FileText,
  ShieldAlert,
  RotateCcw,
  Loader2,
  Info,
} from "lucide-react";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { useApp } from "@/context/AppContext";
import { JobOffer } from "@/types";

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddJob?: (urlOrText: string) => void;
  onAddJobSuccess?: (jobTitle: string, score: number) => void;
}

interface RejectionState {
  killSwitch: string | null;
  reason: string;
  summary: string;
}

function extractSalaryOrFallback(text: string): string {
  const salaryRegex =
    /(\$\s?[\d,]+(?:\s?-\s?\$\s?[\d,]+)?(?:\s?(?:k|usd|eur|€|\/año|\/mes|\/hr|anual|mensual))?)/i;
  const match = text.match(salaryRegex);
  return match ? match[0] : "A convenir / No especificado";
}

function inferTitleFromText(text: string): string {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  for (const line of lines.slice(0, 5)) {
    if (
      /(frontend|developer|designer|engineer|ui\/ux|web|fullstack|react|software|product)/i.test(
        line
      ) &&
      line.length < 75
    ) {
      return line.replace(/^#+\s*/, "").replace(/\*+/g, "").trim();
    }
  }
  return "Frontend Developer & UI/UX Designer";
}

function inferCompanyFromText(text: string): string {
  const match = text.match(
    /(?:at|en|empresa|company|about)\s+([A-Z][A-Za-z0-9\s&.-]{2,25})/i
  );
  if (match && match[1]) {
    return match[1].trim();
  }
  return "Empresa Tecnológica";
}

export function QuickAddModal({
  isOpen,
  onClose,
  onAddJobSuccess,
}: QuickAddModalProps) {
  const { profile, addNewJob } = useApp();
  const [activeTab, setActiveTab] = useState<"text" | "url">("text");
  const [inputUrl, setInputUrl] = useState("");
  const [inputText, setInputText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState("");
  const [rejectionData, setRejectionData] = useState<RejectionState | null>(null);

  if (!isOpen) return null;

  const handleResetForm = () => {
    setInputUrl("");
    setInputText("");
    setRejectionData(null);
    setIsAnalyzing(false);
  };

  const handleClose = () => {
    handleResetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const description =
      activeTab === "url"
        ? `Vacante extraída de la URL: ${inputUrl}. Requerimientos: Experiencia comprobable en ingeniería de software, desarrollo web y trabajo en equipo.`
        : inputText;

    if (!description.trim()) return;

    setIsAnalyzing(true);
    setRejectionData(null);
    setAnalysisStep("Conectando con Gemini Flash AI...");

    try {
      const title =
        activeTab === "url"
          ? "Frontend Developer / UI Designer"
          : inferTitleFromText(description);
      const company =
        activeTab === "url" ? "Portal Externo" : inferCompanyFromText(description);

      setTimeout(() => {
        setAnalysisStep("Evaluando compatibilidad y límites técnicos...");
      }, 700);

      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          jobDescription: description,
          jobTitle: title,
          company: company,
        }),
      });

      const json = await res.json();
      const matchData = json.data;

      const isRejected =
        !matchData ||
        matchData.isMatch === false ||
        matchData.matchScore === 0 ||
        Boolean(matchData.killSwitchTriggered);

      if (isRejected) {
        setRejectionData({
          killSwitch: matchData?.killSwitchTriggered || "DESCARTE_ATS_AUTOMATICO",
          reason:
            matchData?.reason ||
            "La vacante no cumple con los requisitos técnicos o de residencia definidos.",
          summary:
            matchData?.executiveSummary ||
            "Descartada por los Kill Switches deterministas del sistema ATS.",
        });
        setIsAnalyzing(false);
        return;
      }

      const finalTitle = matchData?.extractedJobTitle || title;
      const finalCompany = matchData?.extractedCompany || company;
      const score = matchData.matchScore || 75;
      const salaryText =
        matchData?.extractedSalary || extractSalaryOrFallback(description);

      const newOffer: JobOffer = {
        id: `job-${Date.now()}`,
        title: finalTitle,
        company: finalCompany,
        location: "Remoto / Global",
        workMode: "remote",
        url: activeTab === "url" ? inputUrl : "https://linkedin.com",
        salaryText: salaryText,
        source: activeTab === "url" ? "LinkedIn" : "Manual",
        createdAt: "Recién analizado",
        description: description,
        match: {
          id: `match-${Date.now()}`,
          jobOfferId: `job-${Date.now()}`,
          matchScore: score,
          executiveSummary:
            matchData.executiveSummary || "Análisis completado con éxito.",
          strengths: matchData.strengths || ["Experiencia técnica relevante"],
          missingSkills:
            matchData.missingSkills || ["Validar certificaciones complementarias"],
          interviewAdvice:
            matchData.interviewAdvice ||
            "Prepara ejemplos claros de tus proyectos en producción.",
          generatedPitch: matchData.generatedPitch || "",
          analyzedAt: new Date().toISOString(),
        },
      };

      addNewJob(newOffer);
      onAddJobSuccess?.(newOffer.title, score);

      handleResetForm();
      onClose();
    } catch (err) {
      console.error("Error al procesar vacante manual:", err);
      setIsAnalyzing(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop sutil y neutro */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={isAnalyzing ? undefined : handleClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs cursor-pointer"
        />

        {/* Ventana Modal Minimalista */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg z-10"
        >
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-700">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Analizar Vacante
                  </h3>
                  <p className="text-xs text-slate-500">
                    Evaluación semántica instantánea y extracción automática
                  </p>
                </div>
              </div>

              {!isAnalyzing && (
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Cerrar ventana"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Estado de Reclamación / Descarte ATS Zero-Trust */}
            {rejectionData ? (
              <div className="py-5 space-y-4">
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2.5">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Vacante Descartada por ATS (Score: 0%)</span>
                  </div>

                  <div className="text-xs space-y-1.5 text-slate-700">
                    <div className="inline-block px-2 py-0.5 rounded bg-rose-100 text-rose-900 font-semibold text-[10px] border border-rose-200">
                      Kill Switch: {rejectionData.killSwitch}
                    </div>
                    <p className="font-medium leading-relaxed">
                      {rejectionData.reason}
                    </p>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      {rejectionData.summary}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-500">
                    No agregada al radar para proteger tu tiempo
                  </span>
                  <div className="flex items-center gap-2">
                    <GlassButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClose}
                    >
                      Cerrar
                    </GlassButton>
                    <GlassButton
                      type="button"
                      variant="glass"
                      size="sm"
                      onClick={() => setRejectionData(null)}
                      icon={<RotateCcw className="w-3.5 h-3.5" />}
                    >
                      Modificar Texto
                    </GlassButton>
                  </div>
                </div>
              </div>
            ) : isAnalyzing ? (
              /* Loading State Minimalista (Sin doble animación de pulso) */
              <div className="py-12 text-center space-y-3">
                <Loader2 className="w-7 h-7 animate-spin text-teal-600 mx-auto" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Analizando Vacante
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {analysisStep}
                  </p>
                </div>
              </div>
            ) : (
              /* Formulario Minimalista: Solo Texto o URL */
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                {/* Selector de Entrada */}
                <div className="flex p-1 rounded-xl bg-slate-100 border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setActiveTab("text")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === "text"
                        ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-teal-600" />
                    <span>Pegar Texto de la Oferta</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("url")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === "url"
                        ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5 text-teal-600" />
                    <span>Pegar Enlace (URL)</span>
                  </button>
                </div>

                {/* Input Único según selección */}
                {activeTab === "url" ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      URL de la Vacante
                    </label>
                    <input
                      type="url"
                      placeholder="https://www.linkedin.com/jobs/view/..."
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                      required
                    />
                    <div className="flex items-start gap-1.5 mt-2 text-[11px] text-slate-500">
                      <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>
                        Se extraerán automáticamente los datos y requisitos disponibles de la publicación.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        Descripción o Requisitos
                      </label>
                      <span className="text-[11px] text-slate-400">
                        {inputText.trim()
                          ? `${inputText.length} caracteres`
                          : "Pega el texto completo"}
                      </span>
                    </div>
                    <textarea
                      rows={6}
                      placeholder="Pega aquí la descripción completa de la vacante. El sistema extraerá automáticamente el cargo, empresa, salario y evaluará el encaje con tu perfil..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="w-full p-3.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none"
                      required
                    />
                  </div>
                )}

                {/* Footer Minimalista */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Filtro Zero-Trust
                  </span>

                  <div className="flex items-center gap-2">
                    <GlassButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClose}
                    >
                      Cancelar
                    </GlassButton>
                    <GlassButton
                      type="submit"
                      variant="primary"
                      size="sm"
                      icon={<Sparkles className="w-3.5 h-3.5" />}
                    >
                      Analizar Vacante
                    </GlassButton>
                  </div>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
