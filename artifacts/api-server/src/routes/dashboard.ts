import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

let cachedStats: any = null;
let lastStatsFetched = 0;
const STATS_CACHE_TTL_MS = 10000; // 10 seconds

router.get("/dashboard/stats", requireAuth, async (req, res): Promise<void> => {
  try {
    const now = Date.now();
    if (cachedStats && (now - lastStatsFetched < STATS_CACHE_TTL_MS)) {
      res.json(cachedStats);
      return;
    }

    const [csResult, qResult] = await Promise.all([
      supabase.from("case_studies").select("id, sector, client_name, created_at", { count: "exact" }),
      supabase.from("questionnaire_projects").select("id, name, company_name, sector, created_at", { count: "exact" }),
    ]);

    if (csResult.error) {
      req.log.error({ err: csResult.error }, "Failed to fetch case studies");
      res.status(500).json({ error: "Database error" });
      return;
    }

    if (qResult.error) {
      req.log.error({ err: qResult.error }, "Failed to fetch questionnaires");
      res.status(500).json({ error: "Database error" });
      return;
    }

    const caseStudies = csResult.data ?? [];
    const questionnaires = (qResult.data ?? []).map((q) => ({
      id: q.id,
      client_name: q.company_name || q.name,
      sector: q.sector,
      created_at: q.created_at
    }));

    // Get unique sectors from case studies
    const sectors = new Set(caseStudies.map((cs) => cs.sector));
    const sectorsCount = sectors.size;

    // Find the most recent item's date
    const allDates = [
      ...caseStudies.map((cs) => cs.created_at),
      ...questionnaires.map((q) => q.created_at),
    ].filter(Boolean);
    allDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    const lastUpdated = allDates[0] ?? null;

    // Build recent activity feed (last 5 items combined, sorted by date)
    const csActivity = caseStudies.map((cs) => ({
      type: "case_study",
      id: cs.id,
      title: cs.client_name,
      sector: cs.sector,
      createdAt: cs.created_at,
    }));
    const qActivity = questionnaires.map((q) => ({
      type: "questionnaire",
      id: q.id,
      title: q.client_name,
      sector: q.sector,
      createdAt: q.created_at,
    }));
    const recentActivity = [...csActivity, ...qActivity]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    // Compute sector breakdown percentages
    const sectorCounts: Record<string, number> = {};
    let totalSectors = 0;
    caseStudies.forEach((cs) => {
      if (cs.sector) {
        sectorCounts[cs.sector] = (sectorCounts[cs.sector] || 0) + 1;
        totalSectors++;
      }
    });

    const sectorBreakdown = Object.entries(sectorCounts).map(([name, count]) => ({
      name,
      value: totalSectors > 0 ? Math.round((count / totalSectors) * 100) : 0,
    })).sort((a, b) => b.value - a.value);

    cachedStats = {
      totalCaseStudies: csResult.count ?? caseStudies.length,
      totalQuestionnaires: qResult.count ?? questionnaires.length,
      sectorsCount,
      lastUpdated,
      recentActivity,
      sectorBreakdown,
    };
    lastStatsFetched = now;

    res.json(cachedStats);
  } catch (err) {
    req.log.error({ err }, "Dashboard stats error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
