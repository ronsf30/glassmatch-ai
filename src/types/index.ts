export type WorkMode = "remote" | "hybrid" | "onsite";

export type ApplicationStatus =
  | "discovered"
  | "saved"
  | "applied"
  | "interviewing"
  | "offered"
  | "rejected";

export type LanguageLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "Native";

export interface LanguageProficiency {
  language: string;
  level: LanguageLevel;
  preference?: "async_preferred" | "live_fluent";
}

export type JobLanguageRequirement = "Spanish" | "English B1/B2" | "English C1/C2";

export interface JobOffer {
  id: string;
  title: string;
  company: string;
  location: string;
  workMode: WorkMode;
  url: string;
  salaryText?: string;
  minAnnualSalary?: number;
  maxAnnualSalary?: number;
  description: string;
  source: "LinkedIn" | "Indeed" | "Glassdoor" | "Manual" | "ZipRecruiter" | "Remotive" | "Jobicy" | "Arbeitnow";
  publishedAt?: string;
  createdAt: string;
  match?: JobMatch;
  tracking?: ApplicationTracker;
}

export interface JobMatch {
  id: string;
  jobOfferId: string;
  matchScore: number; // 0 to 100
  isMatch?: boolean;
  killSwitchTriggered?: string | null;
  reason?: string;
  executiveSummary: string;
  strengths: string[];
  missingSkills: string[];
  interviewAdvice: string;
  generatedPitch?: string;
  languageRequirement?: JobLanguageRequirement;
  isLiveAi?: boolean;
  aiProvider?: "gemini" | "groq" | "offline_deterministic";
  analyzedAt: string;
}

export interface ApplicationTracker {
  id: string;
  jobOfferId: string;
  status: ApplicationStatus;
  appliedDate?: string;
  personalNotes?: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  currentTitle: string;
  seniority: "Junior" | "Mid" | "Senior" | "Lead" | "Principal";
  rawCvText?: string;
  cvFileName?: string;
  extractedSkills: string[];
  excludedSkills?: string[];
  visaStatus?: string;
  targetRoles: string[];
  workModes: WorkMode[];
  minSalary?: number;
  preferredLocs: string[];
  languages?: LanguageProficiency[];
  blacklistCompanies?: string[];
  engineUsed?: string;
  engineLabel?: string;
  updatedAt: string;
}

export interface InterviewQuestion {
  id: number;
  question: string;
  focus: string;
  modelAnswer: string;
}

export type ActiveTab = "radar" | "pipeline" | "profile" | "analytics";

export interface EvaluationResult {
  isMatch: boolean;
  matchScore: number;
  killSwitchTriggered: string | null;
  reason: string;
}
