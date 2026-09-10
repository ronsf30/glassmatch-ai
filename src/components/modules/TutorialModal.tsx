"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  Radar,
  Languages,
  Kanban,
  FileText,
  ChevronRight,
  ChevronLeft,
  Briefcase,
  CheckCircle2,
  ShieldCheck,
  Zap,
  PlusCircle,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassBadge } from "@/components/ui/GlassBadge";

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToTab?: (tab: "radar" | "pipeline" | "profile") => void;
}

interface TutorialStep {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  actionText?: string;
  targetTab?: "radar" | "pipeline" | "profile";
}

export function TutorialModal({ isOpen, onClose, onGoToTab }: TutorialModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps: TutorialStep[] = [
    {
      id: "intro",
      badge: "Introducción a GlassMatch AI",
      title: "Asistente de Empleo Human-in-the-Loop",
      subtitle: "Búsqueda de empleo inteligente, privada y evaluada por IA",
      icon: <Sparkles className="w-6 h-6 text-teal-600" />,
      content: (
        <div className="space-y-3.5 text-xs text-slate-700 leading-relaxed">
          <p>
            <strong>GlassMatch AI</strong> está diseñado para profesionales que buscan vacantes remotas de alto valor sin invertir horas revisando publicaciones no afines a su perfil.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20">
              <span className="font-bold text-teal-950 block text-[13px]">Diseño Caribbean Glass</span>
              <span className="text-[11px] text-slate-600">Interfaz luminosa con componentes translúcidos de alta legibilidad.</span>
            </div>
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <span className="font-bold text-teal-950 block text-[13px]">Almacenamiento Local</span>
              <span className="text-[11px] text-slate-600">Tus datos, CV y notas residen de forma privada en tu base de datos SQLite.</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="font-bold text-teal-950 block text-[13px]">Evaluación con Gemini</span>
              <span className="text-[11px] text-slate-600">Diagnóstico semántico de compatibilidad y propuestas de postulación.</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "radar",
      badge: "Módulo 1: Match Radar y Kill Switches",
      title: "Exploración de Vacantes con Afinidad",
      subtitle: "Filtros por idioma, salario y 5 Kill Switches deterministas",
      icon: <Radar className="w-6 h-6 text-teal-600" />,
      targetTab: "radar",
      actionText: "Ir al Match Radar",
      content: (
        <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span><strong>Anillo de Compatibilidad (0 a 100):</strong> Diagnóstico semántico que pondera tus habilidades frente a las exigencias reales de cada oferta.</span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span><strong>5 Kill Switches ATS:</strong> Descarte automático en 0 ms ante exclusiones técnicas (Java, .NET), barrera lingüística C1/C2 o exigencia estricta de visa y residencia estadounidense.</span>
            </li>
            <li className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span><strong>Actualizar 10 Ofertas:</strong> Consulta o genera una nueva selección de vacantes calculando su afinidad de forma instantánea.</span>
            </li>
            <li className="flex items-start gap-2">
              <Languages className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span><strong>Filtro de Idioma B1/B2:</strong> Descarta las publicaciones que requieran fluidez oral ejecutiva C1/C2 para enfocar tus esfuerzos en vacantes alcanzables.</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "quick-add",
      badge: "Módulo 2: Análisis Manual Inmediato",
      title: "Evaluación Externa (+ Nueva Vacante)",
      subtitle: "Analiza cualquier oferta externa de LinkedIn, correos o bolsas de empleo",
      icon: <PlusCircle className="w-6 h-6 text-teal-600" />,
      content: (
        <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
          <p>
            Mediante el botón <strong>+ Nueva Vacante</strong> situado en la barra superior puedes evaluar ofertas encontradas en cualquier lugar de la web:
          </p>
          <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/20 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-teal-950">
              <span>Pegado Directo de Texto o Enlace:</span>
              <span className="text-teal-700">Análisis Asíncrono en Segundos</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Pega los requisitos de la vacante para activar el motor ATS y Gemini 2.0 Flash. Si la oferta es compatible, se incorporará inmediatamente a tu radar con desglose de fortalezas, brechas y carta de presentación recomendada.
            </p>
            <p className="text-[11px] text-slate-600">
              <strong>Protección Zero-Trust:</strong> Si la publicación viola tus límites técnicos o de residencia, el sistema la descartará al instante sin permitir que contamine tu flujo de trabajo.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "sync",
      badge: "Módulo 3: Sincronizador Multi-Portal",
      title: "Búsqueda Multi-Canal en Vivo",
      subtitle: "Extracción directa en portales globales con protección anti-baneo",
      icon: <Zap className="w-6 h-6 text-teal-600" />,
      content: (
        <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
          <p>
            Al presionar <strong>Sincronizar</strong> en la barra superior, el motor se conecta a múltiples fuentes de empleo remoto:
          </p>
          <div className="p-3.5 rounded-xl bg-white/70 border border-teal-500/20 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-teal-950">
              <span>Portales en Producción:</span>
              <span className="text-teal-700">LinkedIn Guest API • Remotive • Jobicy • Arbeitnow</span>
            </div>
            <p className="text-[11px] text-slate-600">
              <strong>Protección de Red Anti-Baneo:</strong> Cada petición aplica un retardo con jitter adaptativo de 1.2 a 2.5 segundos para evitar bloqueos HTTP 429.
            </p>
            <p className="text-[11px] text-slate-600">
              <strong>Pre-Filtrado Determinista a Costo Cero:</strong> Las descripciones se sanitizan y filtran antes de llamar a la inteligencia artificial, ahorrando el 100% de tokens en vacantes incompatibles.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "pipeline",
      badge: "Módulo 4: Glass Pipeline CRM",
      title: "Gestión de Candidaturas y Notas Privadas",
      subtitle: "Control integral del ciclo de selección en 6 etapas transaccionales",
      icon: <Kanban className="w-6 h-6 text-teal-600" />,
      targetTab: "pipeline",
      actionText: "Ir al Glass Pipeline",
      content: (
        <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
          <p>
            El embudo visual organiza tus procesos en 6 estados transaccionales reales:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center text-[11px]">
            <div className="p-2 rounded-lg bg-slate-500/10 border border-slate-500/20 font-bold text-slate-800">1. Descubiertas</div>
            <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/20 font-bold text-teal-950">2. Guardadas</div>
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 font-bold text-teal-950">3. Postuladas</div>
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 font-bold text-amber-950">4. En Entrevista</div>
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 font-bold text-emerald-950">5. Oferta Recibida</div>
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 font-bold text-rose-950">6. Descartadas</div>
          </div>
          <p className="text-[11px] text-slate-600">
            <strong>Bloc de Notas Confidencial:</strong> Cada tarjeta permite registrar notas privadas, preguntas formuladas por entrevistadores y condiciones salariales conversadas, almacenadas en tu SQLite local.
          </p>
        </div>
      ),
    },
    {
      id: "profile-interview",
      badge: "Módulo 5: CV Studio y Simulador",
      title: "Auditoría de CV y Preparación de Entrevistas",
      subtitle: "Carga de documento PDF, límites técnicos y simulación técnica",
      icon: <Briefcase className="w-6 h-6 text-teal-600" />,
      targetTab: "profile",
      actionText: "Ir a CV Studio",
      content: (
        <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span><strong>Carga Multimodal de CV (PDF):</strong> Sube tu documento curricular para que Gemini extraiga tus competencias técnicas reales, nivel de seniority y pretensión salarial sugerida.</span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span><strong>Matriz de Exclusiones y Límites:</strong> Define qué tecnologías o requerimientos quedan categóricamente excluidos de tu búsqueda laboral.</span>
            </li>
            <li className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span><strong>Simulador de Entrevista por Oferta:</strong> Al abrir cualquier vacante en el radar, genera 3 preguntas técnicas de arquitectura punzantes con respuestas modelo para defender tus puntos de mejora.</span>
            </li>
          </ul>
        </div>
      ),
    },
  ];

  const currentStep = steps[currentStepIndex];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-teal-950/25 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="relative w-full max-w-xl z-10 my-auto"
        >
          <GlassCard className="p-6 sm:p-7 shadow-[0_20px_50px_rgba(13,148,136,0.22)] border-teal-500/30 bg-white/95 backdrop-blur-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-teal-900/10">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30">
                  {currentStep.icon}
                </div>
                <div>
                  <GlassBadge variant="sky" className="text-[10px] py-0 px-2">
                    {currentStep.badge}
                  </GlassBadge>
                  <h3 className="text-base font-bold text-teal-950 leading-snug">
                    {currentStep.title}
                  </h3>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-colors cursor-pointer"
                title="Cerrar guía"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-teal-800/80 font-medium mt-3 mb-4">
              {currentStep.subtitle}
            </p>

            <div className="min-h-[170px] flex flex-col justify-center">
              {currentStep.content}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 mt-4 border-t border-teal-900/10">
              <div className="flex items-center gap-1.5">
                {steps.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => setCurrentStepIndex(idx)}
                    className={`h-2 rounded-full transition-all duration-200 cursor-pointer ${
                      idx === currentStepIndex
                        ? "w-6 bg-teal-600"
                        : "w-2 bg-slate-200 hover:bg-teal-300"
                    }`}
                    title={s.title}
                  />
                ))}
                <span className="text-[11px] text-slate-500 ml-2 font-medium">
                  {currentStepIndex + 1} de {steps.length}
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {currentStepIndex > 0 && (
                  <GlassButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentStepIndex((prev) => prev - 1)}
                    icon={<ChevronLeft className="w-3.5 h-3.5" />}
                  >
                    Anterior
                  </GlassButton>
                )}

                {currentStep.actionText && currentStep.targetTab && onGoToTab && (
                  <GlassButton
                    variant="glass"
                    size="sm"
                    onClick={() => {
                      onGoToTab(currentStep.targetTab!);
                      onClose();
                    }}
                  >
                    {currentStep.actionText}
                  </GlassButton>
                )}

                {currentStepIndex < steps.length - 1 ? (
                  <GlassButton
                    variant="primary"
                    size="sm"
                    onClick={() => setCurrentStepIndex((prev) => prev + 1)}
                    icon={<ChevronRight className="w-3.5 h-3.5" />}
                  >
                    Siguiente
                  </GlassButton>
                ) : (
                  <GlassButton variant="primary" size="sm" onClick={onClose}>
                    Cerrar Guía
                  </GlassButton>
                )}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
