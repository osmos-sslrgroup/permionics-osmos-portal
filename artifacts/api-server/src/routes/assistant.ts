import { Router, type IRouter } from "express";
import multer from "multer";
import { requireAuth } from "../middlewares/requireAuth";
import { supabase } from "../lib/supabase";
import fs from "fs";
import os from "os";
import path from "path";
import { createRequire } from "module";
import { GoogleGenAI } from "@google/genai";

const require = createRequire(import.meta.url);

const router: IRouter = Router();
const upload = multer({ dest: os.tmpdir() });

const geminiKey = process.env["GEMINI_API_KEY"] ?? process.env["GOOGLE_API_KEY"] ?? "";
if (!geminiKey) {
  console.warn("[assistant] WARNING: GEMINI_API_KEY is not set. Gemini OCR fallback will be disabled. Text-based PDFs will still work via pdf-parse.");
}
const ai = new GoogleGenAI({ apiKey: geminiKey || "placeholder" });

// ── Text extraction: try pdf-parse first, then fall back to Gemini Vision OCR ─

async function extractTextWithPdfParse(filePath: string): Promise<string> {
  try {
    const pdfParse = require("pdf-parse");
    const dataBuffer = fs.readFileSync(filePath);
    const result = await pdfParse(dataBuffer);
    return (result.text || "").trim();
  } catch (err) {
    return "";
  }
}

async function extractTextWithGeminiOCR(filePath: string, filename: string): Promise<string> {
  // Send the raw PDF bytes directly to Gemini as an inline blob — works for multi-page PDFs
  // gemini-1.5-flash has higher free-tier rate limits (15 RPM → gemini-2.0-flash has lower limits)
  const pdfBytes = fs.readFileSync(filePath);
  const base64Pdf = pdfBytes.toString("base64");

  const models = ["gemini-1.5-flash", "gemini-2.0-flash"];

  for (const modelName of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: "application/pdf",
                    data: base64Pdf,
                  },
                },
                {
                  text: `Please extract ALL the text from this PDF document completely and accurately. 
Include all headings, paragraphs, tables, bullet points, numbers, and data.
Do NOT summarize — extract the full verbatim text. 
Format clearly with line breaks between sections.
This is the file: ${filename}`,
                },
              ],
            },
          ],
        });

        const text = response.candidates?.[0]?.content?.parts
          ?.map((p: any) => p.text || "")
          .join("\n")
          .trim();

        if (text && text.length > 10) return text;
        break; // empty result — try next model
      } catch (err: any) {
        const isRateLimit = err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("RESOURCE_EXHAUSTED");
        if (isRateLimit && attempt < 2) {
          // Exponential backoff: 5s, 15s
          const waitMs = (attempt + 1) * 5000;
          console.warn(`[assistant] ${modelName} rate-limited (attempt ${attempt + 1}), retrying in ${waitMs / 1000}s...`);
          await new Promise(r => setTimeout(r, waitMs));
          continue;
        }
        // Not a rate limit error or exhausted retries — try next model
        console.warn(`[assistant] ${modelName} failed (attempt ${attempt + 1}): ${err?.message}`);
        break;
      }
    }
  }

  return "";
}


async function extractDocumentText(filePath: string, filename: string): Promise<{ text: string; method: "pdf-parse" | "gemini-ocr" }> {
  // 1. Try text extraction first (fast, free)
  const textFromParse = await extractTextWithPdfParse(filePath);

  // If we got meaningful text (>50 chars), use it
  if (textFromParse.length > 50) {
    return { text: textFromParse, method: "pdf-parse" };
  }

  // 2. Fall back to Gemini Vision OCR only if a key is available
  if (!geminiKey) {
    // No Gemini key — save whatever pdf-parse got (even if sparse) with a note
    const fallbackText = textFromParse.length > 0
      ? textFromParse
      : `[This document (${filename}) appears to be a scanned/image PDF. Text extraction requires a GEMINI_API_KEY to be configured on the server. The document has been saved but its content cannot be searched until the key is added.]`;
    return { text: fallbackText, method: "pdf-parse" };
  }

  // 3. Gemini Vision OCR (for scanned/image PDFs)
  const textFromOCR = await extractTextWithGeminiOCR(filePath, filename);

  if (textFromOCR.length > 10) {
    return { text: textFromOCR, method: "gemini-ocr" };
  }

  // Last resort: save with whatever we have
  const lastResortText = textFromParse.length > 0
    ? textFromParse
    : `[Could not extract text from ${filename}. The file may be corrupt, password-protected, or a low-quality scan.]`;
  return { text: lastResortText, method: "pdf-parse" };
}

// ── Upload route ──────────────────────────────────────────────────────────────

router.post("/assistant/upload", requireAuth, upload.single("file"), async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const { path: tempPath, originalname } = req.file;

  try {
    const { text: extractedText, method } = await extractDocumentText(tempPath, originalname);

    const { data, error } = await supabase
      .from("assistant_documents")
      .insert({
        title: originalname,
        content: extractedText,
      })
      .select()
      .single();

    if (error) {
      req.log.error({ err: error }, "Database insert error for document");
      res.status(500).json({ error: "Failed to save document to database" });
      return;
    }

    res.json({ success: true, document: data, extractionMethod: method });
  } catch (err: any) {
    req.log.error({ err }, "Error processing document upload");
    res.status(500).json({ error: `Failed to process PDF: ${err?.message || err}` });
  } finally {
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
});

// ── Reprocess route: re-OCR an existing empty document ───────────────────────
// POST /api/assistant/documents/:id/reprocess  (with the file as multipart form)

router.post("/assistant/documents/:id/reprocess", requireAuth, upload.single("file"), async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const { path: tempPath, originalname } = req.file;

  try {
    // Force Gemini OCR regardless (user explicitly chose to reprocess)
    const textFromOCR = await extractTextWithGeminiOCR(tempPath, originalname);

    if (!textFromOCR || textFromOCR.length < 10) {
      throw new Error("OCR returned no usable text.");
    }

    const { data, error } = await supabase
      .from("assistant_documents")
      .update({ content: textFromOCR })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: "Failed to update document" });
      return;
    }

    res.json({ success: true, document: data, extractionMethod: "gemini-ocr" });
  } catch (err: any) {
    req.log.error({ err }, "Error reprocessing document");
    res.status(500).json({ error: `Reprocess failed: ${err?.message || err}` });
  } finally {
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
});

// ── List documents ────────────────────────────────────────────────────────────

router.get("/assistant/documents", requireAuth, async (req, res): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from("assistant_documents")
      .select("id, title, created_at, content")
      .order("created_at", { ascending: false });

    if (error) {
      res.status(500).json({ error: "Database error" });
      return;
    }

    // Return documents with a flag indicating if content is empty (needs reprocessing)
    const docs = (data ?? []).map((doc: any) => ({
      id: doc.id,
      title: doc.title,
      created_at: doc.created_at,
      hasContent: (doc.content || "").trim().length > 50,
    }));

    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Delete document ───────────────────────────────────────────────────────────

router.delete("/assistant/documents/:id", requireAuth, async (req, res): Promise<void> => {
  try {
    const { error } = await supabase
      .from("assistant_documents")
      .delete()
      .eq("id", req.params.id);

    if (error) {
      res.status(500).json({ error: "Database error" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
