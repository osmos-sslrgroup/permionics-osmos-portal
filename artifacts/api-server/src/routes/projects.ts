import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

// ── List all projects (summary) ───────────────────────────────────────────────
router.get("/projects", requireAuth, async (req, res): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from("questionnaire_projects")
      .select("id, name, company_name, sector, created_at, updated_at")
      .order("updated_at", { ascending: false });

    if (error) {
      req.log.error({ err: error }, "Failed to list projects");
      res.status(500).json({ error: "Database error" });
      return;
    }

    res.json(
      (data ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        companyName: p.company_name,
        sector: p.sector,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }))
    );
  } catch (err) {
    req.log.error({ err }, "List projects error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Create project ────────────────────────────────────────────────────────────
router.post("/projects", requireAuth, async (req, res): Promise<void> => {
  try {
    const body = req.body as {
      name?: string;
      companyName?: string;
      contactPerson?: string;
      location?: string;
      date?: string;
      sector?: string;
      data?: Record<string, unknown>;
    };

    if (!body.name || !body.sector) {
      res.status(400).json({ error: "name and sector are required" });
      return;
    }

    const { data, error } = await supabase
      .from("questionnaire_projects")
      .insert({
        name: body.name,
        company_name: body.companyName ?? "",
        contact_person: body.contactPerson ?? "",
        location: body.location ?? "",
        date: body.date ?? "",
        sector: body.sector,
        data: body.data ?? {},
      })
      .select()
      .single();

    if (error) {
      req.log.error({ err: error }, "Failed to create project");
      res.status(500).json({ error: "Database error" });
      return;
    }

    res.status(201).json({
      id: data.id,
      name: data.name,
      companyName: data.company_name,
      contactPerson: data.contact_person,
      location: data.location,
      date: data.date,
      sector: data.sector,
      data: data.data,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (err) {
    req.log.error({ err }, "Create project error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Get project by ID ─────────────────────────────────────────────────────────
router.get("/projects/:id", requireAuth, async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    const { data, error } = await supabase
      .from("questionnaire_projects")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    res.json({
      id: data.id,
      name: data.name,
      companyName: data.company_name,
      contactPerson: data.contact_person,
      location: data.location,
      date: data.date,
      sector: data.sector,
      data: data.data,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (err) {
    req.log.error({ err }, "Get project error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Update project ────────────────────────────────────────────────────────────
router.put("/projects/:id", requireAuth, async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    const body = req.body as {
      name?: string;
      companyName?: string;
      contactPerson?: string;
      location?: string;
      date?: string;
      sector?: string;
      data?: Record<string, unknown>;
    };

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (body.name !== undefined) updatePayload.name = body.name;
    if (body.companyName !== undefined) updatePayload.company_name = body.companyName;
    if (body.contactPerson !== undefined) updatePayload.contact_person = body.contactPerson;
    if (body.location !== undefined) updatePayload.location = body.location;
    if (body.date !== undefined) updatePayload.date = body.date;
    if (body.sector !== undefined) updatePayload.sector = body.sector;
    if (body.data !== undefined) updatePayload.data = body.data;

    const { data, error } = await supabase
      .from("questionnaire_projects")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    res.json({
      id: data.id,
      name: data.name,
      companyName: data.company_name,
      contactPerson: data.contact_person,
      location: data.location,
      date: data.date,
      sector: data.sector,
      data: data.data,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (err) {
    req.log.error({ err }, "Update project error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Delete project ────────────────────────────────────────────────────────────
router.delete("/projects/:id", requireAuth, async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    const { error } = await supabase
      .from("questionnaire_projects")
      .delete()
      .eq("id", id);

    if (error) {
      req.log.error({ err: error }, "Failed to delete project");
      res.status(500).json({ error: "Database error" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Delete project error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
