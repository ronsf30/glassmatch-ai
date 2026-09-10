"use client";

import React, { useState, useRef } from "react";
import {
  BarChart3,
  Download,
  Upload,
  Database,
  FileSpreadsheet,
  FileCode,
  Printer,
  TrendingUp,
  DollarSign,
  Building2,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  FileText,
  Clock,
  Briefcase,
  XCircle,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { GlassButton } from "@/components/ui/GlassButton";
import { ExecutiveReportModal } from "@/components/modules/ExecutiveReportModal";
import { useApp } from "@/context/AppContext";
import { parseSalary } from "@/lib/utils";

export function AnalyticsStudioPreview() {
  const { profile, updateProfile, jobs, jobTracker } = useApp();

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isRestoringDb, setIsRestoringDb] = useState(false);
  const [restoreNotice, setRestoreNotice] = useState<{ success: boolean; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Embudo de conversion
  const totalJobs = jobs.length;
  const trackedJobs = Object.values(jobTracker);
  const totalTracked = trackedJobs.length;
  const savedCount = trackedJobs.filter((t) => t.status === "saved").length;
  const appliedCount = trackedJobs.filter((t) => t.status === "applied").length;
  const interviewCount = trackedJobs.filter((t) => t.status === "interviewing").length;
  const offeredCount = trackedJobs.filter((t) => t.status === "offered").length;
  const rejectedCount = trackedJobs.filter((t) => t.status === "rejected").length;

  const totalInProcess = appliedCount + interviewCount + offeredCount;
  const responseRate = totalInProcess > 0 ? Math.round(((interviewCount + offeredCount) / totalInProcess) * 100) : 0;
  const totalInterviewsPlusOffers = interviewCount + offeredCount;
  const offerRate = totalInterviewsPlusOffers > 0 ? Math.round((offeredCount / totalInterviewsPlusOffers) * 100) : 0;

  // Analitica Salarial
  const parsedSalaries: number[] = [];
  let explicitSalaryCount = 0;
  let undefinedSalaryCount = 0;

  jobs.forEach((j) => {
    if (j.salaryText) {
      const parsed = parseSalary(j.salaryText);
      if (parsed) {
        parsedSalaries.push(parsed.maxAnnual);
        explicitSalaryCount++;
      } else {
        undefinedSalaryCount++;
      }
    } else {
      undefinedSalaryCount++;
    }
  });

  parsedSalaries.sort((a, b) => a - b);
  const minObserved = parsedSalaries.length > 0 ? parsedSalaries[0] : 0;
  const maxObserved = parsedSalaries.length > 0 ? parsedSalaries[parsedSalaries.length - 1] : 0;
  const medianSalary =
    parsedSalaries.length > 0
      ? parsedSalaries[Math.floor(parsedSalaries.length / 2)]
      : 0;
  const avgObserved =
    parsedSalaries.length > 0
      ? Math.round(parsedSalaries.reduce((a, b) => a + b, 0) / parsedSalaries.length)
      : 0;

  const candidatePiso = profile.minSalary || 35000;
  const abovePisoCount = parsedSalaries.filter((s) => s >= candidatePiso).length;
  const abovePisoPercent =
    parsedSalaries.length > 0 ? Math.round((abovePisoCount / parsedSalaries.length) * 100) : 100;

  // Salarios por bandas
  const bands = {
    under30: parsedSalaries.filter((s) => s < 30000).length,
    from30to45: parsedSalaries.filter((s) => s >= 30000 && s < 45000).length,
    from45to60: parsedSalaries.filter((s) => s >= 45000 && s < 60000).length,
    above60: parsedSalaries.filter((s) => s >= 60000).length,
  };

  // Auditoria de Kill Switches
  const killSwitchCounts = {
    geoLegal: 0,
    discipline: 0,
    skills: 0,
    language: 0,
    seniority: 0,
  };

  jobs.forEach((j) => {
    const ks = j.match?.killSwitchTriggered;
    if (ks) {
      if (ks.includes("GEOGRAFICA") || ks.includes("LEGAL") || ks.includes("VISA")) {
        killSwitchCounts.geoLegal++;
      } else if (ks.includes("DISCIPLINA")) {
        killSwitchCounts.discipline++;
      } else if (ks.includes("HABILIDAD") || ks.includes("EXCLUIDA")) {
        killSwitchCounts.skills++;
      } else if (ks.includes("IDIOMA") || ks.includes("IDIOMATICA")) {
        killSwitchCounts.language++;
      } else if (ks.includes("SENIORITY")) {
        killSwitchCounts.seniority++;
      }
    }
  });

  // Empresas bloqueadas
  const blacklisted = profile.blacklistCompanies || [];

  const handleUnblockCompany = (companyToUnblock: string) => {
    updateProfile({
      blacklistCompanies: blacklisted.filter((c) => c.toLowerCase() !== companyToUnblock.toLowerCase()),
    });
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoringDb(true);
    setRestoreNotice(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/backup", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setRestoreNotice({
          success: true,
          message: data.message || "Base de datos restaurada. Recarga la pagina para actualizar.",
        });
        setTimeout(() => {
          window.location.reload();
        }, 1800);
      } else {
        setRestoreNotice({
          success: false,
          message: data.error || "Fallo durante la restauracion.",
        });
      }
    } catch (err: any) {
      setRestoreNotice({
        success: false,
        message: err.message || "Error al subir el archivo.",
      });
    } finally {
      setIsRestoringDb(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Subheader with Title & Quick Export Actions */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/90 shadow-[0_8px_30px_rgba(13,148,136,0.06)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Soberanía de Datos & Analítica de Mercado</span>
            <GlassBadge variant="sky" size="sm">
              Fase 7 Local-First
            </GlassBadge>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Portabilidad universal de datos, copias de seguridad de SQLite e inteligencia salarial.
          </p>
        </div>

        {/* Global Export & Print Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <a href="/api/export/csv" download className="inline-flex">
            <GlassButton
              type="button"
              variant="glass"
              size="sm"
              icon={<FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />}
            >
              Exportar CSV
            </GlassButton>
          </a>

          <a href="/api/export/json" download className="inline-flex">
            <GlassButton
              type="button"
              variant="glass"
              size="sm"
              icon={<FileCode className="w-3.5 h-3.5 text-cyan-600" />}
            >
              Exportar JSON
            </GlassButton>
          </a>

          <GlassButton
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setIsReportOpen(true)}
            icon={<Printer className="w-3.5 h-3.5" />}
          >
            Reporte Ejecutivo
          </GlassButton>
        </div>
      </div>

      {/* Main Grid: Backup & Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Backup & Restore Local (1 Col) */}
        <div className="space-y-6 lg:col-span-1">
          <GlassCard className="p-5 space-y-4 bg-white/95 border-teal-500/25 shadow-xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-teal-900/10">
              <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-700">
                <Database className="w-4 h-4 text-teal-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Copia de Seguridad SQLite
                </h3>
                <p className="text-[10px] text-slate-500">
                  Snapshot binario de <code className="text-teal-800 font-mono">prisma/dev.db</code>
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p className="text-[11px] leading-relaxed">
                Tus datos nunca viajan a servidores remotos. Puedes respaldar y restaurar la base de datos relacional completa para migrar entre maquinas sin perder historico.
              </p>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Vacantes guardadas:</span>
                  <span className="font-bold text-slate-900">{totalJobs}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Postulaciones en CRM:</span>
                  <span className="font-bold text-teal-800">{totalTracked}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Integridad WAL:</span>
                  <span className="font-bold text-emerald-800">Activa (Segura)</span>
                </div>
              </div>

              {/* Actions: Download & Restore */}
              <div className="space-y-2 pt-1">
                <a href="/api/backup" download className="block w-full">
                  <GlassButton
                    type="button"
                    variant="primary"
                    size="sm"
                    className="w-full justify-center"
                    icon={<Download className="w-3.5 h-3.5" />}
                  >
                    Descargar Respaldo SQLite (.db)
                  </GlassButton>
                </a>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".db,.sqlite,.sqlite3"
                  onChange={handleRestoreFile}
                  className="hidden"
                />

                <GlassButton
                  type="button"
                  variant="glass"
                  size="sm"
                  className="w-full justify-center"
                  onClick={() => fileInputRef.current?.click()}
                  isLoading={isRestoringDb}
                  icon={<Upload className="w-3.5 h-3.5 text-teal-600" />}
                >
                  Restaurar Base de Datos
                </GlassButton>
              </div>

              {restoreNotice && (
                <div
                  className={`p-2.5 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 ${
                    restoreNotice.success
                      ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                      : "bg-rose-50 text-rose-900 border-rose-300"
                  }`}
                >
                  {restoreNotice.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{restoreNotice.message}</span>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Blacklisted Companies Card */}
          <GlassCard className="p-5 space-y-4 bg-white/95 border-teal-500/20 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-teal-900/10">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-600" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Empresas Bloqueadas ({blacklisted.length})
                </h3>
              </div>
              <GlassBadge variant={blacklisted.length > 0 ? "rose" : "neutral"} size="sm">
                {blacklisted.length > 0 ? "Filtro Activo" : "Sin Bloqueos"}
              </GlassBadge>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Las vacantes de estas empresas se descartan en 0 ms antes de entrar al radar visual.
            </p>

            {blacklisted.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                No tienes empresas en la lista negra actualmente.
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {blacklisted.map((company) => (
                  <span
                    key={company}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-900 border border-rose-200"
                  >
                    <span>{company}</span>
                    <button
                      type="button"
                      onClick={() => handleUnblockCompany(company)}
                      title={`Desbloquear ${company}`}
                      className="text-rose-400 hover:text-rose-700 cursor-pointer font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Right Columns: Funnel, Market Salary, & Kill Switches (2 Cols) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Funnel Metrics & Conversion Rates */}
          <GlassCard className="p-5 space-y-4 bg-white/95 border-teal-500/20 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-teal-900/10">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Efectividad del Embudo y Conversión Histórica
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {totalTracked} en seguimiento
              </span>
            </div>

            {/* Funnel Steps */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Guardadas</span>
                <span className="text-xl font-bold text-slate-900">{savedCount}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">En radar activo</span>
              </div>

              <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200">
                <span className="text-[10px] font-bold text-cyan-800 uppercase block">Postuladas</span>
                <span className="text-xl font-bold text-cyan-950">{appliedCount}</span>
                <span className="text-[10px] text-cyan-700 block mt-0.5">En espera</span>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-[10px] font-bold text-amber-800 uppercase block">En Entrevistas</span>
                <span className="text-xl font-bold text-amber-950">{interviewCount}</span>
                <span className="text-[10px] text-amber-700 block mt-0.5">Rondas activas</span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">Ofertas</span>
                <span className="text-xl font-bold text-emerald-950">{offeredCount}</span>
                <span className="text-[10px] text-emerald-700 block mt-0.5">Finalizadas con éxito</span>
              </div>
            </div>

            {/* Conversion Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-teal-950">Tasa de Respuesta Inicial:</span>
                  <span className="font-bold text-teal-900 text-sm">{responseRate}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-teal-100 overflow-hidden">
                  <div
                    className="h-full bg-teal-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(responseRate, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-teal-800">
                  Porcentaje de postulaciones que avanzan al menos a ronda de entrevista.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-950">Tasa de Cierre (Ofertas):</span>
                  <span className="font-bold text-emerald-900 text-sm">{offerRate}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-emerald-100 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(offerRate, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-emerald-800">
                  Porcentaje de entrevistas técnicas que culminan en oferta económica formal.
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Market Salary Intelligence */}
          <GlassCard className="p-5 space-y-4 bg-white/95 border-teal-500/20 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-teal-900/10">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Inteligencia Salarial del Mercado
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-600">
                Tu piso salarial:{" "}
                <strong className="text-emerald-800">${candidatePiso.toLocaleString()} USD</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  Paga Promedio Mercado
                </span>
                <span className="text-lg font-bold text-slate-900">
                  {avgObserved > 0 ? `$${avgObserved.toLocaleString()} USD` : "No disponible"}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Sobre ofertas públicas
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  Mediana Detectada
                </span>
                <span className="text-lg font-bold text-slate-900">
                  {medianSalary > 0 ? `$${medianSalary.toLocaleString()} USD` : "No disponible"}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Punto medio del mercado
                </span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                  Superan tu Piso
                </span>
                <span className="text-lg font-bold text-emerald-950">
                  {abovePisoPercent}%
                </span>
                <span className="text-[10px] text-emerald-700 block mt-0.5">
                  {abovePisoCount} de {explicitSalaryCount} ofertas
                </span>
              </div>

              <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200">
                <span className="text-[10px] font-bold text-cyan-800 uppercase block">
                  Salario Máximo Visto
                </span>
                <span className="text-lg font-bold text-cyan-950">
                  {maxObserved > 0 ? `$${maxObserved.toLocaleString()} USD` : "A convenir"}
                </span>
                <span className="text-[10px] text-cyan-700 block mt-0.5">
                  Techo del inventario
                </span>
              </div>
            </div>

            {/* Salary Bands Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                <span>Distribución de Bandas Salariales Declaradas:</span>
                <span className="text-[10px] text-slate-500">
                  {explicitSalaryCount} declaradas / {undefinedSalaryCount} a convenir
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-lg border border-slate-200 bg-white text-center">
                  <span className="text-[10px] text-slate-500 block">&lt; $30k USD</span>
                  <span className="font-bold text-slate-900">{bands.under30} vacantes</span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 bg-white text-center">
                  <span className="text-[10px] text-slate-500 block">$30k - $45k USD</span>
                  <span className="font-bold text-slate-900">{bands.from30to45} vacantes</span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 bg-white text-center">
                  <span className="text-[10px] text-slate-500 block">$45k - $60k USD</span>
                  <span className="font-bold text-slate-900">{bands.from45to60} vacantes</span>
                </div>
                <div className="p-2.5 rounded-lg border border-emerald-300 bg-emerald-50/50 text-center">
                  <span className="text-[10px] text-emerald-800 block">&gt; $60k USD</span>
                  <span className="font-bold text-emerald-950">{bands.above60} vacantes</span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* ATS Kill Switches Breakdown */}
          <GlassCard className="p-5 space-y-4 bg-white/95 border-teal-500/20 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-teal-900/10">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Auditoría de Barreras y Kill Switches del ATS
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Filtros deterministas activos
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="font-semibold text-slate-800">
                  1. Barrera Geográfica / Visado / W-2 / Clearance
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
                  {killSwitchCounts.geoLegal} descartadas
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="font-semibold text-slate-800">
                  2. Desviación de Disciplina o Roles no Objetivo
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  {killSwitchCounts.discipline} descartadas
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="font-semibold text-slate-800">
                  3. Límites Técnicos y Habilidades Vetadas (Excluded Skills)
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                  {killSwitchCounts.skills} descartadas
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="font-semibold text-slate-800">
                  4. Barrera Idiomática (Inglés C1/C2 oral o idiomas no hablados)
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
                  {killSwitchCounts.language} descartadas
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="font-semibold text-slate-800">
                  5. Brecha de Seniority (7+ o 10+ años de experiencia)
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                  {killSwitchCounts.seniority} descartadas
                </span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Executive Report Printable Modal */}
      <ExecutiveReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        profile={profile}
        jobs={jobs}
      />
    </div>
  );
}
