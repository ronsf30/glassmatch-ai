import { NextRequest, NextResponse } from "next/server";
import { analyzeJobMatchWithGemini, runDeterministicKillSwitches } from "@/lib/gemini";
import { saveJobToDb, getProfileFromDb, db } from "@/lib/db";
import { sanitizeJobDescription } from "@/lib/utils";
import { JobOffer, UserProfile } from "@/types";

const sleepWithJitter = (minMs: number, maxMs: number) =>
  new Promise((res) =>
    setTimeout(
      res,
      Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs
    )
  );


async function fetchLinkedInJobDescription(jobUrl: string): Promise<string | null> {
  try {
    const jobIdMatch = jobUrl.match(/-(\d{8,12})$/) || jobUrl.match(/\/(\d{8,12})/);
    if (!jobIdMatch) return null;
    const jobId = jobIdMatch[1];
    const url = `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const descMatch = html.match(/class="show-more-less-html__markup[^"]*">([\s\S]*?)<\/div>/);
    if (descMatch) {
      return descMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 3500);
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchLinkedInGuestJobs(keyword: string, location: string, limit: number): Promise<Partial<JobOffer>[]> {
  try {
    const isRemote = location.toLowerCase().includes("remot");
    const remoteParam = isRemote ? "&f_WT=2" : "";
    const cleanKw = encodeURIComponent(keyword.trim());
    const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${cleanKw}${remoteParam}&start=0`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!res.ok) return [];
    const html = await res.text();

    const cards = html.split("<li");
    const jobs: Partial<JobOffer>[] = [];

    for (const card of cards) {
      if (jobs.length >= limit) break;

      const titleMatch = card.match(/class="base-search-card__title">([^<]+)<\/h3>/);
      const companyMatch =
        card.match(/class="base-search-card__subtitle">[\s\S]*?<a[^>]*>([^<]+)<\/a>/) ||
        card.match(/class="base-search-card__subtitle">([^<]+)<\/h4>/);
      const urlMatch = card.match(/href="(https:\/\/[a-z]+\.linkedin\.com\/jobs\/view\/[^"?]+)/);
      const locationMatch = card.match(/class="job-search-card__location">([^<]+)<\/span>/);

      if (titleMatch && urlMatch) {
        const rawTitle = titleMatch[1].trim();
        if (rawTitle.includes("{[") || rawTitle.length < 3) continue;

        const rawUrl = urlMatch[1].trim();
        const realDesc = await fetchLinkedInJobDescription(rawUrl);
        const idMatch = rawUrl.match(/(?:view\/|currentJobId=)(\d{6,})/) || rawUrl.match(/-(\d{6,})(?:\/|\?|$)/);
        const companyName = companyMatch ? companyMatch[1].trim() : "Empresa en LinkedIn";
        const deterministicId = idMatch
          ? `li-${idMatch[1]}`
          : `li-${Buffer.from(`${companyName}-${rawTitle}`).toString("hex").slice(0, 16)}`;

        jobs.push({
          id: deterministicId,
          title: rawTitle,
          company: companyName,
          location: locationMatch ? locationMatch[1].trim() : "Remoto",
          workMode: isRemote ? "remote" : "hybrid",
          url: rawUrl,
          source: "LinkedIn",
          description: realDesc || `Oportunidad verificada en LinkedIn para ${rawTitle}. Se requieren competencias demostradas en desarrollo y buenas prácticas.`,
          createdAt: "Publicado recientemente en LinkedIn",
        });
      }
    }
    return jobs;
  } catch (e) {
    console.warn("Aviso en consulta de LinkedIn:", e);
    return [];
  }
}

