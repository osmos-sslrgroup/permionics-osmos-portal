import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { supabase } from "../lib/db";
import { debugLog } from "../lib/modes";

const router: IRouter = Router();

export interface TechnicalOfferRow {
  id: number | string;
  enquiry_date: string;
  client_name: string;
  segment: string;
  enquiry_owner: string;
  proposal_owner: string;
  system: string;
  capacity: string;
  offer_number: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function mapOfferRow(row: any) {
  return {
    id: Number(row.id),
    enquiryDate: row.enquiry_date || "",
    clientName: row.client_name || "",
    segment: row.segment || "",
    enquiryOwner: row.enquiry_owner || "",
    proposalOwner: row.proposal_owner || "",
    system: row.system || "",
    capacity: row.capacity || "",
    offerNumber: row.offer_number || "",
    status: row.status || "Submitted",
    notes: row.notes ?? null,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

// ─── 1. LIST TECHNICAL OFFERS ───────────────────────────────────────────────
router.get("/technical-offers", requireAuth, async (req, res): Promise<void> => {
  try {
    const { search, segment, system, status } = req.query as {
      search?: string;
      segment?: string;
      system?: string;
      status?: string;
    };

    debugLog("API_REQ", "GET /technical-offers", { search, segment, system, status });

    let dbQuery = supabase.from("technical_offers").select("*");

    if (segment && segment !== "all") {
      dbQuery = dbQuery.ilike("segment", `%${segment}%`);
    }

    if (system && system !== "all") {
      dbQuery = dbQuery.ilike("system", `%${system}%`);
    }

    if (status && status !== "all") {
      dbQuery = dbQuery.eq("status", status);
    }

    dbQuery = dbQuery.order("id", { ascending: false });

    const { data, error } = await dbQuery;

    if (error) {
      req.log.error({ err: error }, "Failed to fetch technical offers");
      res.status(500).json({ error: "Database error" });
      return;
    }

    let results = (data ?? []).map(mapOfferRow);

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      results = results.filter((item: any) =>
        item.offerNumber.toLowerCase().includes(q) ||
        item.clientName.toLowerCase().includes(q) ||
        item.segment.toLowerCase().includes(q) ||
        item.system.toLowerCase().includes(q) ||
        item.enquiryOwner.toLowerCase().includes(q) ||
        item.proposalOwner.toLowerCase().includes(q) ||
        item.capacity.toLowerCase().includes(q) ||
        (item.notes && item.notes.toLowerCase().includes(q))
      );
    }

    res.json(results);
  } catch (err) {
    req.log.error({ err }, "GET /technical-offers unhandled error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── 2. GET SINGLE TECHNICAL OFFER ──────────────────────────────────────────
router.get("/technical-offers/:id", requireAuth, async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      res.status(400).json({ error: "Invalid offer ID" });
      return;
    }

    const { data, error } = await supabase
      .from("technical_offers")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      res.status(404).json({ error: "Technical offer not found" });
      return;
    }

    res.json(mapOfferRow(data));
  } catch (err) {
    req.log.error({ err }, "GET /technical-offers/:id unhandled error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── 3. CREATE TECHNICAL OFFER ──────────────────────────────────────────────
router.post("/technical-offers", requireRole(["admin", "operator"]), async (req, res): Promise<void> => {
  try {
    const body = req.body as {
      enquiryDate?: string;
      clientName?: string;
      segment?: string;
      enquiryOwner?: string;
      proposalOwner?: string;
      system?: string;
      capacity?: string;
      offerNumber?: string;
      status?: string;
      notes?: string;
    };

    if (!body.clientName || !body.clientName.trim()) {
      res.status(400).json({ error: "clientName is required" });
      return;
    }

    if (!body.segment || !body.segment.trim()) {
      res.status(400).json({ error: "segment is required" });
      return;
    }

    if (!body.offerNumber || !body.offerNumber.trim()) {
      res.status(400).json({ error: "offerNumber is required" });
      return;
    }

    const cleanOfferNumber = body.offerNumber.trim();

    // Check for duplicate offer number
    const { data: existing } = await supabase
      .from("technical_offers")
      .select("id")
      .eq("offer_number", cleanOfferNumber);

    if (existing && existing.length > 0) {
      res.status(409).json({ error: `Offer number '${cleanOfferNumber}' already exists` });
      return;
    }

    const newOffer = {
      enquiry_date: (body.enquiryDate || "").trim(),
      client_name: body.clientName.trim(),
      segment: body.segment.trim(),
      enquiry_owner: (body.enquiryOwner || "").trim(),
      proposal_owner: (body.proposalOwner || "").trim(),
      system: (body.system || "").trim(),
      capacity: (body.capacity || "").trim(),
      offer_number: cleanOfferNumber,
      status: (body.status || "Submitted").trim(),
      notes: (body.notes || "").trim(),
    };

    const { data, error } = await supabase
      .from("technical_offers")
      .insert(newOffer)
      .select()
      .single();

    if (error) {
      req.log.error({ err: error }, "Failed to insert technical offer");
      res.status(500).json({ error: "Failed to create technical offer" });
      return;
    }

    res.status(201).json(mapOfferRow(data));
  } catch (err) {
    req.log.error({ err }, "POST /technical-offers unhandled error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── 4. UPDATE TECHNICAL OFFER ──────────────────────────────────────────────
router.put("/technical-offers/:id", requireRole(["admin", "operator"]), async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      res.status(400).json({ error: "Invalid offer ID" });
      return;
    }

    const body = req.body as {
      enquiryDate?: string;
      clientName?: string;
      segment?: string;
      enquiryOwner?: string;
      proposalOwner?: string;
      system?: string;
      capacity?: string;
      offerNumber?: string;
      status?: string;
      notes?: string;
    };

    const updatePayload: Record<string, any> = {};
    if (body.enquiryDate !== undefined) updatePayload.enquiry_date = body.enquiryDate.trim();
    if (body.clientName !== undefined) updatePayload.client_name = body.clientName.trim();
    if (body.segment !== undefined) updatePayload.segment = body.segment.trim();
    if (body.enquiryOwner !== undefined) updatePayload.enquiry_owner = body.enquiryOwner.trim();
    if (body.proposalOwner !== undefined) updatePayload.proposal_owner = body.proposalOwner.trim();
    if (body.system !== undefined) updatePayload.system = body.system.trim();
    if (body.capacity !== undefined) updatePayload.capacity = body.capacity.trim();
    if (body.offerNumber !== undefined) updatePayload.offer_number = body.offerNumber.trim();
    if (body.status !== undefined) updatePayload.status = body.status.trim();
    if (body.notes !== undefined) updatePayload.notes = body.notes.trim();

    const { data, error } = await supabase
      .from("technical_offers")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      req.log.error({ err: error }, "Failed to update technical offer");
      res.status(500).json({ error: "Failed to update technical offer" });
      return;
    }

    res.json(mapOfferRow(data));
  } catch (err) {
    req.log.error({ err }, "PUT /technical-offers/:id unhandled error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── 5. DELETE TECHNICAL OFFER ──────────────────────────────────────────────
router.delete("/technical-offers/:id", requireRole(["admin", "operator"]), async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      res.status(400).json({ error: "Invalid offer ID" });
      return;
    }

    const { error } = await supabase
      .from("technical_offers")
      .delete()
      .eq("id", id);

    if (error) {
      req.log.error({ err: error }, "Failed to delete technical offer");
      res.status(500).json({ error: "Failed to delete technical offer" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "DELETE /technical-offers/:id unhandled error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── 6. BATCH IMPORT TECHNICAL OFFERS ───────────────────────────────────────
router.post("/technical-offers/batch", requireRole(["admin", "operator"]), async (req, res): Promise<void> => {
  try {
    const { offers } = req.body as { offers?: any[] };

    if (!Array.isArray(offers) || offers.length === 0) {
      res.status(400).json({ error: "offers array is required and must not be empty" });
      return;
    }

    let inserted = 0;
    const errors: string[] = [];

    for (let i = 0; i < offers.length; i++) {
      const item = offers[i];
      const clientName = (item.clientName || item["Client Name"] || "").toString().trim();
      const segment = (item.segment || item["Segment"] || "").toString().trim();
      const offerNumber = (item.offerNumber || item["Offer Number"] || "").toString().trim();

      if (!clientName || !segment || !offerNumber) {
        errors.push(`Row ${i + 1}: Missing required fields (clientName, segment, or offerNumber)`);
        continue;
      }

      const row = {
        enquiry_date: (item.enquiryDate || item["Enquiry Date"] || "").toString().trim(),
        client_name: clientName,
        segment: segment,
        enquiry_owner: (item.enquiryOwner || item["Enquiry Owner"] || "").toString().trim(),
        proposal_owner: (item.proposalOwner || item["Proposal Owner"] || "").toString().trim(),
        system: (item.system || item["System"] || "").toString().trim(),
        capacity: (item.capacity || item["Capacity"] || item["Capacity "] || "").toString().trim(),
        offer_number: offerNumber,
        status: (item.status || item["Status"] || "Submitted").toString().trim(),
        notes: (item.notes || item["Notes"] || "").toString().trim(),
      };

      try {
        const { error } = await supabase.from("technical_offers").upsert(row, { onConflict: "offer_number" });
        if (error) {
          errors.push(`Row ${i + 1} (${offerNumber}): ${error.message || "Insert failed"}`);
        } else {
          inserted++;
        }
      } catch (err: any) {
        errors.push(`Row ${i + 1} (${offerNumber}): ${err.message || "Failed"}`);
      }
    }

    res.json({
      inserted,
      count: offers.length,
      errors,
    });
  } catch (err) {
    req.log.error({ err }, "POST /technical-offers/batch unhandled error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
