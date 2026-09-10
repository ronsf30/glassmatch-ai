"use client";

import React, { useState } from "react";
import { AppProvider, useApp } from "@/context/AppContext";
import { GlassHeader } from "@/components/layout/GlassHeader";
import { MatchRadarPreview } from "@/components/modules/MatchRadarPreview";
import { GlassPipelinePreview } from "@/components/modules/GlassPipelinePreview";
import { ProfileStudioPreview } from "@/components/modules/ProfileStudioPreview";
import { JobInspectorDrawer } from "@/components/modules/JobInspectorDrawer";
import { QuickAddModal } from "@/components/modules/QuickAddModal";
import { SyncJobsModal } from "@/components/modules/SyncJobsModal";
import { TutorialModal } from "@/components/modules/TutorialModal";
import { ActiveTab, JobOffer } from "@/types";
import { Sparkles, Cloud, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function GlassMatchApp() {
  const { updateJobStatus, toastMessage, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<ActiveTab>("radar");
  const [selectedJob, setSelectedJob] = useState<JobOffer | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [syncInitialQuery, setSyncInitialQuery] = useState("");
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  const handleOpenSync = (query?: string) => {
    setSyncInitialQuery(query || "");
    setIsSyncOpen(true);
  };

  const handleSelectJob = (job: JobOffer) => {
    setSelectedJob(job);
    setIsInspectorOpen(true);
  };

  const handleTrackJob = (jobId: string) => {
    updateJobStatus(jobId, "applied");
    showToast("Movido a la columna 'Postuladas' en el Glass Pipeline");
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Floating Glass Navigation */}
      <GlassHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onQuickAdd={() => setIsQuickAddOpen(true)}
        onOpenSync={() => handleOpenSync()}
        onOpenTutorial={() => setIsTutorialOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          {activeTab === "radar" && (
            <motion.div
              key="radar"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <MatchRadarPreview
                onSelectJob={handleSelectJob}
                onTrackJob={handleTrackJob}
                onOpenSync={handleOpenSync}
                onRerollSuccess={(count) =>
                  showToast(`Actualización completada: ${count} nuevas vacantes incorporadas al radar.`)
                }
              />
            </motion.div>
          )}

          {activeTab === "pipeline" && (
            <motion.div
              key="pipeline"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <GlassPipelinePreview onSelectJob={handleSelectJob} />
            </motion.div>
          )}

          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <ProfileStudioPreview />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 border-t border-teal-900/10 text-center text-xs text-slate-500">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-teal-950">GlassMatch AI</span>
            <span>•</span>
            <span className="text-teal-800 font-semibold">Caribbean Sea Glass Edition</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600">
            <span>Standing on Giants:</span>
            <span className="text-teal-900 font-bold">JobSpy Open-Source</span>
            <span>•</span>
            <span className="text-teal-600 font-bold">Gemini Flash AI</span>
            <span>•</span>
            <span className="text-teal-900 font-bold">Next.js 16</span>
          </div>
        </div>
      </footer>

      {/* Side-Drawer Job Inspector */}
      <JobInspectorDrawer
        job={selectedJob}
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        onTrack={handleTrackJob}
      />

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onAddJobSuccess={(title, score) =>
          showToast(`Vacante "${title}" analizada con éxito (${score}% Match)`)
        }
      />

      {/* JobSpy Collector Sync Modal */}
      <SyncJobsModal
        isOpen={isSyncOpen}
        onClose={() => setIsSyncOpen(false)}
        initialQuery={syncInitialQuery}
        onSyncSuccess={(count) =>
          showToast(`Sincronizadas ${count} nuevas ofertas laborales.`)
        }
      />

      {/* Interactive Guided Tour Tutorial Modal */}
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        onGoToTab={(tab) => setActiveTab(tab)}
      />

      {/* Ephemeral Toast Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl backdrop-blur-2xl text-xs font-bold shadow-xl border ${
              toastMessage.includes("Modo Local")
                ? "bg-slate-900/95 text-cyan-200 border-cyan-500/40 shadow-[0_12px_36px_rgba(6,182,212,0.25)]"
                : toastMessage.includes("Modo IA Nube")
                ? "bg-slate-900/95 text-emerald-200 border-emerald-500/40 shadow-[0_12px_36px_rgba(16,185,129,0.25)]"
                : "bg-white/95 text-teal-950 border-teal-500/40 shadow-[0_12px_36px_rgba(13,148,136,0.2)]"
            }`}
          >
            {toastMessage.includes("Modo Local") ? (
              <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
            ) : toastMessage.includes("Modo IA Nube") ? (
              <Cloud className="w-4 h-4 text-emerald-400 animate-pulse" />
            ) : (
              <Sparkles className="w-4 h-4 text-teal-600" />
            )}
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <GlassMatchApp />
    </AppProvider>
  );
}
