"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { JobOffer, UserProfile, ApplicationStatus, LanguageProficiency } from "@/types";

interface AppContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;
  addExcludedSkill: (skill: string) => void;
  removeExcludedSkill: (skill: string) => void;
  jobs: JobOffer[];
  jobTracker: Record<string, { status: ApplicationStatus; date: string; notes?: string }>;
  updateJobStatus: (jobId: string, status: ApplicationStatus) => void;
  updateJobNotes: (jobId: string, status: ApplicationStatus, notes: string) => void;
  addNewJob: (job: JobOffer) => void;
  blacklistCompany: (companyName: string) => void;
  rerollJobs: () => Promise<number>;
  isRerolling: boolean;
  cvFileName: string;
  setCvFileName: (name: string) => void;
  isLoadingDb: boolean;
  aiEngineMode: "cloud" | "offline_deterministic";
  toggleAiEngineMode: (mode: "cloud" | "offline_deterministic") => Promise<void>;
}

const INITIAL_PROFILE: UserProfile = {
  id: "user-1",
  fullName: "Ronald José Sarmiento Flores",
  currentTitle: "Frontend Developer & UI/UX Designer",
  seniority: "Junior",
  rawCvText: `Ronald José Sarmiento Flores - Frontend Developer & UI/UX Designer
Fundador, Product Designer & Desarrollador Frontend en Yegoo. Dominio de Vanilla JS, Tailwind CSS, SPA, SEO Técnico, Figma, Photoshop, Illustrator y marketing digital.`,
  extractedSkills: [
    "HTML",
    "CSS",
    "JavaScript",
    "Tailwind CSS",
    "Figma",
    "Adobe Photoshop",
    "Adobe Illustrator",
    "Redacción SEO",
    "Python",
    "SQL",
    "Git",
  ],
  excludedSkills: [
    "C#",
    "ASP.NET",
    ".NET",
    "Java Enterprise",
    "Spring Boot",
    "Soporte IT / Help Desk",
    "Redes / Hardware",
    "Arquitectura Civil",
    "DevOps pesado",
  ],
  visaStatus:
    "Sin visado de trabajo foráneo (Solo modalidad Contractor / Remoto Internacional B2B)",
  targetRoles: [
    "Frontend Developer",
    "UI/UX & Web Designer",
    "Junior Web Developer",
    "Product Designer",
  ],
  workModes: ["remote", "hybrid"],
  minSalary: 24000,
  preferredLocs: ["Remoto (Global)", "LATAM", "España"],
  languages: [
    { language: "Español", level: "Native" },
    { language: "Inglés", level: "B2", preference: "async_preferred" },
  ],
  blacklistCompanies: [],
  updatedAt: new Date().toISOString(),
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [jobTracker, setJobTracker] = useState<
    Record<string, { status: ApplicationStatus; date: string; notes?: string }>
  >({});
  const [cvFileName, setCvFileName] = useState("CV_Ronald_Silva_2026_Master.pdf");
  const [isLoadingDb, setIsLoadingDb] = useState(true);
  const [isRerolling, setIsRerolling] = useState(false);
  const [aiEngineMode, setAiEngineMode] = useState<"cloud" | "offline_deterministic">("cloud");

  // Load state from local SQLite on initial mount
  useEffect(() => {
    async function loadFromSQLite() {
      try {
        const [jobsRes, profileRes, configRes] = await Promise.all([
          fetch("/api/jobs"),
          fetch("/api/profile"),
          fetch("/api/config/gemini?checkHealth=false"),
        ]);

        if (configRes.ok) {
          const configData = await configRes.json();
          if (
            configData.aiEngineMode === "offline_deterministic" ||
            configData.aiEngineMode === "cloud"
          ) {
            setAiEngineMode(configData.aiEngineMode);
          }
        }

        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          if (jobsData.jobs) {
            setJobs(jobsData.jobs);

            const trackerMap: Record<
              string,
              { status: ApplicationStatus; date: string; notes?: string }
            > = {};

            jobsData.jobs.forEach((j: JobOffer) => {
              if (j.tracking) {
                trackerMap[j.id] = {
                  status: j.tracking.status,
                  date: j.tracking.appliedDate || "Reciente",
                  notes: j.tracking.personalNotes || "",
                };
              }
            });

            setJobTracker(trackerMap);
          }
        }

        if (profileRes.ok) {
          const profData = await profileRes.json();
          if (profData.profile) {
            setProfile(profData.profile);
            if (profData.profile.cvFileName) {
              setCvFileName(profData.profile.cvFileName);
            }
          }
        }
      } catch (e) {
        console.warn("Could not load from SQLite API, using defaults:", e);
      } finally {
        setIsLoadingDb(false);
      }
    }

    loadFromSQLite();
  }, []);

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (updates.cvFileName) {
      setCvFileName(updates.cvFileName);
    }
    setProfile((prev) => {
      const updated = {
        ...prev,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: updated }),
      }).catch((e) => console.warn("Error updating profile in SQLite:", e));

      return updated;
    });
  };

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !profile.extractedSkills.includes(trimmed)) {
      updateProfile({
        extractedSkills: [...profile.extractedSkills, trimmed],
      });
    }
  };

  const removeSkill = (skillToRemove: string) => {
    updateProfile({
      extractedSkills: profile.extractedSkills.filter((s) => s !== skillToRemove),
    });
  };

  const addExcludedSkill = (skill: string) => {
    const trimmed = skill.trim();
    const current = profile.excludedSkills || [];
    if (trimmed && !current.includes(trimmed)) {
      updateProfile({
        excludedSkills: [...current, trimmed],
      });
    }
  };

  const removeExcludedSkill = (skillToRemove: string) => {
    const current = profile.excludedSkills || [];
    updateProfile({
      excludedSkills: current.filter((s) => s !== skillToRemove),
    });
  };

  const blacklistCompany = (companyName: string) => {
    const trimmed = companyName.trim();
    if (!trimmed) return;

    const currentList = profile.blacklistCompanies || [];
    if (!currentList.includes(trimmed)) {
      const updatedList = [...currentList, trimmed];
      updateProfile({ blacklistCompanies: updatedList });

      // Filter out of current radar jobs
      setJobs((prev) => prev.filter((j) => j.company.toLowerCase() !== trimmed.toLowerCase()));
    }
  };

  // Instant Reroll: scrapes 10 new jobs in real-time excluding all existing IDs
  const rerollJobs = async (): Promise<number> => {
    setIsRerolling(true);
    try {
      const existingJobIds = jobs.map((j) => j.id);

      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          searchTerm: profile.targetRoles[0] || "Fullstack Engineer",
          location: "Remote",
          resultsWanted: 10,
          sites: ["linkedin", "indeed", "glassdoor"],
          isRemote: true,
          existingJobIds,
        }),
      });

      const data = await res.json();
      const newJobs: JobOffer[] = data.jobs || [];

      // Filter out any blacklisted companies
      const blacklist = profile.blacklistCompanies || [];
      const cleanNewJobs = newJobs.filter(
        (job) => !blacklist.some((b) => b.toLowerCase() === job.company.toLowerCase())
      );

      // Prepend fresh jobs to the top of radar with strict deduplication by URL and (company + title)
      setJobs((prev) => {
        const combined = [...cleanNewJobs, ...prev];
        const seenKeys = new Set<string>();
        return combined.filter((job) => {
          const key = `${job.company.toLowerCase().trim()}:::${job.title.toLowerCase().trim()}`;
          const urlClean = (job.url || "").split("?")[0].toLowerCase().trim();
          if (seenKeys.has(key) || (urlClean && seenKeys.has(urlClean))) {
            return false;
          }
          seenKeys.add(key);
          if (urlClean && !urlClean.includes("/jobs/search")) {
            seenKeys.add(urlClean);
          }
          return true;
        });
      });

      return cleanNewJobs.length;
    } catch (err) {
      console.error("Error during Reroll:", err);
      return 0;
    } finally {
      setIsRerolling(false);
    }
  };

  const updateJobStatus = (jobId: string, status: ApplicationStatus) => {
    const dateStr = new Date().toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    });

    setJobTracker((prev) => ({
      ...prev,
      [jobId]: {
        status,
        date: dateStr,
        notes: prev[jobId]?.notes,
      },
    }));

    setJobs((prev) =>
      prev.map((j) => {
        if (j.id === jobId) {
          return {
            ...j,
            tracking: {
              id: `track-${jobId}`,
              jobOfferId: jobId,
              status,
              appliedDate: dateStr,
              personalNotes: j.tracking?.personalNotes,
              updatedAt: new Date().toISOString(),
            },
          };
        }
        return j;
      })
    );

    fetch(`/api/jobs/${jobId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, appliedDate: dateStr }),
    }).catch((e) => console.warn("Error updating status in SQLite:", e));
  };

  const updateJobNotes = (
    jobId: string,
    status: ApplicationStatus,
    notes: string
  ) => {
    const dateStr = new Date().toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    });

    setJobTracker((prev) => ({
      ...prev,
      [jobId]: {
        status,
        date: prev[jobId]?.date || dateStr,
        notes,
      },
    }));

    setJobs((prev) =>
      prev.map((j) => {
        if (j.id === jobId) {
          return {
            ...j,
            tracking: {
              id: `track-${jobId}`,
              jobOfferId: jobId,
              status,
              appliedDate: j.tracking?.appliedDate || dateStr,
              personalNotes: notes,
              updatedAt: new Date().toISOString(),
            },
          };
        }
        return j;
      })
    );

    fetch(`/api/jobs/${jobId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, notes }),
    }).catch((e) => console.warn("Error saving notes in SQLite:", e));
  };

  const addNewJob = (newJob: JobOffer) => {
    setJobs((prev) => {
      const filtered = prev.filter(
        (j) =>
          j.id !== newJob.id &&
          !(
            j.company.toLowerCase().trim() === newJob.company.toLowerCase().trim() &&
            j.title.toLowerCase().trim() === newJob.title.toLowerCase().trim()
          )
      );
      return [newJob, ...filtered];
    });

    fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job: newJob }),
    }).catch((e) => console.warn("Error adding job to SQLite:", e));
  };

  const toggleAiEngineMode = async (mode: "cloud" | "offline_deterministic") => {
    setAiEngineMode(mode);
    try {
      await fetch("/api/config/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiEngineMode: mode }),
      });
    } catch (e) {
      console.warn("Error persisting aiEngineMode:", e);
    }
  };

  return (
    <AppContext.Provider
      value={{
        profile,
        updateProfile,
        addSkill,
        removeSkill,
        addExcludedSkill,
        removeExcludedSkill,
        jobs,
        jobTracker,
        updateJobStatus,
        updateJobNotes,
        addNewJob,
        blacklistCompany,
        rerollJobs,
        isRerolling,
        cvFileName,
        setCvFileName,
        isLoadingDb,
        aiEngineMode,
        toggleAiEngineMode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
