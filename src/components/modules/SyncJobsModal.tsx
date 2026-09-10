"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Radar,
  Search,
  MapPin,
  Clock,
  Layers,
  CheckCircle2,
  RefreshCw,
  Globe2,
} from "lucide-react";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { useApp } from "@/context/AppContext";
import { JobOffer } from "@/types";

interface SyncJobsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncSuccess?: (newCount: number) => void;
  initialQuery?: string;
}

export function SyncJobsModal({
  isOpen,
  onClose,
  onSyncSuccess,
  initialQuery,
}: SyncJobsModalProps) {
  const { profile, jobs, addNewJob } = useApp();

  const [searchTerm, setSearchTerm] = useState(
    initialQuery || profile.currentTitle || profile.targetRoles[0] || "Frontend Developer"
  );

  React.useEffect(() => {
    if (isOpen) {
      if (initialQuery && initialQuery.trim()) {
        setSearchTerm(initialQuery.trim());
      }
    }
  }, [isOpen, initialQuery]);

  const [location, setLocation] = useState("Remoto (Global)");
  const [resultsWanted, setResultsWanted] = useState(5);
  const [hoursOld, setHoursOld] = useState(72);
  const [sites, setSites] = useState<string[]>(["linkedin", "indeed"]);
  const [isRemote, setIsRemote] = useState(true);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStep, setSyncStep] = useState(1);
  const [stepMessage, setStepMessage] = useState("");

  const quickRoles = [
    "Frontend Developer",
    "UI/UX Designer",
    "Web Developer & Designer",
    "Junior Frontend",
    "Diseño Web & SEO",
  ];

  if (!isOpen) return null;

  const handleToggleSite = (site: string) => {
    if (sites.includes(site)) {
      if (sites.length > 1) {
        setSites(sites.filter((s) => s !== site));
      }
    } else {
      setSites([...sites, site]);
    }
  };

  const handleStartSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    setSyncStep(1);
    setStepMessage("Conectando con portales de empleo...");

    setTimeout(() => {
      setSyncStep(2);
      setStepMessage("Extrayendo publicaciones activas...");
    }, 900);

    setTimeout(() => {
      setSyncStep(3);
      setStepMessage("Evaluando compatibilidad semántica con tu perfil...");
    }, 2000);

    try {
      const existingJobIds = jobs.map((j) => j.id);

      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          searchTerm: searchTerm.trim(),
          location: location.trim(),
          resultsWanted,
          hoursOld,
          sites,
          isRemote,
          existingJobIds,
        }),
      });

      if (!res.ok) {
        throw new Error(`Error en el servidor (${res.status})`);
      }

      const data = await res.json();
      const newJobs: JobOffer[] = data.jobs || [];

      newJobs.forEach((job) => addNewJob(job));

      setSyncStep(4);
      setStepMessage(`Proceso completado. Se han incorporado ${newJobs.length} vacantes.`);

      setTimeout(() => {
        setIsSyncing(false);
        onSyncSuccess?.(newJobs.length);
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error("Error al sincronizar:", err);
      setStepMessage(`Aviso: ${err?.message || "Servidor reconectando"}. Por favor verifica que el servidor esté activo.`);
      setTimeout(() => {
        setIsSyncing(false);
      }, 2000);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={isSyncing ? undefined : onClose}
          className="fixed inset-0 bg-slate-900/35 backdrop-blur-xs cursor-pointer"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg z-10"
        >
          <GlassCard className="p-6 bg-white/95 backdrop-blur-3xl border-teal-500/30 shadow-[0_20px_60px_rgba(13,148,136,0.2)]">
            <div className="flex items-center justify-between pb-4 border-b border-teal-900/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-700 shadow-xs">
                  <Radar className="w-5 h-5 text-teal-600 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Sincronizador de Ofertas en Vivo
                  </h3>
                  <p className="text-xs text-slate-500">
                    Búsqueda multi-portal en tiempo real y diagnóstico de afinidad
                  </p>
                </div>
              </div>

              {!isSyncing && (
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-teal-500/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {isSyncing ? (
              <div className="py-10 text-center space-y-5">
                <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-teal-200 animate-ping opacity-25" />
                  <div className="w-14 h-14 rounded-full border-3 border-teal-500 border-t-transparent animate-spin flex items-center justify-center text-teal-600">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">
                    {stepMessage}
                  </h4>
                  <p className="text-xs text-teal-800 font-medium">
                    Fase {syncStep} de 4 • Normalizando y evaluando perfil
                  </p>
                </div>

                <div className="flex justify-center gap-2 pt-2">
                  {[1, 2, 3, 4].map((s) => (
                    <div
                      key={s}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        s <= syncStep
                          ? "w-8 bg-teal-600 shadow-xs"
                          : "w-2 bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <form onSubmit={handleStartSync} className="space-y-4 mt-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Puesto o Especialidad
                    </label>
                    <span className="text-[10px] text-slate-500">
                      Búsqueda amplia en título y descripción
                    </span>
                  </div>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Ej. Frontend Developer, UI/UX Designer, Webmaster..."
                      className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-teal-900/15 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 shadow-xs font-medium"
                      required
                    />
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {quickRoles.map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSearchTerm(role)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          searchTerm.toLowerCase() === role.toLowerCase()
                            ? "bg-teal-100 text-teal-950 border-teal-400 font-bold"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-teal-50 hover:text-teal-900"
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Ubicación
                    </label>
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full h-9 px-2.5 rounded-xl bg-white border border-teal-900/15 text-xs text-slate-900 focus:outline-none focus:border-teal-500 shadow-xs font-medium"
                    >
                      <option value="Remoto (Global)">Remoto (Global)</option>
                      <option value="Remoto (LATAM)">Remoto (LATAM)</option>
                      <option value="Remoto (España)">Remoto (España)</option>
                      <option value="Remoto (Estados Unidos)">Remoto (USA)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cantidad de Ofertas
                    </label>
                    <select
                      value={resultsWanted}
                      onChange={(e) => setResultsWanted(Number(e.target.value))}
                      className="w-full h-9 px-2.5 rounded-xl bg-white border border-teal-900/15 text-xs text-slate-900 focus:outline-none focus:border-teal-500 shadow-xs font-medium"
                    >
                      <option value={3}>3 ofertas</option>
                      <option value={5}>5 ofertas</option>
                      <option value={8}>8 ofertas</option>
                      <option value={12}>12 ofertas</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Publicación
                    </label>
                    <select
                      value={hoursOld}
                      onChange={(e) => setHoursOld(Number(e.target.value))}
                      className="w-full h-9 px-2.5 rounded-xl bg-white border border-teal-900/15 text-xs text-slate-900 focus:outline-none focus:border-teal-500 shadow-xs font-medium"
                    >
                      <option value={24}>Últimas 24 horas</option>
                      <option value={72}>Últimos 3 días</option>
                      <option value={168}>Última semana</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Portales de Empleo Activos
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "linkedin", label: "LinkedIn" },
                      { id: "remotive", label: "Remotive" },
                      { id: "jobicy", label: "Jobicy" },
                      { id: "arbeitnow", label: "Arbeitnow" },
                    ].map((site) => {
                      const isSelected = sites.includes(site.id);
                      return (
                        <button
                          key={site.id}
                          type="button"
                          onClick={() => handleToggleSite(site.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-teal-100 text-teal-900 border-teal-400 shadow-xs"
                              : "bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-800"
                          }`}
                        >
                          {isSelected ? "Seleccionado: " : "+ "}
                          {site.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-teal-900/10 text-xs">
                  <span className="font-semibold text-slate-700">
                    Priorizar Vacantes 100% Remotas
                  </span>
                  <input
                    type="checkbox"
                    checked={isRemote}
                    onChange={(e) => setIsRemote(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded accent-teal-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-500">
                    Motor: Conectores Abiertos + Gemini Flash AI
                  </span>

                  <div className="flex items-center gap-2">
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
                      icon={<Search className="w-3.5 h-3.5" />}
                    >
                      Buscar Ofertas en Vivo
                    </GlassButton>
                  </div>
                </div>
              </form>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
