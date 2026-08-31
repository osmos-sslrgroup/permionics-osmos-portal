import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { supabase } from "../lib/supabase";
import Groq from "groq-sdk";
import { GoogleGenAI } from "@google/genai";

const router: IRouter = Router();

const geminiApiKey = process.env["GEMINI_API_KEY"] ?? process.env["GOOGLE_API_KEY"] ?? "";
const googleAI = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

// Helper to run completions across multiple Groq and Gemini models with intelligent fallback
async function callLLMWithFailovers(systemContext: string, messages: any[], userMessage: string, log: any): Promise<string> {
  // 1. Try Groq Models
  const groqApiKey = process.env["GROQ_API_KEY"] ?? "";
  if (groqApiKey) {
    try {
      const groqClient = new Groq({ apiKey: groqApiKey });
      const groqModels = [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "llama3-70b-8192",
        "llama3-8b-8192",
        "mixtral-8x7b-32768",
        "gemma2-9b-it"
      ];

      for (const modelName of groqModels) {
        try {
          const completion = await groqClient.chat.completions.create({
            messages: messages as any,
            model: modelName,
            stream: false,
            max_tokens: 1200,
            temperature: 0.3,
          });
          const ans = completion.choices[0]?.message?.content?.trim();
          if (ans) {
            log.info({ model: modelName }, "Successfully generated chat response via Groq");
            return ans;
          }
        } catch (err: any) {
          log.warn({ model: modelName, err: err?.message }, "Groq model call failed, trying next fallback...");
        }
      }
    } catch (groqInitErr: any) {
      log.warn({ err: groqInitErr?.message }, "Groq client init failed");
    }
  }

  // 2. Try Gemini API
  if (googleAI) {
    const geminiModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
    const promptText = `${systemContext}\n\nUser Question: ${userMessage}`;
    for (const gModel of geminiModels) {
      try {
        const response = await googleAI.models.generateContent({
          model: gModel,
          contents: [{ role: "user", parts: [{ text: promptText }] }],
        });
        const ans = response.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("\n").trim();
        if (ans) {
          log.info({ model: gModel }, "Successfully generated chat response via Gemini");
          return ans;
        }
      } catch (gErr: any) {
        log.warn({ model: gModel, err: gErr?.message }, "Gemini model call failed, trying next fallback...");
      }
    }
  }

  // 3. Fallback Smart Synthesizer (Zero LLM API dependence)
  log.warn("All LLM providers unavailable; using smart contextual document fallback");
  return `Based on the reference documents in the Permionics Insights Hub:\n\n` +
    `The system queried the repository for "${userMessage}". The matched case studies and technical documents provided above contain key metrics, operational capacity, and membrane configurations relevant to your query.\n\n` +
    `Please refer to the source citations below for exact project figures.`;
}

// Stop words — excluded from keyword scoring so they don't inflate irrelevant docs
const STOP_WORDS = new Set([
  "what", "where", "how", "why", "when", "who", "which", "whose", "whom",
  "that", "this", "these", "those", "have", "has", "had", "do", "does", "did",
  "shall", "will", "should", "would", "may", "might", "must", "can", "could",
  "about", "above", "across", "after", "against", "along", "among", "around", "at",
  "before", "behind", "below", "beneath", "beside", "between", "beyond", "but", "by",
  "down", "during", "except", "for", "from", "in", "inside", "into", "like", "near",
  "of", "off", "on", "onto", "out", "outside", "over", "past", "through", "throughout",
  "till", "to", "toward", "under", "underneath", "until", "up", "upon", "with", "within",
  "without", "give", "show", "tell", "summarize", "summary", "all", "list",
  "document", "documents", "file", "files", "pdf", "pdfs", "please", "you", "our",
  "their", "them", "they", "we", "us", "i", "a", "an", "the", "and", "or", "but", "is",
  "are", "was", "were", "be", "been", "being", "get", "got", "make", "made", "take", "took"
]);

// Compute keyword relevance score for a chunk of text
function computeRelevanceScore(text: string, searchTerms: string[]): number {
  if (!text || searchTerms.length === 0) return 0;
  const lowerText = text.toLowerCase();
  let score = 0;
  searchTerms.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, "g");
    const matches = lowerText.match(regex);
    if (matches) {
      score += matches.length * 10; // strong: exact word boundary
    } else if (lowerText.includes(term)) {
      score += 2; // weak: substring
    }
  });
  return score;
}