async function fetchRemotiveJobs(keyword: string, limit: number): Promise<Partial<JobOffer>[]> {
  try {
    const cleanKw = encodeURIComponent(keyword.trim().split(" ")[0] || "frontend");
    const url = `https://remotive.com/api/remote-jobs?search=${cleanKw}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return [];

    const data = await res.json();
    const items = data.jobs || [];
    const jobs: Partial<JobOffer>[] = [];

    const techKeywords = ["frontend", "front-end", "developer", "designer", "ui", "ux", "web", "software", "react", "javascript", "engineer", "css", "html"];

    for (const item of items) {
      if (jobs.length >= limit) break;

      const titleLower = (item.title || "").toLowerCase();
      const catLower = (item.category || "").toLowerCase();
      const isTech = techKeywords.some((k) => titleLower.includes(k) || catLower.includes(k));
      if (!isTech) continue;

      jobs.push({
        id: `remotive-${item.id}`,
        title: item.title,
        company: item.company_name || "Compañía Internacional",
        location: item.candidate_required_location || "Remoto (Global)",
        workMode: "remote",
        url: item.url,
        salaryText: item.salary || undefined,
        source: "Remotive",
        description: item.description
          ? item.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 3000)
          : `Vacante remota internacional verificada para ${item.title}.`,
        createdAt: "Publicado recientemente",
      });
    }
    return jobs;
  } catch (e) {
    console.warn("Aviso en consulta de Remotive:", e);
    return [];
  }
}

async function fetchJobicyJobs(keyword: string, limit: number): Promise<Partial<JobOffer>[]> {
  try {
    const cleanKw = keyword.toLowerCase().trim();
    const url = `https://jobicy.com/api/v2/remote-jobs?count=25`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return [];

    const data = await res.json();
    const items = data.jobs || [];
    const jobs: Partial<JobOffer>[] = [];

    const kwTokens = cleanKw.split(/\s+/);

    for (const item of items) {
      if (jobs.length >= limit) break;

      const titleLower = (item.jobTitle || "").toLowerCase();
      const descLower = (item.jobDescription || "").toLowerCase();

      const matchesKeyword = kwTokens.some((t) => titleLower.includes(t) || descLower.includes(t));
      if (!matchesKeyword) continue;

      const cleanDesc = (item.jobDescription || "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      jobs.push({
        id: `jobicy-${item.id}`,
        title: item.jobTitle,
        company: item.companyName || "Compañía Global",
        location: item.jobGeo ? `Remoto (${item.jobGeo})` : "Remoto (Global)",
        workMode: "remote",
        url: item.url,
        salaryText: item.annualSalaryMin ? `$${item.annualSalaryMin} - $${item.annualSalaryMax} ${item.salaryCurrency || "USD"}` : undefined,
        source: "Jobicy",
        description: cleanDesc.slice(0, 3000),
        createdAt: "Publicado recientemente en Jobicy",
      });
    }
    return jobs;
  } catch (e) {
    console.warn("Aviso en consulta de Jobicy:", e);
    return [];
  }
}

