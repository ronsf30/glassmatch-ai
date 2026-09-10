import { DatabaseSync } from "node:sqlite";
import path from "path";
import fs from "fs";
import { JobOffer, UserProfile, ApplicationStatus } from "@/types";

// Ensure prisma directory exists
const dbDir = path.join(process.cwd(), "prisma");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "dev.db");
export const db = new DatabaseSync(dbPath);

// Configuración de concurrencia e integridad referencial
db.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 5000;
  PRAGMA synchronous = NORMAL;
`);

// Tabla de configuración dinámica en caliente
db.exec(`
  CREATE TABLE IF NOT EXISTS AppConfig (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );
`);

// Initialize schema tables according to prisma/schema.prisma
db.exec(`
  CREATE TABLE IF NOT EXISTS UserProfile (
    id TEXT PRIMARY KEY,
    fullName TEXT NOT NULL,
    currentTitle TEXT NOT NULL,
    seniority TEXT NOT NULL,
    rawCvText TEXT,
    cvFileName TEXT,
    extractedSkills TEXT NOT NULL,
    excludedSkills TEXT,
    visaStatus TEXT,
    targetRoles TEXT NOT NULL,
    workModes TEXT NOT NULL,
    minSalary REAL,
    preferredLocs TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS JobOffer (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT NOT NULL,
    workMode TEXT NOT NULL,
    url TEXT NOT NULL,
    salaryText TEXT,
    description TEXT NOT NULL,
    source TEXT NOT NULL,
    publishedAt TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS JobMatch (
    id TEXT PRIMARY KEY,
    jobOfferId TEXT UNIQUE NOT NULL,
    matchScore INTEGER NOT NULL,
    isMatch INTEGER DEFAULT 1,
    killSwitchTriggered TEXT,
    reason TEXT,
    executiveSummary TEXT NOT NULL,
    strengths TEXT NOT NULL,
    missingSkills TEXT NOT NULL,
    interviewAdvice TEXT NOT NULL,
    generatedPitch TEXT,
    languageRequirement TEXT,
    analyzedAt TEXT NOT NULL,
    FOREIGN KEY(jobOfferId) REFERENCES JobOffer(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS ApplicationTracker (
    id TEXT PRIMARY KEY,
    jobOfferId TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL,
    appliedDate TEXT,
    personalNotes TEXT,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY(jobOfferId) REFERENCES JobOffer(id) ON DELETE CASCADE
  );
`);

try {
  db.exec("ALTER TABLE UserProfile ADD COLUMN excludedSkills TEXT;");
} catch {}
try {
  db.exec("ALTER TABLE UserProfile ADD COLUMN visaStatus TEXT;");
} catch {}
try {
  db.exec("ALTER TABLE UserProfile ADD COLUMN cvFileName TEXT;");
} catch {}
try {
  db.exec("ALTER TABLE UserProfile ADD COLUMN languages TEXT;");
} catch {}
try {
  db.exec("ALTER TABLE UserProfile ADD COLUMN blacklistCompanies TEXT;");
} catch {}
try {
  db.exec("ALTER TABLE JobMatch ADD COLUMN isMatch INTEGER DEFAULT 1;");
} catch {}
try {
  db.exec("ALTER TABLE JobMatch ADD COLUMN killSwitchTriggered TEXT;");
} catch {}
try {
  db.exec("ALTER TABLE JobMatch ADD COLUMN reason TEXT;");
} catch {}
try {
  db.exec("ALTER TABLE JobMatch ADD COLUMN languageRequirement TEXT;");
} catch {}

/**
 * Seed initial candidate profile and jobs if SQLite database is empty or update profile fields
 */
function checkAndSeedDatabase() {
  const defaultExcludedSkills = [
    "C#",
    "ASP.NET",
    ".NET",
    "Java Enterprise",
    "Spring Boot",
    "Soporte IT / Help Desk",
    "Redes / Hardware",
    "Arquitectura Civil",
    "DevOps pesado",
  ];
  const defaultVisaStatus =
    "Sin visado de trabajo foráneo (Solo modalidad Contractor / Remoto Internacional B2B)";

  const existingProfile = db
    .prepare("SELECT * FROM UserProfile WHERE id = 'user-1'")
    .get() as any;

  if (!existingProfile) {
    const profileInsert = db.prepare(`
      INSERT OR REPLACE INTO UserProfile (
        id, fullName, currentTitle, seniority, rawCvText, extractedSkills,
        excludedSkills, visaStatus,
        targetRoles, workModes, minSalary, preferredLocs, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    profileInsert.run(
      "user-1",
      "Ronald José Sarmiento Flores",
      "Frontend Developer & UI/UX Designer",
      "Junior",
      "Fundador, Product Designer & Desarrollador Frontend en Yegoo. Dominio de Vanilla JS, Tailwind CSS, SPA, SEO Técnico, Figma, Photoshop y marketing digital.",
      JSON.stringify([
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
      ]),
      JSON.stringify(defaultExcludedSkills),
      defaultVisaStatus,
      JSON.stringify([
        "Frontend Developer",
        "UI/UX & Web Designer",
        "Junior Web Developer",
        "Product Designer",
      ]),
      JSON.stringify(["remote", "hybrid"]),
      24000,
      JSON.stringify(["Remoto (Global)", "LATAM", "España"]),
      new Date().toISOString()
    );
    db.prepare(`
      UPDATE UserProfile 
      SET excludedSkills = ?, visaStatus = ?
      WHERE id = 'user-1'
    `).run(
      existingProfile.excludedSkills || JSON.stringify(defaultExcludedSkills),
      existingProfile.visaStatus || defaultVisaStatus
    );
  }

  // Purge any jobs that were discarded by ATS kill switches
  try {
    db.exec(`
      DELETE FROM JobOffer WHERE id IN (
        SELECT jobOfferId FROM JobMatch WHERE matchScore = 0 OR isMatch = 0 OR killSwitchTriggered IS NOT NULL
      );
      DELETE FROM JobMatch WHERE matchScore = 0 OR isMatch = 0 OR killSwitchTriggered IS NOT NULL;
      DELETE FROM ApplicationTracker WHERE jobOfferId NOT IN (SELECT id FROM JobOffer);
    `);
  } catch {}
}

// Run check
try {
  checkAndSeedDatabase();
} catch (e) {
  console.warn("Error seeding database:", e);
}

/**
 * Save or update full job offer with match and tracking into SQLite
 */
export function saveJobToDb(job: JobOffer) {
  // If the job is discarded by ATS or has 0% score, do not save it
  if (
    job.match &&
    (job.match.isMatch === false ||
      job.match.matchScore === 0 ||
      Boolean(job.match.killSwitchTriggered))
  ) {
    return;
  }

  // Verificar si ya existe una vacante con la misma URL o la misma combinación (empresa + título)
  const cleanUrl = (job.url || "").split("?")[0].toLowerCase().trim();
  const existingJob = db
    .prepare(`
      SELECT id FROM JobOffer 
      WHERE (url = ? AND url NOT LIKE '%/jobs/search%')
         OR (LOWER(TRIM(company)) = LOWER(TRIM(?)) AND LOWER(TRIM(title)) = LOWER(TRIM(?)))
      LIMIT 1
    `)
    .get(cleanUrl, job.company, job.title) as { id: string } | undefined;

  const targetJobId = existingJob ? existingJob.id : job.id;

  const insertJob = db.prepare(`
    INSERT OR REPLACE INTO JobOffer (
      id, title, company, location, workMode, url, salaryText, description, source, publishedAt, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertJob.run(
    targetJobId,
    job.title,
    job.company,
    job.location,
    job.workMode,
    job.url,
    job.salaryText || null,
    job.description,
    job.source,
    job.publishedAt || null,
    job.createdAt
  );

  if (job.match) {
    const existingMatch = db
      .prepare(`SELECT id FROM JobMatch WHERE jobOfferId = ? LIMIT 1`)
      .get(targetJobId) as { id: string } | undefined;
    const targetMatchId = existingMatch ? existingMatch.id : (job.match.id || `match-${targetJobId}`);

    const insertMatch = db.prepare(`
      INSERT OR REPLACE INTO JobMatch (
        id, jobOfferId, matchScore, isMatch, killSwitchTriggered, reason,
        executiveSummary, strengths, missingSkills, interviewAdvice,
        generatedPitch, languageRequirement, analyzedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertMatch.run(
      targetMatchId,
      targetJobId,
      job.match.matchScore,
      job.match.isMatch === false ? 0 : 1,
      job.match.killSwitchTriggered || null,
      job.match.reason || null,
      job.match.executiveSummary,
      JSON.stringify(job.match.strengths || []),
      JSON.stringify(job.match.missingSkills || []),
      job.match.interviewAdvice,
      job.match.generatedPitch || null,
      job.match.languageRequirement || "Spanish",
      job.match.analyzedAt
    );
  }
}

/**
 * Update tracker status and notes in SQLite
 */
export function updateTrackerInDb(
  jobOfferId: string,
  status: ApplicationStatus,
  dateStr?: string,
  notes?: string
) {
  const trackerId = `track-${jobOfferId}`;
  const now = new Date().toISOString();
  const date = dateStr || new Date().toLocaleDateString("es-ES", { day: "numeric", month: "short" });

  const existing = db
    .prepare("SELECT * FROM ApplicationTracker WHERE jobOfferId = ?")
    .get(jobOfferId) as any;

  const currentNotes = notes !== undefined ? notes : (existing?.personalNotes || null);

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO ApplicationTracker (
      id, jobOfferId, status, appliedDate, personalNotes, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(trackerId, jobOfferId, status, date, currentNotes, now);
}

/**
 * Get all jobs joined with Match and Tracker from SQLite
 */
export function getAllJobsFromDb(): JobOffer[] {
  const jobRows = db
    .prepare(`
      SELECT JobOffer.* FROM JobOffer
      LEFT JOIN JobMatch ON JobOffer.id = JobMatch.jobOfferId
      WHERE (JobMatch.isMatch IS NULL OR JobMatch.isMatch != 0)
        AND (JobMatch.matchScore IS NULL OR JobMatch.matchScore > 0)
        AND (JobMatch.killSwitchTriggered IS NULL)
      GROUP BY LOWER(TRIM(JobOffer.company)), LOWER(TRIM(JobOffer.title))
      ORDER BY JobOffer.rowid DESC
    `)
    .all() as any[];

  return jobRows.map((row) => {
    const matchRow = db
      .prepare("SELECT * FROM JobMatch WHERE jobOfferId = ?")
      .get(row.id) as any;

    const trackRow = db
      .prepare("SELECT * FROM ApplicationTracker WHERE jobOfferId = ?")
      .get(row.id) as any;

    let match = undefined;
    if (matchRow) {
      match = {
        id: matchRow.id,
        jobOfferId: matchRow.jobOfferId,
        matchScore: matchRow.matchScore,
        isMatch: matchRow.isMatch !== 0,
        killSwitchTriggered: matchRow.killSwitchTriggered || null,
        reason: matchRow.reason || "",
        executiveSummary: matchRow.executiveSummary,
        strengths: JSON.parse(matchRow.strengths || "[]"),
        missingSkills: JSON.parse(matchRow.missingSkills || "[]"),
        interviewAdvice: matchRow.interviewAdvice,
        generatedPitch: matchRow.generatedPitch,
        languageRequirement: matchRow.languageRequirement || "Spanish",
        analyzedAt: matchRow.analyzedAt,
      };
    }

    let tracking = undefined;
    if (trackRow) {
      tracking = {
        id: trackRow.id,
        jobOfferId: trackRow.jobOfferId,
        status: trackRow.status as ApplicationStatus,
        appliedDate: trackRow.appliedDate,
        personalNotes: trackRow.personalNotes,
        updatedAt: trackRow.updatedAt,
      };
    }

    return {
      id: row.id,
      title: row.title,
      company: row.company,
      location: row.location,
      workMode: row.workMode,
      url: row.url,
      salaryText: row.salaryText,
      description: row.description,
      source: row.source,
      publishedAt: row.publishedAt,
      createdAt: row.createdAt,
      match,
      tracking,
    };
  });
}

/**
 * Get Profile from SQLite
 */
export function getProfileFromDb(): UserProfile | null {
  const row = db.prepare("SELECT * FROM UserProfile LIMIT 1").get() as any;
  if (!row) return null;

  return {
    id: row.id,
    fullName: row.fullName,
    currentTitle: row.currentTitle,
    seniority: row.seniority,
    rawCvText: row.rawCvText,
    cvFileName: row.cvFileName || null,
    extractedSkills: JSON.parse(row.extractedSkills || "[]"),
    excludedSkills: JSON.parse(row.excludedSkills || "[]"),
    visaStatus: row.visaStatus || "Sin visado de trabajo foráneo (Solo modalidad Contractor / Remoto Internacional B2B)",
    targetRoles: JSON.parse(row.targetRoles || "[]"),
    workModes: JSON.parse(row.workModes || "[]"),
    minSalary: row.minSalary,
    preferredLocs: JSON.parse(row.preferredLocs || "[]"),
    languages: JSON.parse(row.languages || "[]"),
    blacklistCompanies: JSON.parse(row.blacklistCompanies || "[]"),
    updatedAt: row.updatedAt,
  };
}

/**
 * Save Profile to SQLite
 */
export function saveProfileToDb(profile: UserProfile) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO UserProfile (
      id, fullName, currentTitle, seniority, rawCvText, cvFileName, extractedSkills,
      excludedSkills, visaStatus,
      targetRoles, workModes, minSalary, preferredLocs, languages, blacklistCompanies, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    profile.id,
    profile.fullName,
    profile.currentTitle,
    profile.seniority,
    profile.rawCvText || null,
    profile.cvFileName || null,
    JSON.stringify(profile.extractedSkills || []),
    JSON.stringify(profile.excludedSkills || []),
    profile.visaStatus || null,
    JSON.stringify(profile.targetRoles || []),
    JSON.stringify(profile.workModes || []),
    profile.minSalary || null,
    JSON.stringify(profile.preferredLocs || []),
    JSON.stringify(profile.languages || []),
    JSON.stringify(profile.blacklistCompanies || []),
    new Date().toISOString()
  );
}

/**
 * Delete a specific job from SQLite
 */
export function deleteJobFromDb(jobId: string) {
  db.prepare("DELETE FROM JobOffer WHERE id = ?").run(jobId);
  db.prepare("DELETE FROM JobMatch WHERE jobOfferId = ?").run(jobId);
  db.prepare("DELETE FROM ApplicationTracker WHERE jobOfferId = ?").run(jobId);
}

/**
 * Clear all jobs from SQLite
 */
export function clearAllJobsFromDb() {
  db.exec("DELETE FROM JobOffer; DELETE FROM JobMatch; DELETE FROM ApplicationTracker;");
}