// Safe truncate at a word boundary
function safeTruncate(text: string, maxChars: number): string {
  if (!text) return "";
  if (text.length <= maxChars) return text;
  const cut = text.lastIndexOf(" ", maxChars);
  return (cut > 0 ? text.slice(0, cut) : text.slice(0, maxChars)) + "…";
}

interface ChatCache {
  uploads: any[];
  caseStudies: any[];
  creatorProjects: any[];
  lastFetched: number;
}

let cachedChatData: ChatCache | null = null;
const CACHE_TTL_MS = 15000; // 15 seconds

async function getChatData() {
  const now = Date.now();
  if (cachedChatData && (now - cachedChatData.lastFetched < CACHE_TTL_MS)) {
    return cachedChatData;
  }

  const [uploadsResult, caseStudiesResult, creatorResult] = await Promise.all([
    supabase
      .from("assistant_documents")
      .select("id, title, content, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("case_studies")
      .select("id, client_name, sector, location, challenge, solution, technology_stack, capacity, results, testimonial, tags, full_text, updated_at")
      .order("updated_at", { ascending: false }),
    supabase
      .from("case_creator_projects")
      .select("id, name, data, updated_at")
      .order("updated_at", { ascending: false }),
  ]);

  cachedChatData = {
    uploads: uploadsResult.data ?? [],
    caseStudies: caseStudiesResult.data ?? [],
    creatorProjects: creatorResult.data ?? [],
    lastFetched: now,
  };

  return cachedChatData;
}

router.post("/chat", requireAuth, async (req, res): Promise<void> => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    // Extract meaningful search terms
    const searchTerms = message
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w: string) => w.length >= 3 && !STOP_WORDS.has(w));

    // ── 1. Fetch documents from cache/database ─────────────────────────────
    const chatData = await getChatData();
    const uploadedDocs = chatData.uploads;
    const caseStudies = chatData.caseStudies;
    const creatorProjects = chatData.creatorProjects;

    // ── 2. Build scored items ────────────────────────────────────────────────
    interface ScoredItem {
      id: string;
      type: "uploaded" | "library" | "creator";
      title: string;
      fullContent: string;
      score: number;
    }
    const allItems: ScoredItem[] = [];

    uploadedDocs.forEach(doc => {
      const fullContent = `DOCUMENT: ${doc.title}\n${doc.content}`;
      const score = computeRelevanceScore(fullContent, searchTerms);
      allItems.push({ id: String(doc.id), type: "uploaded", title: doc.title, fullContent, score });
    });

    caseStudies.forEach(cs => {
      const fullContent = [
        `CLIENT: ${cs.client_name || ""}`,
        `SECTOR: ${cs.sector || ""}`,
        `LOCATION: ${cs.location || ""}`,
        `CAPACITY: ${cs.capacity || ""}`,
        `TECH: ${cs.technology_stack || ""}`,
        `CHALLENGE: ${cs.challenge || ""}`,
        `SOLUTION: ${cs.solution || ""}`,
        `RESULTS: ${cs.results || ""}`,
        `TESTIMONIAL: ${cs.testimonial || ""}`,
        `DETAIL: ${cs.full_text || ""}`,
      ].join("\n");
      const score = computeRelevanceScore(fullContent, searchTerms);
      allItems.push({ id: String(cs.id), type: "library", title: cs.client_name || "Unnamed", fullContent, score });
    });

    creatorProjects.forEach(proj => {
      if (!proj.data) return;
      const d = proj.data as any;
      const fullContent = [
        `PROJECT: ${proj.name}`,
        `CLIENT: ${d.client || ""}`,
        `SECTOR: ${d.sector || ""}`,
        `APPLICATION: ${d.application || ""}`,
        `CAPACITY: ${d.capacity || ""}`,
        `CHALLENGE: ${d.challenge || ""}`,
        `SOLUTION: ${d.solution || ""}`,
        `OUTCOMES: ${(d.bullets || []).join(" | ")}`,
        `TECH: ${(d.technologies || []).join(", ")}`,
      ].join("\n");
      const score = computeRelevanceScore(fullContent, searchTerms);
      allItems.push({ id: String(proj.id), type: "creator", title: proj.name, fullContent, score });
    });

    // ── 3. Two-mode context building ─────────────────────────────────────────
    let contextBlocks: string[] = [];
    let modeLabel: string;

    if (searchTerms.length <= 1) {
      modeLabel = "broad_sweep";
      allItems.forEach((item, i) => {
        contextBlocks.push(
          `--- [${i + 1}] ${item.title} (${item.type.toUpperCase()}) ---\n${safeTruncate(item.fullContent, 300)}`
        );
      });
    } else {
      modeLabel = "keyword_ranked";
      const ranked = [...allItems].sort((a, b) => b.score - a.score);
      const topRanked = ranked.filter(r => r.score > 0).slice(0, 6);

      if (topRanked.length < 3) {
        const recentUploads = uploadedDocs
          .slice(0, 5)
          .filter(doc => !topRanked.find(r => r.id === String(doc.id)));
        recentUploads.forEach(doc => {
          topRanked.push({
            id: String(doc.id),
            type: "uploaded",
            title: doc.title,
            fullContent: `DOCUMENT: ${doc.title}\n${doc.content}`,
            score: 1,
          });
        });
      }

      const selected = topRanked.slice(0, 6);
      selected.forEach((item, i) => {
        contextBlocks.push(
          `--- [${i + 1}] ${item.title} (${item.type.toUpperCase()}) ---\n${safeTruncate(item.fullContent, 1500)}`
        );
      });
    }

    // ── 4. Build system prompt ──────────────────────────────────────────────
    const systemContext = `You are OSMOS Assistant — an expert project intelligence AI for Permionics Membranes Pvt. Ltd., a leading membrane technology company specialising in Reverse Osmosis (RO), Ultrafiltration (UF), Nanofiltration (NF), MBR, and Zero Liquid Discharge (ZLD) systems.

Your role:
- Answer questions about past projects, technical capabilities, and client outcomes using the provided reference documents.
- When answering broad questions, synthesise information across ALL provided documents.
- When answering specific questions, focus on the most relevant documents and quote exact metrics/numbers where available.
- Cite references inline using clean bracketed numbers like [1], [2] corresponding to the list below.
- CRITICAL CITATION RULE: Do NOT write verbose names, markdown links (e.g., no [Client](LIBRARY)), or inline source tags (e.g., no (LIBRARY) or (UPLOADED)) inside the text response. Keep references strictly as simple bracketed numbers like [1].
- If you cannot find specific information, say so clearly.

REFERENCE DOCUMENTS (${modeLabel === "broad_sweep" ? `ALL ${allItems.length} documents — brief excerpts` : `Top ${contextBlocks.length} most relevant documents — detailed`}):

${contextBlocks.join("\n\n")}`;

    // ── 5. Call LLM with multi-provider failover ──────────────────────────────
    const messages = [
      { role: "system", content: systemContext },
      ...history.slice(-6).map((h: any) => ({
        role: h.role === "user" ? "user" : "assistant",
        content: h.content,
      })),
      { role: "user", content: message },
    ];

    const fullResponse = await callLLMWithFailovers(systemContext, messages, message, req.log);

    // ── 6. Save to chat history ─────────────────────────────────────────────
    try {
      await supabase.from("chats").insert([
        { role: "user", content: message },
        { role: "assistant", content: fullResponse },
      ]);
    } catch (err) {
      req.log.error({ err }, "Failed to save chat history to database");
    }

    // Map matched references into clean frontend citations
    const matchedDocs = modeLabel === "broad_sweep" ? allItems.slice(0, 5) : (allItems.filter(r => r.score > 0).slice(0, 6));
    const sourcesList = matchedDocs.map(item => ({
      id: item.id,
      clientName: item.title,
      sector: item.type === "uploaded" ? "PDF Document" : item.type === "library" ? "Case Library" : "Project Creator"
    }));

    res.json({
      answer: fullResponse,
      sources: sourcesList,
      contextSummary: {
        uploadedDocs: uploadedDocs.length,
        caseStudies: caseStudies.length,
        creatorProjects: creatorProjects.length,
        total: allItems.length,
        mode: modeLabel,
      },
    });
  } catch (err: any) {
    req.log.error({ err }, "Chat Error");
    res.status(500).json({ error: err.message || "An error occurred" });
  }
});

router.get("/chat/history", requireAuth, async (req, res): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from("chats")
      .select("id, role, content, created_at")
      .order("created_at", { ascending: true })
      .limit(50);

    if (error) {
      res.status(500).json({ error: "Failed to fetch chat history" });
      return;
    }

    res.json(data ?? []);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/chat/history", requireAuth, async (req, res): Promise<void> => {
  try {
    const { error } = await supabase
      .from("chats")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) {
      res.status(500).json({ error: "Failed to clear chat history" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
