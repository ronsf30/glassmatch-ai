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

