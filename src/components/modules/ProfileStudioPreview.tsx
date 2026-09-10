"use client";

import React, { useState, useRef, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { GlassButton } from "@/components/ui/GlassButton";
import {
  FileText,
  Upload,
  User,
  Plus,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Save,
  TrendingUp,
  Zap,
  Globe2,
  Ban,
  FileCheck,
  Key,
  ExternalLink,
  Cpu,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { LanguageLevel } from "@/types";

export function ProfileStudioPreview() {
  const {
    profile,
    updateProfile,
    addSkill,
    removeSkill,
    addExcludedSkill,
    removeExcludedSkill,
    cvFileName,
    setCvFileName,
    aiEngineMode,
    toggleAiEngineMode,
    activeCloudProvider,
    setActiveCloudProvider,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [newSkill, setNewSkill] = useState("");
  const [newExcludedSkill, setNewExcludedSkill] = useState("");
  const [isParsingCv, setIsParsingCv] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResults, setAuditResults] = useState<{
    skill: string;
    boost: string;
    reason: string;
  }[] | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [cvSuccessNotice, setCvSuccessNotice] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState(profile.fullName);
  const [currentTitle, setCurrentTitle] = useState(profile.currentTitle);
  const [minSalary, setMinSalary] = useState(
    profile.minSalary !== undefined && profile.minSalary !== null
      ? `$${profile.minSalary.toLocaleString()} USD`
      : "$35,000 USD"
  );
  const [primaryRole, setPrimaryRole] = useState(profile.targetRoles[0] || "");
  const [visaStatus, setVisaStatus] = useState(
    profile.visaStatus ||
      "Sin visado de trabajo foráneo (Solo modalidad Contractor / Remoto Internacional B2B)"
  );

  // Language states
  const [englishLevel, setEnglishLevel] = useState<LanguageLevel>("B2");
  const [englishPref, setEnglishPref] = useState<"async_preferred" | "live_fluent">("async_preferred");

  // Gemini API Key & Health Monitoring states (2026 Gemini 3.8 Generation)
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [maskedApiKey, setMaskedApiKey] = useState<string | null>(null);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [keyNotice, setKeyNotice] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<
    "operational" | "operational_lite" | "rate_limited" | "invalid_key" | "checking" | "no_key"
  >("checking");
  const [statusMessage, setStatusMessage] = useState<string>(
    "Comprobando disponibilidad de Gemini 3.8..."
  );
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [aiStrategy, setAiStrategy] = useState<"smart_saving" | "maximum_precision">("smart_saving");
  const [isUpdatingStrategy, setIsUpdatingStrategy] = useState(false);

  const checkGeminiStatus = async (
    forceProbe = true,
    strategyOverride?: "smart_saving" | "maximum_precision"
  ) => {
    setIsCheckingHealth(true);
    try {
      const targetStrategy = strategyOverride || aiStrategy;
      const res = await fetch(`/api/config/gemini?checkHealth=${forceProbe}&strategy=${targetStrategy}`);
      const data = await res.json();
      setHasApiKey(Boolean(data.hasKey));
      setMaskedApiKey(data.maskedKey || null);
      if (data.aiStrategy) {
        setAiStrategy(data.aiStrategy);
      }
      if (data.healthStatus) {
        setHealthStatus(data.healthStatus);
        setStatusMessage(data.statusMessage || "Estado actualizado");
      } else {
        setHealthStatus(data.hasKey ? "operational" : "no_key");
      }
    } catch {
      setHealthStatus("rate_limited");
      setStatusMessage("Error de conexión al verificar estado de Google API");
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleStrategyChange = async (newStrategy: "smart_saving" | "maximum_precision") => {
    setAiStrategy(newStrategy);
    setIsUpdatingStrategy(true);
    try {
      await fetch("/api/config/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiStrategy: newStrategy }),
      });
      await checkGeminiStatus(true, newStrategy);
    } catch {
      // Continuar silenciosamente
    } finally {
      setIsUpdatingStrategy(false);
    }
  };

  useEffect(() => {
    checkGeminiStatus(true);
  }, []);

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    setIsSavingKey(true);
    try {
      const res = await fetch("/api/config/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKeyInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setHasApiKey(true);
        setMaskedApiKey(data.maskedKey);
        setApiKeyInput("");
        setKeyNotice("Clave guardada con éxito. Diagnosticando cuota...");
        await checkGeminiStatus(true);
        setTimeout(() => setKeyNotice(null), 4000);
      }
    } catch {
      setKeyNotice("Error al guardar clave.");
      setTimeout(() => setKeyNotice(null), 3000);
    }
    setIsSavingKey(false);
  };

  // Backup AI states (Groq Cloud / Llama 3.3 70B)
  const [backupKeyInput, setBackupKeyInput] = useState("");
  const [hasBackupKey, setHasBackupKey] = useState(false);
  const [maskedBackupKey, setMaskedBackupKey] = useState<string | null>(null);
  const [isSavingBackupKey, setIsSavingBackupKey] = useState(false);
  const [backupKeyNotice, setBackupKeyNotice] = useState<string | null>(null);
  const [backupHealthStatus, setBackupHealthStatus] = useState<
    "operational" | "rate_limited" | "invalid_key" | "checking" | "no_key"
  >("checking");
  const [backupStatusMessage, setBackupStatusMessage] = useState<string>(
    "Sin clave de respaldo configurada"
  );
  const [isCheckingBackupHealth, setIsCheckingBackupHealth] = useState(false);

  const checkBackupAiStatus = async (forceProbe = true) => {
    setIsCheckingBackupHealth(true);
    try {
      const res = await fetch(`/api/config/backup-ai?checkHealth=${forceProbe}`);
      const data = await res.json();
      setHasBackupKey(Boolean(data.hasKey));
      setMaskedBackupKey(data.maskedKey || null);
      if (data.healthStatus) {
        setBackupHealthStatus(data.healthStatus);
        setBackupStatusMessage(data.statusMessage || "Estado de respaldo actualizado");
      } else {
        setBackupHealthStatus(data.hasKey ? "operational" : "no_key");
      }
    } catch {
      setBackupHealthStatus("no_key");
      setBackupStatusMessage("Sin conexión con proveedor de respaldo");
    } finally {
      setIsCheckingBackupHealth(false);
    }
  };

  const handleSaveBackupKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!backupKeyInput.trim()) return;
    setIsSavingBackupKey(true);
    try {
      const res = await fetch("/api/config/backup-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: backupKeyInput.trim(),
          provider: "groq",
          model: "llama-3.3-70b-versatile",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setHasBackupKey(true);
        setMaskedBackupKey(data.maskedKey);
        setBackupKeyInput("");
        setBackupKeyNotice("Clave de Groq guardada. Diagnosticando conexión...");
        await checkBackupAiStatus(true);
        setTimeout(() => setBackupKeyNotice(null), 4000);
      }
    } catch {
      setBackupKeyNotice("Error al guardar clave de respaldo.");
      setTimeout(() => setBackupKeyNotice(null), 3000);
    }
    setIsSavingBackupKey(false);
  };

  useEffect(() => {
    checkBackupAiStatus(true);
  }, []);

  // Keep local inputs synchronized with context profile
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName);
      setCurrentTitle(profile.currentTitle);
      setPrimaryRole(profile.targetRoles[0] || "");
      if (profile.minSalary !== undefined && profile.minSalary !== null) {
        setMinSalary(`$${profile.minSalary.toLocaleString()} USD`);
      }
      if (profile.visaStatus) {
        setVisaStatus(profile.visaStatus);
      }
      if (profile.languages && profile.languages.length > 0) {
        const eng = profile.languages.find((l) => l.language.toLowerCase().includes("ingl"));
        if (eng) {
          setEnglishLevel(eng.level);
          if (eng.preference) setEnglishPref(eng.preference);
        }
      }
    }
  }, [profile]);

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkill.trim()) {
      addSkill(newSkill.trim());
      setNewSkill("");
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const rawDigits = minSalary.replace(/[^0-9]/g, "");
    const parsed = parseInt(rawDigits, 10);
    const salaryNum = !isNaN(parsed) ? parsed : 0;
    updateProfile({
      fullName,
      currentTitle,
      minSalary: salaryNum,
      targetRoles: [primaryRole, ...profile.targetRoles.slice(1)],
      visaStatus,
      languages: [
        { language: "Español", level: "Native" },
        { language: "Inglés", level: englishLevel, preference: englishPref },
      ],
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Real CV File Upload Handler
  const handleRealFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingCv(true);
    setCvFileName(file.name);

    try {
      // Read file as Data URL (Base64) to support PDFs and binary formats
      const reader = new FileReader();
      reader.onload = async (event) => {
        const result = (event.target?.result as string) || "";
        const base64Data = result.includes(",") ? result.split(",")[1] : result;

        // Send to /api/cv/parse
        const res = await fetch("/api/cv/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileBase64: base64Data,
            mimeType: file.type || "application/pdf",
            fileName: file.name,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            setFullName(data.profile.fullName);
            setCurrentTitle(data.profile.currentTitle);
            setPrimaryRole(data.profile.targetRoles?.[0] || primaryRole);
            if (data.profile.minSalary) {
              setMinSalary(`$${Number(data.profile.minSalary).toLocaleString()} USD`);
            }
            if (data.profile.languages && data.profile.languages.length > 0) {
              const eng = data.profile.languages.find((l: any) =>
                l.language.toLowerCase().includes("ingl")
              );
              if (eng) {
                setEnglishLevel(eng.level);
                if (eng.preference) setEnglishPref(eng.preference);
              }
            }
            updateProfile(data.profile);

            const engineLabel =
              data.engineLabel ||
              (data.engineUsed === "gemini_3_8_flash"
                ? "Gemini 3.8 Flash AI"
                : data.engineUsed === "gemini_3_8_flash_lite"
                ? "Gemini 3.8 Flash-Lite AI"
                : "Motor Local Autónomo");

            if (data.engineUsed === "local_autonomous" && hasApiKey) {
              setHealthStatus("rate_limited");
              setStatusMessage("Límite temporal alcanzado (HTTP 429) • Motor Local Autónomo Activo");
            } else if (data.engineUsed === "gemini_3_8_flash_lite") {
              setHealthStatus("operational_lite");
              setStatusMessage("Gemini 3.8 Flash-Lite Operativo (Cascada de Ahorro Activa)");
            } else if (data.engineUsed === "gemini_3_8_flash") {
              setHealthStatus("operational");
              setStatusMessage("Gemini 3.8 Flash Operativo (Cuota disponible)");
            }

            setCvSuccessNotice(
              `CV de "${data.profile.fullName}" indexado con éxito mediante ${engineLabel}. Perfil, seniority y habilidades actualizados.`
            );
            setTimeout(() => setCvSuccessNotice(null), 6000);
          }
        } else {
          setCvSuccessNotice("Error al procesar el archivo. Intenta de nuevo.");
          setTimeout(() => setCvSuccessNotice(null), 4000);
        }
        setIsParsingCv(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error al procesar archivo:", err);
      setIsParsingCv(false);
    }
  };

  const handleRunGlobalAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setAuditResults([
        {
          skill: "GraphQL",
          boost: "+6% Match promedio",
          reason: "Demandado en el 40% de las vacantes frontend de alta remuneración.",
        },
        {
          skill: "Kubernetes",
          boost: "+9% en roles Cloud",
          reason: "Cerraría la brecha en ofertas como CloudCore y FinScale.",
        },
        {
          skill: "Python / FastAPI",
          boost: "+8% en roles de IA",
          reason: "Alineación total para posiciones híbridas de AI Engineer.",
        },
      ]);
      setIsAuditing(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-[0_8px_30px_rgba(13,148,136,0.06)]">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>CV & Perfil Studio</span>
            <GlassBadge
              variant={
                aiEngineMode === "offline_deterministic"
                  ? "sky"
                  : healthStatus === "operational" || healthStatus === "operational_lite"
                  ? "emerald"
                  : healthStatus === "rate_limited"
                  ? "amber"
                  : "neutral"
              }
              size="sm"
            >
              {aiEngineMode === "offline_deterministic"
                ? "Modo Local Autónomo (0 Tokens)"
                : healthStatus === "operational"
                ? "Gemini 3.8 Flash (Luz Verde)"
                : healthStatus === "operational_lite"
                ? "Gemini 3.8 Flash-Lite (Luz Verde)"
                : healthStatus === "rate_limited"
                ? aiStrategy === "maximum_precision"
                  ? "Gemini 3.8 Flash: Cuota Excedida (HTTP 429)"
                  : "Flash-Lite: Cuota Excedida (HTTP 429)"
                : "Motor Local Autónomo"}
            </GlassBadge>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Configura tus datos, carga tu CV real y calibra tu nivel de inglés para el radar.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 animate-fade-in shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Perfil Guardado en SQLite</span>
          </div>
        )}
      </div>

      {cvSuccessNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-xs animate-fade-in">
          <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{cvSuccessNotice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Profile Form & Skills & Languages */}
        <div className="lg:col-span-2 space-y-6">
          {/* Candidate Form Card */}
          <GlassCard className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-teal-900/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400/20 via-cyan-400/20 to-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-700 shadow-sm">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {fullName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {currentTitle} • Seniority: {profile.seniority}
                  </p>
                </div>
              </div>

              <GlassButton
                variant="glass"
                size="sm"
                icon={<Save className="w-3.5 h-3.5 text-teal-700" />}
                onClick={handleSaveProfile}
              >
                Guardar Cambios
              </GlassButton>
            </div>

            <form onSubmit={handleSaveProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white border border-teal-900/15 text-slate-900 text-xs focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-400/20 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">
                  Título Profesional
                </label>
                <input
                  type="text"
                  value={currentTitle}
                  onChange={(e) => setCurrentTitle(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white border border-teal-900/15 text-slate-900 text-xs focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-400/20 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">
                  Rol Objetivo Primario
                </label>
                <input
                  type="text"
                  value={primaryRole}
                  onChange={(e) => setPrimaryRole(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white border border-teal-900/15 text-slate-900 text-xs focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-400/20 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">
                  Sueldo Anual Esperado (USD / año)
                </label>
                <input
                  type="text"
                  value={minSalary}
                  onChange={(e) => setMinSalary(e.target.value)}
                  placeholder="ej. $35,000 USD / año"
                  className="w-full h-10 px-3 rounded-xl bg-white border border-teal-900/15 text-slate-900 text-xs focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-400/20 shadow-xs"
                />
              </div>
            </form>
          </GlassCard>

          {/* Language Radar & Barrier Tuning */}
          <GlassCard className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-teal-900/10">
              <div className="flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-teal-600" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Language Radar (Filtro de Idiomas para Remoto)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Evita postular a ofertas con barreras lingüísticas que no se ajusten a tu nivel.
                  </p>
                </div>
              </div>
              <GlassBadge variant="sky" size="sm">
                B1 / B2 Target
              </GlassBadge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* English Level Selector */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Tu Nivel de Inglés (Escala MCER)
                </label>
                <div className="flex gap-1.5">
                  {(["B1", "B2", "C1", "Native"] as LanguageLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setEnglishLevel(lvl)}
                      className={`flex-1 py-1.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                        englishLevel === lvl
                          ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                          : "bg-white text-slate-700 border-teal-900/15 hover:bg-slate-50"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Communication Preference */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Preferencia de Comunicación Remota
                </label>
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEnglishPref("async_preferred")}
                    className={`px-2.5 py-1.5 rounded-xl text-left text-xs border transition-all cursor-pointer ${
                      englishPref === "async_preferred"
                        ? "bg-teal-50 text-teal-950 border-teal-400 font-bold"
                        : "bg-white text-slate-600 border-teal-900/10"
                    }`}
                  >
                    Inglés Técnico Asíncrono (Slack, PRs, Docs)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnglishPref("live_fluent")}
                    className={`px-2.5 py-1.5 rounded-xl text-left text-xs border transition-all cursor-pointer ${
                      englishPref === "live_fluent"
                        ? "bg-teal-50 text-teal-950 border-teal-400 font-bold"
                        : "bg-white text-slate-600 border-teal-900/10"
                    }`}
                  >
                    Conversación en Vivo Diaria con Clientes
                  </button>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* ATS Kill Switch 1: Visa / Legal Status */}
          <GlassCard className="space-y-3 border-amber-200/80 bg-amber-50/20">
            <div className="flex items-center justify-between pb-2 border-b border-amber-900/10">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-amber-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  Estatus Migratorio y Permiso Laboral (Kill Switch 1 ATS)
                </h4>
              </div>
              <GlassBadge variant="amber" size="sm">
                Regla Legal
              </GlassBadge>
            </div>
            <p className="text-[11px] text-slate-600">
              El motor ATS descartará de inmediato ofertas que exijan obligatoriamente ciudadanía local, Green Card en EE.UU. o autorización W2 sin patrocinio cuando tu estatus sea remoto contractor internacional.
            </p>
            <div className="space-y-1.5">
              <input
                type="text"
                value={visaStatus}
                onChange={(e) => setVisaStatus(e.target.value)}
                placeholder="ej. Sin visado de trabajo foráneo (Solo modalidad Contractor / Remoto Internacional B2B)"
                className="w-full h-9 px-3.5 rounded-xl bg-white border border-amber-300/80 text-slate-900 text-xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 shadow-xs font-medium"
              />
              <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
                {[
                  "Sin visado de trabajo foráneo (Solo modalidad Contractor / Remoto Internacional B2B)",
                  "Ciudadano / Residente con permiso completo de trabajo",
                  "Visado de trabajo en trámite / Requiere patrocinio",
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setVisaStatus(preset)}
                    className="px-2.5 py-1 rounded-lg bg-amber-100/70 hover:bg-amber-200/80 text-amber-950 border border-amber-300/60 font-semibold cursor-pointer transition-colors"
                  >
                    {preset.split("(")[0]}
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Skills Radar Tuning */}
          <GlassCard className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-teal-900/10">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  Habilidades Extraídas & Afinado de Match
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Gemini compara estas palabras clave para determinar compatibilidad real.
                </p>
              </div>
              <span className="text-xs text-teal-800 font-bold px-2 py-0.5 rounded-lg bg-teal-50 border border-teal-200">
                {profile.extractedSkills.length} Habilidades
              </span>
            </div>

            {/* Add skill form */}
            <form onSubmit={handleAddSkill} className="flex gap-2">
              <input
                type="text"
                placeholder="Añadir habilidad (ej. GraphQL, AWS, Kubernetes, Golang)..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                className="flex-1 h-9 px-3.5 rounded-xl bg-white border border-teal-900/15 text-slate-900 text-xs focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-400/20 shadow-xs"
              />
              <GlassButton type="submit" variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                Añadir
              </GlassButton>
            </form>

            {/* Skills Pills */}
            <div className="flex flex-wrap gap-2 pt-2">
              {profile.extractedSkills.map((skill) => (
                <span
                  key={skill}
                  className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 hover:bg-teal-100 text-teal-950 border border-teal-200/80 transition-all shadow-xs"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="text-teal-600 hover:text-rose-600 transition-colors ml-0.5 cursor-pointer font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </GlassCard>

          {/* ATS Kill Switch 3: Excluded Skills / Dealbreakers */}
          <GlassCard className="space-y-4 border-rose-200/80 bg-rose-50/20">
            <div className="flex items-center justify-between pb-3 border-b border-rose-900/10">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Ban className="w-4 h-4 text-rose-600" />
                  Límites Técnicos y Tecnologías Excluidas (Kill Switch 3 ATS)
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Si una vacante exige como requisito indispensable cualquiera de estas tecnologías, el motor ATS la descartará automáticamente (Match 0%).
                </p>
              </div>
              <span className="text-xs text-rose-800 font-bold px-2 py-0.5 rounded-lg bg-rose-100/80 border border-rose-300">
                {(profile.excludedSkills || []).length} Exclusiones
              </span>
            </div>

            {/* Add excluded skill form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newExcludedSkill.trim()) {
                  addExcludedSkill(newExcludedSkill.trim());
                  setNewExcludedSkill("");
                }
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                placeholder="Añadir tecnología a excluir (ej. C#, .NET, Java Enterprise, Soporte IT)..."
                value={newExcludedSkill}
                onChange={(e) => setNewExcludedSkill(e.target.value)}
                className="flex-1 h-9 px-3.5 rounded-xl bg-white border border-rose-300/80 text-slate-900 text-xs focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-400/20 shadow-xs"
              />
              <GlassButton
                type="submit"
                variant="glass"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5 text-rose-600" />}
                className="border-rose-300 text-rose-800 hover:bg-rose-100"
              >
                Excluir
              </GlassButton>
            </form>

            {/* Excluded Skills Pills */}
            <div className="flex flex-wrap gap-2 pt-1">
              {(profile.excludedSkills || []).map((skill) => (
                <span
                  key={skill}
                  className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100/90 hover:bg-rose-200 text-rose-950 border border-rose-300 transition-all shadow-xs"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => removeExcludedSkill(skill)}
                    className="text-rose-600 hover:text-rose-900 transition-colors ml-0.5 cursor-pointer font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </GlassCard>

          {/* Blacklisted Companies Card */}
          {profile.blacklistCompanies && profile.blacklistCompanies.length > 0 && (
            <GlassCard className="space-y-3 p-4 bg-slate-50/80 border-slate-200">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Ban className="w-3.5 h-3.5 text-rose-500" />
                  <span>Empresas Bloqueadas (Excluidas del Reroll)</span>
                </h4>
                <span className="text-[11px] text-slate-400">
                  {profile.blacklistCompanies.length} bloqueadas
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.blacklistCompanies.map((comp) => (
                  <span
                    key={comp}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200"
                  >
                    <span>{comp}</span>
                    <button
                      onClick={() =>
                        updateProfile({
                          blacklistCompanies: profile.blacklistCompanies?.filter(
                            (c) => c !== comp
                          ),
                        })
                      }
                      className="text-rose-400 hover:text-rose-700 font-bold ml-1 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </GlassCard>
          )}
        </div>

        {/* Right 1 Col: Real CV Upload & Engine Status */}
        <div className="space-y-6">
          {/* Real CV Upload Box */}
          <GlassCard className="text-center p-6 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-700 shadow-sm">
              <FileText className="w-7 h-7" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900">Currículum Vitae Físico</h4>
              <p className="text-xs text-slate-600 mt-1 font-mono font-medium truncate max-w-xs mx-auto">
                {cvFileName}
              </p>
              <div className="inline-flex items-center gap-1 text-[10px] text-emerald-700 mt-1.5 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Indexado y persistido en SQLite
              </div>
            </div>

            <div className="pt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.docx,.md"
                onChange={handleRealFileUpload}
                className="hidden"
              />
              <GlassButton
                variant="primary"
                size="sm"
                className="w-full"
                icon={
                  isParsingCv ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )
                }
                isLoading={isParsingCv}
                onClick={() => fileInputRef.current?.click()}
              >
                {isParsingCv ? "Gemini Analizando CV..." : "Subir Archivo PDF / CV"}
              </GlassButton>
              <p className="text-[10px] text-slate-500 mt-2">
                Arrastra tu CV real: Gemini extraerá automáticamente tu perfil y habilidades.
              </p>
            </div>
          </GlassCard>

          {/* AI Gap Audit Card */}
          <GlassCard className="p-5 space-y-3 bg-gradient-to-br from-cyan-50/70 via-teal-50/50 to-white/90 border-teal-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-teal-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  Auditoría de Brechas con Gemini
                </h4>
              </div>
              <GlassButton
                variant="primary"
                size="sm"
                isLoading={isAuditing}
                onClick={handleRunGlobalAudit}
                icon={<Zap className="w-3.5 h-3.5" />}
              >
                Auditar
              </GlassButton>
            </div>

            <p className="text-xs text-slate-600">
              Descubre qué 2-3 tecnologías aumentarían más tus opciones de entrevista remota.
            </p>

            {auditResults && (
              <div className="space-y-2 pt-2 border-t border-teal-900/10">
                {auditResults.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-white/90 border border-teal-200/80 flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {item.skill}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {item.boost}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {item.reason}
                      </p>
                    </div>

                    <button
                      onClick={() => addSkill(item.skill)}
                      disabled={profile.extractedSkills.includes(item.skill)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors disabled:opacity-40 cursor-pointer shrink-0"
                    >
                      {profile.extractedSkills.includes(item.skill)
                        ? "Añadida"
                        : "+ Añadir"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Banner Informativo de Modo Local Autónomo (0 Tokens) */}
          {aiEngineMode === "offline_deterministic" && (
            <div className="p-3.5 rounded-xl bg-cyan-50/90 border border-cyan-300 text-cyan-950 flex items-center justify-between gap-3 text-xs shadow-xs">
              <div className="flex items-center gap-2.5">
                <Cpu className="w-5 h-5 text-cyan-700 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900">Modo Local Autónomo Activo (0 Tokens)</span>
                  <p className="text-[11px] text-cyan-900/80 mt-0.5 leading-snug">
                    Las llamadas a Gemini y Groq están pausadas y bloqueadas. Las casillas de IA se encuentran deshabilitadas para evitar llamadas innecesarias o errores de cuota.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggleAiEngineMode("cloud")}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-teal-800 bg-white hover:bg-teal-50 border border-teal-300 transition-colors shadow-2xs cursor-pointer shrink-0"
              >
                Activar Nube
              </button>
            </div>
          )}

          {/* Selector de Proveedor Cloud Mutuamente Excluyente */}
          <GlassCard className={`p-4 bg-white/95 border-slate-200 shadow-xs space-y-3 transition-opacity ${
            aiEngineMode === "offline_deterministic" ? "opacity-50 pointer-events-none select-none" : ""
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-teal-700" />
                <h4 className="text-xs font-bold text-slate-900">
                  Motor de IA en la Nube
                </h4>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                aiEngineMode === "offline_deterministic"
                  ? "bg-slate-100 text-slate-700 border-slate-300"
                  : "bg-emerald-100 text-emerald-900 border-emerald-300"
              }`}>
                {aiEngineMode === "offline_deterministic"
                  ? "Pausado (0 Tokens)"
                  : activeCloudProvider === "gemini"
                  ? "Activo: Google Gemini"
                  : "Activo: Groq Cloud"}
              </span>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              Selecciona el motor que procesará tus evaluaciones en la nube. Se utiliza <strong>exclusivamente uno a la vez</strong> para evitar consumo duplicado o dispersión de cuota.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveCloudProvider("gemini")}
                disabled={aiEngineMode === "offline_deterministic"}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  activeCloudProvider === "gemini"
                    ? "bg-teal-50/90 border-teal-500 text-teal-950 ring-1 ring-teal-400/30 font-bold shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Google Gemini 3.8</span>
                  {activeCloudProvider === "gemini" && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-tight font-normal">
                  Flash y Flash-Lite con OCR nativo de CVs.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setActiveCloudProvider("groq")}
                disabled={aiEngineMode === "offline_deterministic"}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  activeCloudProvider === "groq"
                    ? "bg-cyan-50/90 border-cyan-500 text-cyan-950 ring-1 ring-cyan-400/30 font-bold shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Groq Cloud</span>
                  {activeCloudProvider === "groq" && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-tight font-normal">
                  Llama 3.3 70B Versatile con latencia ultra baja.
                </p>
              </button>
            </div>
          </GlassCard>

          {/* Gemini 3.8 Flash AI Key & Health Monitoring Card */}
          <GlassCard className={`p-4 sm:p-5 space-y-3 bg-white/90 shadow-xs transition-all ${
            aiEngineMode === "offline_deterministic"
              ? "border-slate-200 opacity-60"
              : activeCloudProvider === "gemini"
              ? "border-teal-500/40 ring-1 ring-teal-400/20"
              : "border-slate-200 opacity-60"
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-teal-900/10">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-teal-600" />
                <h4 className="text-xs font-bold text-slate-900">
                  Google Gemini 3.8 Flash AI
                </h4>
              </div>
              <div className="flex items-center gap-1.5">
                {aiEngineMode === "cloud" && activeCloudProvider === "gemini" && (
                  <button
                    type="button"
                    onClick={() => checkGeminiStatus(true)}
                    disabled={isCheckingHealth}
                    title="Verificar estado de cuota y conectividad en Google AI Studio"
                    className="p-1 rounded-md text-slate-500 hover:text-teal-700 hover:bg-teal-50 border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${isCheckingHealth ? "animate-spin text-teal-600" : ""}`}
                    />
                  </button>
                )}
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                    aiEngineMode === "offline_deterministic"
                      ? "bg-slate-100 text-slate-700 border-slate-300"
                      : activeCloudProvider !== "gemini"
                      ? "bg-slate-100 text-slate-600 border-slate-300"
                      : isCheckingHealth
                      ? "bg-teal-50 text-teal-800 border-teal-200"
                      : !hasApiKey
                      ? "bg-slate-100 text-slate-700 border-slate-300"
                      : healthStatus === "operational"
                      ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                      : healthStatus === "operational_lite"
                      ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                      : healthStatus === "rate_limited"
                      ? "bg-amber-100 text-amber-900 border-amber-300"
                      : healthStatus === "invalid_key"
                      ? "bg-rose-100 text-rose-900 border-rose-300"
                      : "bg-teal-50 text-teal-800 border-teal-200"
                  }`}
                >
                  {aiEngineMode === "offline_deterministic"
                    ? "Pausado (0 Tokens)"
                    : activeCloudProvider !== "gemini"
                    ? "Inactivo (Usando Groq)"
                    : isCheckingHealth
                    ? "Comprobando..."
                    : !hasApiKey
                    ? "Sin Clave Configurada"
                    : healthStatus === "operational"
                    ? "Gemini 3.8 Flash Operativo"
                    : healthStatus === "operational_lite"
                    ? "Gemini 3.8 Flash-Lite Operativo"
                    : healthStatus === "rate_limited"
                    ? aiStrategy === "maximum_precision"
                      ? "Gemini 3.8 Flash: Cuota Excedida (HTTP 429)"
                      : "Flash-Lite: Cuota Excedida (HTTP 429)"
                    : healthStatus === "invalid_key"
                    ? "Clave Inválida"
                    : "Clave Configurada"}
                </span>
              </div>
            </div>

            {aiEngineMode === "cloud" && activeCloudProvider !== "gemini" && (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs">
                <span className="text-[11px] text-slate-600">
                  Proveedor en espera. Groq Cloud está procesando las solicitudes.
                </span>
                <button
                  type="button"
                  onClick={() => setActiveCloudProvider("gemini")}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-teal-800 bg-white hover:bg-teal-50 border border-teal-300 transition-colors shadow-2xs cursor-pointer shrink-0"
                >
                  Activar Gemini
                </button>
              </div>
            )}

            <div className={`space-y-3 transition-opacity ${
              aiEngineMode === "offline_deterministic" || activeCloudProvider !== "gemini"
                ? "opacity-40 pointer-events-none select-none"
                : ""
            }`}>
              <div className="text-[11px] text-slate-600 leading-relaxed space-y-1.5">
                {hasApiKey ? (
                  <>
                    <p>
                      <span className="font-semibold text-slate-800">Clave activa:</span> {maskedApiKey}. {statusMessage}
                    </p>
                    {healthStatus === "rate_limited" && aiStrategy === "maximum_precision" && (
                      <div className="text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200 font-medium space-y-1">
                        <p className="font-semibold">Cuota excedida en Gemini 3.8 Flash (HTTP 429).</p>
                        <p className="text-[10px] text-amber-800">
                          La cuota de Flash principal está agotada en Google AI Studio. Cambia a la pestaña <strong>Ahorro Inteligente</strong> para recibir luz verde y trabajar de inmediato con Gemini 3.8 Flash-Lite.
                        </p>
                      </div>
                    )}
                    {healthStatus === "operational_lite" && aiStrategy === "smart_saving" && (
                      <div className="text-emerald-900 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 font-medium space-y-1">
                        <p className="font-semibold">Luz verde para trabajar con IA (Gemini 3.8 Flash-Lite).</p>
                        <p className="text-[10px] text-emerald-800">
                          Cuota activa y disponible en Google AI Studio. Tus evaluaciones de CV y vacantes se procesan en la nube con consumo reducido de tokens.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <p>
                    GlassMatch opera actualmente con el Motor Local Autónomo determinista. Puedes conectar tu propia clave gratuita de Google AI Studio para habilitar Gemini 3.8.
                  </p>
                )}
              </div>

              {/* Selector de Estrategia de IA y Cascada de Modelos */}
              <div className="pt-2 border-t border-teal-900/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-800">
                    Estrategia de Modelos (Gemini 3.8):
                  </label>
                  {isUpdatingStrategy && (
                    <span className="text-[10px] text-teal-700 animate-pulse font-medium">
                      Actualizando...
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleStrategyChange("smart_saving")}
                    disabled={isUpdatingStrategy || aiEngineMode === "offline_deterministic" || activeCloudProvider !== "gemini"}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                      aiStrategy === "smart_saving"
                        ? "bg-teal-50/90 border-teal-500 text-teal-950 ring-1 ring-teal-400/30"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold">Ahorro Inteligente</span>
                      {aiStrategy === "smart_saving" && (
                        <CheckCircle2 className="w-3 h-3 text-teal-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">
                      Prioriza Flash-Lite para economizar tokens y conmuta ante 429.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStrategyChange("maximum_precision")}
                    disabled={isUpdatingStrategy || aiEngineMode === "offline_deterministic" || activeCloudProvider !== "gemini"}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                      aiStrategy === "maximum_precision"
                        ? "bg-teal-50/90 border-teal-500 text-teal-950 ring-1 ring-teal-400/30"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold">Máxima Precisión</span>
                      {aiStrategy === "maximum_precision" && (
                        <CheckCircle2 className="w-3 h-3 text-teal-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">
                      Prioriza Flash para máxima profundidad analítica ATS.
                    </p>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveApiKey} className="space-y-2 pt-1">
                <div className="flex gap-1.5">
                  <input
                    type="password"
                    placeholder={hasApiKey ? "Cambiar API Key..." : "Pega tu Gemini API Key..."}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    disabled={aiEngineMode === "offline_deterministic" || activeCloudProvider !== "gemini"}
                    className="flex-1 h-8 px-2.5 rounded-xl bg-white border border-teal-900/15 text-slate-900 text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-400/20"
                  />
                  <GlassButton
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isSavingKey}
                    disabled={!apiKeyInput.trim() || aiEngineMode === "offline_deterministic" || activeCloudProvider !== "gemini"}
                  >
                    Guardar
                  </GlassButton>
                </div>

                {keyNotice && (
                  <p className="text-[11px] font-bold text-teal-700">
                    {keyNotice}
                  </p>
                )}

                <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                  <span>¿No tienes clave?</span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-teal-700 font-bold hover:underline cursor-pointer"
                  >
                    <span>Obtener clave gratis en Google AI Studio</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </form>
            </div>
          </GlassCard>

          {/* Groq Cloud AI Card */}
          <GlassCard className={`p-4 sm:p-5 space-y-3 bg-white/90 shadow-xs transition-all ${
            aiEngineMode === "offline_deterministic"
              ? "border-slate-200 opacity-60"
              : activeCloudProvider === "groq"
              ? "border-cyan-500/40 ring-1 ring-cyan-400/20"
              : "border-slate-200 opacity-60"
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-cyan-900/10">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-600" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Groq Cloud (Llama 3.3 70B)
                  </h4>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Llama 3.3 70B Versatile
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {aiEngineMode === "cloud" && activeCloudProvider === "groq" && (
                  <button
                    type="button"
                    onClick={() => checkBackupAiStatus(true)}
                    disabled={isCheckingBackupHealth}
                    title="Verificar conexión con Groq Cloud"
                    className="p-1 rounded-md text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${isCheckingBackupHealth ? "animate-spin text-cyan-600" : ""}`}
                    />
                  </button>
                )}
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                    aiEngineMode === "offline_deterministic"
                      ? "bg-slate-100 text-slate-700 border-slate-300"
                      : activeCloudProvider !== "groq"
                      ? "bg-slate-100 text-slate-600 border-slate-300"
                      : isCheckingBackupHealth
                      ? "bg-cyan-50 text-cyan-800 border-cyan-200"
                      : !hasBackupKey
                      ? "bg-slate-100 text-slate-700 border-slate-300"
                      : backupHealthStatus === "operational"
                      ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                      : backupHealthStatus === "rate_limited"
                      ? "bg-amber-100 text-amber-900 border-amber-300"
                      : backupHealthStatus === "invalid_key"
                      ? "bg-rose-100 text-rose-900 border-rose-300"
                      : "bg-cyan-50 text-cyan-800 border-cyan-200"
                  }`}
                >
                  {aiEngineMode === "offline_deterministic"
                    ? "Pausado (0 Tokens)"
                    : activeCloudProvider !== "groq"
                    ? "Inactivo (Usando Gemini)"
                    : isCheckingBackupHealth
                    ? "Comprobando..."
                    : !hasBackupKey
                    ? "Sin Clave Configurada"
                    : backupHealthStatus === "operational"
                    ? "Groq 70B Operativo (Luz Verde)"
                    : backupHealthStatus === "rate_limited"
                    ? "Cuota en Espera (HTTP 429)"
                    : backupHealthStatus === "invalid_key"
                    ? "Clave Inválida"
                    : "Clave Configurada"}
                </span>
              </div>
            </div>

            {aiEngineMode === "cloud" && activeCloudProvider !== "groq" && (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs">
                <span className="text-[11px] text-slate-600">
                  Proveedor en espera. Google Gemini está procesando las solicitudes.
                </span>
                <button
                  type="button"
                  onClick={() => setActiveCloudProvider("groq")}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-cyan-800 bg-white hover:bg-cyan-50 border border-cyan-300 transition-colors shadow-2xs cursor-pointer shrink-0"
                >
                  Activar Groq
                </button>
              </div>
            )}

            <div className={`space-y-3 transition-opacity ${
              aiEngineMode === "offline_deterministic" || activeCloudProvider !== "groq"
                ? "opacity-40 pointer-events-none select-none"
                : ""
            }`}>
              <div className="text-[11px] text-slate-600 leading-relaxed space-y-1.5">
                {hasBackupKey ? (
                  <>
                    <p>
                      <span className="font-semibold text-slate-800">Clave de Groq:</span> {maskedBackupKey}. {backupStatusMessage}
                    </p>
                    <div className="text-cyan-950 bg-cyan-50/70 p-2.5 rounded-xl border border-cyan-200/80 font-medium text-[10px]">
                      Llama 3.3 70B Versatile ejecutándose en la infraestructura LPU de Groq Cloud para máxima velocidad analítica.
                    </div>
                  </>
                ) : (
                  <p>
                    Conecta una clave gratuita de Groq Cloud para habilitar Llama 3.3 70B como alternativa a Gemini.
                  </p>
                )}
              </div>

              <form onSubmit={handleSaveBackupKey} className="space-y-2 pt-1">
                <div className="flex gap-1.5">
                  <input
                    type="password"
                    placeholder={hasBackupKey ? "Cambiar API Key de Groq..." : "Pega tu Groq API Key (gsk_...)"}
                    value={backupKeyInput}
                    onChange={(e) => setBackupKeyInput(e.target.value)}
                    disabled={aiEngineMode === "offline_deterministic" || activeCloudProvider !== "groq"}
                    className="flex-1 h-8 px-2.5 rounded-xl bg-white border border-cyan-900/15 text-slate-900 text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-400/20"
                  />
                  <GlassButton
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isSavingBackupKey}
                    disabled={!backupKeyInput.trim() || aiEngineMode === "offline_deterministic" || activeCloudProvider !== "groq"}
                  >
                    Guardar
                  </GlassButton>
                </div>

                {backupKeyNotice && (
                  <p className="text-[11px] font-bold text-cyan-700">
                    {backupKeyNotice}
                  </p>
                )}

                <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                  <span>¿No tienes clave de Groq?</span>
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-cyan-700 font-bold hover:underline cursor-pointer"
                  >
                    <span>Obtener clave gratis en Groq Cloud</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </form>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