async function fetchArbeitnowJobs(keyword: string, limit: number): Promise<Partial<JobOffer>[]> {
  try {
    const cleanKw = keyword.toLowerCase().trim();
    const url = `https://www.arbeitnow.com/api/job-board-api`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return [];

    const data = await res.json();
    const items = data.data || [];
    const jobs: Partial<JobOffer>[] = [];

    const kwTokens = cleanKw.split(/\s+/);

    for (const item of items) {
      if (jobs.length >= limit) break;
      if (!item.remote) continue;

      const titleLower = (item.title || "").toLowerCase();
      const descLower = (item.description || "").toLowerCase();

      const matchesKeyword = kwTokens.some((t) => titleLower.includes(t) || descLower.includes(t));
      if (!matchesKeyword) continue;

      const cleanDesc = (item.description || "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      const stableId = item.slug
        ? `arbeitnow-${item.slug}`
        : `arbeitnow-${Buffer.from(`${item.company_name}-${item.title}`).toString("hex").slice(0, 16)}`;

      jobs.push({
        id: stableId,
        title: item.title,
        company: item.company_name || "Compañía Tecnológica",
        location: item.location ? `Remoto (${item.location})` : "Remoto (Internacional)",
        workMode: "remote",
        url: item.url,
        source: "Arbeitnow",
        description: cleanDesc.slice(0, 3000),
        createdAt: "Publicado en Arbeitnow",
      });
    }
    return jobs;
  } catch (e) {
    console.warn("Aviso en consulta de Arbeitnow:", e);
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      profile,
      searchTerm = "Frontend Developer",
      location = "Remoto (Global)",
      resultsWanted = 5,
      existingJobIds = [],
    } = body as {
      profile?: UserProfile;
      searchTerm?: string;
      location?: string;
      resultsWanted?: number;
      existingJobIds?: string[];
    };

    const activeProfile: UserProfile = profile || getProfileFromDb() || {
      id: "usr-default",
      fullName: "Ronald José Sarmiento Flores",
      currentTitle: "Frontend Developer & UI/UX Designer",
      seniority: "Junior",
      extractedSkills: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Figma", "UI/UX Design", "JavaScript"],
      targetRoles: ["Frontend Developer", "UI/UX Designer", "Web Developer"],
      workModes: ["remote"],
      preferredLocs: ["Remoto (Global)", "LATAM", "España"],
      minSalary: 24000,
      updatedAt: new Date().toISOString(),
    };

    const cleanTerm = searchTerm
      .replace(/[\/&\\|]+/g, " ")
      .trim()
      .split(/\s{2,}/)[0] || "Frontend Developer";

    const [linkedInJobs, remotiveJobs, jobicyJobs, arbeitnowJobs] = await Promise.all([
      fetchLinkedInGuestJobs(cleanTerm, location, Math.ceil(resultsWanted * 0.4)),
      fetchRemotiveJobs(cleanTerm, Math.ceil(resultsWanted * 0.3)),
      fetchJobicyJobs(cleanTerm, Math.ceil(resultsWanted * 0.3)),
      fetchArbeitnowJobs(cleanTerm, Math.ceil(resultsWanted * 0.3)),
    ]);

    let combined = [...linkedInJobs, ...remotiveJobs, ...jobicyJobs, ...arbeitnowJobs];

    if (combined.length === 0) {
      const fallbackList = await fetchLinkedInGuestJobs("Frontend", location, resultsWanted);
      combined = fallbackList;
    }

    const forbiddenTitles = [
      "service desk",
      "help desk",
      "helpdesk",
      "soporte técnico",
      "technical support",
      "network engineer",
      "sysadmin",
      "telecom",
      "cableado",
      "sales representative",
      "account executive",
      "call center",
    ];

    // Deduplicación estricta contra base de datos local y lote actual
    const existingDbRows = db
      .prepare(
        "SELECT url, LOWER(company) as comp, LOWER(title) as tit, id FROM JobOffer"
      )
      .all() as any[];
    const existingDbUrls = new Set(
      existingDbRows
        .map((r) => (r.url || "").split("?")[0].toLowerCase().trim())
        .filter(Boolean)
    );
    const existingDbKeys = new Set(
      existingDbRows.map((r) => `${r.comp}:::${r.tit}`)
    );
    const existingDbIds = new Set(existingDbRows.map((r) => r.id));

    const seenFingerprints = new Set<string>();
    const uniqueRaw: Partial<JobOffer>[] = [];

    for (const j of combined) {
      if (uniqueRaw.length >= resultsWanted) break;
      if (!j.url || !j.title || !j.company) continue;

      const titleL = j.title.toLowerCase().trim();
      const companyL = j.company.toLowerCase().trim();
      if (forbiddenTitles.some((f) => titleL.includes(f))) continue;

      const fp = `${companyL}:::${titleL}`;
      const urlClean = j.url.split("?")[0].toLowerCase().trim();

      // Descartar si ya fue visto en este lote
      if (seenFingerprints.has(fp) || seenFingerprints.has(urlClean)) continue;
      seenFingerprints.add(fp);
      seenFingerprints.add(urlClean);

      // Descartar si ya existe en la base de datos o en la sesión activa
      if (existingJobIds.includes(j.id || "") || existingDbIds.has(j.id || "")) {
        continue;
      }
      if (existingDbUrls.has(urlClean) || existingDbKeys.has(fp)) {
        continue;
      }

      uniqueRaw.push(j);
    }

    const evaluatedJobs: JobOffer[] = [];

    for (let idx = 0; idx < uniqueRaw.length; idx++) {
      const rawJob = uniqueRaw[idx];
      const title = rawJob.title || cleanTerm;
      const company = rawJob.company || "Empresa Tecnológica";
      const rawDesc = rawJob.description || `Puesto de ${title} en ${company}`;

      // 1. Sanitizar el HTML de inmediato
      const cleanDesc = sanitizeJobDescription(rawDesc);
      const jobCandidate = {
        title,
        company,
        description: cleanDesc,
        location: rawJob.location || location,
      };

      // 2. Pre-filtro local: Descarte determinista en 0 ms y con 0 tokens consumidos
      const localVerdict = runDeterministicKillSwitches(
        jobCandidate,
        activeProfile
      );
      if (localVerdict && !localVerdict.isMatch) {
        continue; // Descarte silencioso (no se guarda en SQLite ni se gastan tokens)
      }

      // 3. Si supera el filtro base, procesar con analyzeJobMatchWithGemini
      const geminiResult = await analyzeJobMatchWithGemini(
        activeProfile,
        cleanDesc,
        title,
        company
      );

      // Si la vacante no hace match o dispara un Kill Switch, se descarta por completo
      if (
        geminiResult.isMatch === false ||
        geminiResult.matchScore === 0 ||
        Boolean(geminiResult.killSwitchTriggered)
      ) {
        continue;
      }

      const fullJob: JobOffer = {
        id: rawJob.id || `live-${Date.now()}-${idx}`,
        title: title,
        company: company,
        location: rawJob.location || location,
        workMode: rawJob.workMode || "remote",
        url: rawJob.url || `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(title)}&f_WT=2`,
        salaryText: rawJob.salaryText,
        description: cleanDesc,
        source: (rawJob.source as any) || "LinkedIn",
        createdAt: rawJob.createdAt || "Publicado recientemente",
        match: {
          id: `match-${Date.now()}-${idx}`,
          jobOfferId: rawJob.id || `live-${Date.now()}-${idx}`,
          matchScore: geminiResult.matchScore,
          isMatch: geminiResult.isMatch,
          killSwitchTriggered: geminiResult.killSwitchTriggered,
          reason: geminiResult.reason,
          executiveSummary: geminiResult.executiveSummary,
          strengths: geminiResult.strengths,
          missingSkills: geminiResult.missingSkills,
          interviewAdvice: geminiResult.interviewAdvice,
          generatedPitch: geminiResult.generatedPitch,
          languageRequirement: geminiResult.languageRequirement || "English B1/B2",
          analyzedAt: new Date().toISOString(),
        },
      };

      evaluatedJobs.push(fullJob);

      // 4. Pausa preventiva con jitter (1.2 a 2.5 seg) para proteger la IP contra soft-bans
      if (idx < uniqueRaw.length - 1) {
        await sleepWithJitter(1200, 2500);
      }
    }

    evaluatedJobs.forEach((job) => {
      try {
        saveJobToDb(job);
      } catch (e) {
        console.warn("Aviso guardando vacante en SQLite:", e);
      }
    });

    return NextResponse.json({
      success: true,
      count: evaluatedJobs.length,
      jobs: evaluatedJobs,
    });
  } catch (error: any) {
    console.error("Error en POST /api/sync:", error);
    return NextResponse.json(
      { error: "Error al sincronizar vacantes en vivo.", details: error?.message },
      { status: 500 }
    );
  }
}
