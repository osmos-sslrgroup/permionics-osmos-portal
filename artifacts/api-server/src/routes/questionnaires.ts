import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { supabase, type QuestionnaireRow } from "../lib/supabase";

const router: IRouter = Router();

function mapRow(row: QuestionnaireRow) {
  return {
    id: row.id,
    clientName: row.client_name,
    sector: row.sector,
    questions: row.questions ?? [],
    answers: row.answers ?? {},
    notes: row.notes,
    createdAt: row.created_at,
  };
}

router.get("/questionnaires", requireAuth, async (req, res): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from("questionnaires")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      req.log.error({ err: error }, "Failed to list questionnaires");
      res.status(500).json({ error: "Database error" });
      return;
    }

    res.json((data ?? []).map(mapRow));
  } catch (err) {
    req.log.error({ err }, "List questionnaires error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/questionnaires", requireAuth, async (req, res): Promise<void> => {
  try {
    const body = req.body as {
      clientName?: string;
      sector?: string;
      questions?: unknown[];
      answers?: Record<string, string>;
      notes?: string | null;
    };

    if (!body.clientName || !body.sector) {
      res.status(400).json({ error: "clientName and sector are required" });
      return;
    }

    const { data, error } = await supabase
      .from("questionnaires")
      .insert({
        client_name: body.clientName,
        sector: body.sector,
        questions: body.questions ?? [],
        answers: body.answers ?? {},
        notes: body.notes ?? null,
      })
      .select()
      .single();

    if (error) {
      req.log.error({ err: error }, "Failed to create questionnaire");
      res.status(500).json({ error: "Database error" });
      return;
    }

    res.status(201).json(mapRow(data as QuestionnaireRow));
  } catch (err) {
    req.log.error({ err }, "Create questionnaire error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/questionnaires/:id", requireAuth, async (req, res): Promise<void> => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    const { data, error } = await supabase
      .from("questionnaires")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      res.status(404).json({ error: "Questionnaire not found" });
      return;
    }

    res.json(mapRow(data as QuestionnaireRow));
  } catch (err) {
    req.log.error({ err }, "Get questionnaire error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/questionnaires/:id", requireAuth, async (req, res): Promise<void> => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    const { error } = await supabase.from("questionnaires").delete().eq("id", id);

    if (error) {
      req.log.error({ err: error }, "Failed to delete questionnaire");
      res.status(500).json({ error: "Database error" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Delete questionnaire error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
