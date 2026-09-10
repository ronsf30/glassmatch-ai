import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getLiveJobUrl(job: {
  url?: string;
  title: string;
  company: string;
  source?: string;
}): string {
  if (
    job.url &&
    !job.url.includes("mock") &&
    !job.url.includes("live-") &&
    job.url.startsWith("http")
  ) {
    return job.url;
  }

  const cleanRole = job.title
    .replace(/[\/&\\|]+/g, " ")
    .replace(/\b(webmaster|desarrollador|designer|engineer)\b/gi, (m) => m)
    .trim()
    .split(/\s{2,}/)[0] || "Frontend Developer";

  const firstTerm = cleanRole.split(" ").slice(0, 3).join(" ");
  const q = encodeURIComponent(firstTerm);

  if (job.source?.toLowerCase().includes("indeed")) {
    return `https://www.indeed.com/jobs?q=${q}&l=Remote`;
  }
  return `https://www.linkedin.com/jobs/search/?keywords=${q}&f_WT=2`;
}

export function sanitizeJobDescription(rawHtmlOrText: string): string {
  if (!rawHtmlOrText) return "";

  return rawHtmlOrText
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim();
}

/**
 * Normalizes company name removing corporate suffixes and punctuation.
 */
export function normalizeCompany(company: string): string {
  if (!company) return "";
  return company
    .toLowerCase()
    .replace(/\b(inc|llc|ltd|gmbh|corp|corporation|technologies|technology|solutions|labs|group|holdings|s\.a\.|s\.l\.|co)\b/gi, "")
    .replace(/[^\w\s]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalizes job title stripping modalities, location tags, and bracketed noise.
 */
export function normalizeJobTitle(title: string): string {
  if (!title) return "";
  return title
    .toLowerCase()
    .replace(/\b(100% remote|remote|remoto|hybrid|hibrido|onsite|on-site|full-time|part-time|tiempo completo|urgente|jobs|vacante)\b/gi, "")
    .replace(/\(.*?\)/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/[-|/\\–—].*$/, "")
    .replace(/[^\w\s]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Generates a canonical fingerprint for job deduplication.
 */
export function getJobFingerprint(company: string, title: string): string {
  const normComp = normalizeCompany(company);
  const normTitle = normalizeJobTitle(title);
  return `${normComp}__${normTitle}`;
}

export interface ParsedSalary {
  raw: string;
  minAnnual: number;
  maxAnnual: number;
  period: "year" | "month" | "hour";
  currency: string;
}

/**
 * Parses salary text into annualized numeric bounds (USD / year).
 */
export function parseSalary(salaryText?: string): ParsedSalary | null {
  if (!salaryText || typeof salaryText !== "string") return null;
  const text = salaryText.trim();
  if (!text || text.length < 2) return null;

  const isHourly = /\b(hr|hour|hora|\/h)\b/i.test(text);
  const isMonthly = /\b(mo|month|mes|\/m)\b/i.test(text);
  const period: "year" | "month" | "hour" = isHourly ? "hour" : isMonthly ? "month" : "year";

  const matches = [...text.matchAll(/(?:[\$€£]?)\s*(\d+(?:[.,]\d+)?)\s*(k|mil)?/gi)];
  if (matches.length === 0) return null;

  const numbers: number[] = [];
  for (const match of matches) {
    let num = parseFloat(match[1].replace(/,/g, ""));
    if (isNaN(num)) continue;
    if (match[2] && (match[2].toLowerCase() === "k" || match[2].toLowerCase() === "mil")) {
      num *= 1000;
    }
    if (num < 200 && period === "year") {
      num *= 1000;
    }
    numbers.push(num);
  }

  if (numbers.length === 0) return null;

  const minVal = Math.min(...numbers);
  const maxVal = Math.max(...numbers);

  let minAnnual = minVal;
  let maxAnnual = maxVal;
  if (period === "hour") {
    minAnnual = Math.round(minVal * 2000);
    maxAnnual = Math.round(maxVal * 2000);
  } else if (period === "month") {
    minAnnual = Math.round(minVal * 12);
    maxAnnual = Math.round(maxVal * 12);
  }

  return {
    raw: text,
    minAnnual,
    maxAnnual,
    period,
    currency: "USD",
  };
}

/**
 * Progressive salary check: Ensures offers equal to or exceeding minimum expected salary are approved.
 */
export function meetsProgressiveSalaryExpectation(
  jobSalaryText: string | undefined,
  minExpectedSalary: number,
  includeUndisclosed = true
): { meets: boolean; parsed: ParsedSalary | null; isUndisclosed: boolean; diff: number } {
  const parsed = parseSalary(jobSalaryText);
  if (!parsed) {
    return {
      meets: includeUndisclosed,
      parsed: null,
      isUndisclosed: true,
      diff: 0,
    };
  }

  const meets = parsed.maxAnnual >= minExpectedSalary;
  const diff = parsed.maxAnnual - minExpectedSalary;

  return {
    meets,
    parsed,
    isUndisclosed: false,
    diff,
  };
}

