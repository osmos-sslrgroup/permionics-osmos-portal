import { Router, type IRouter } from "express";
import { requireRole } from "../middlewares/requireRole";
import multer from "multer";
import os from "os";
import path from "path";
import { execFile } from "child_process";
import util from "util";
import crypto from "crypto";
import fs from "fs";

const execFileAsync = util.promisify(execFile);
const router: IRouter = Router();

const upload = multer({ dest: os.tmpdir() });

// Strip control characters and cap length. Values are passed to python via execFile
// (argument array, no shell), so this is defense-in-depth rather than the primary guard.
function cleanField(value: unknown, max = 120): string {
  return String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, "").slice(0, max);
}

// Validate a MM/DD/YYYY string as a real calendar date. Defense-in-depth: the client also
// validates, but a direct API caller must not reach the formatter with an impossible date.
function isValidMMDDYYYY(s: string): boolean {
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return false;
  const month = Number(m[1]);
  const day = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(0);
  d.setUTCFullYear(year, month - 1, day);
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

router.post(
  "/documents/format-pace",
  requireRole(["admin", "operator"]),
  upload.fields([
    { name: "docx", maxCount: 1 },
    { name: "logo", maxCount: 1 }
  ]),
  async (req, res): Promise<void> => {
    const tempPaths: string[] = [];
    const cleanupTemps = () => {
      for (const p of tempPaths) {
        fs.unlink(p, () => {});
      }
    };

    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const docxFile = files["docx"]?.[0];
      const logoFile = files["logo"]?.[0];

      if (!docxFile) {
        res.status(400).json({ error: "Missing DOCX file" });
        return;
      }

      const projectName = cleanField(req.body.projectName);
      const company = cleanField(req.body.company);
      const designedBy = cleanField(req.body.designedBy);
      const elementModel = cleanField(req.body.elementModel);
      const rawDate = req.body.date;

      // Normalize date to MM/DD/YYYY
      let formattedDate = "";
      if (rawDate && typeof rawDate === "string" && rawDate.trim()) {
        const s = rawDate.trim();
        const ymd = s.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
        const mdy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
        if (ymd) {
          formattedDate = `${ymd[2].padStart(2, "0")}/${ymd[3].padStart(2, "0")}/${ymd[1]}`;
        } else if (mdy) {
          formattedDate = `${mdy[1].padStart(2, "0")}/${mdy[2].padStart(2, "0")}/${mdy[3]}`;
        } else {
          formattedDate = cleanField(s, 40);
        }
      }

      // Reject an impossible date before invoking the formatter; clean up the multer uploads.
      if (rawDate && typeof rawDate === "string" && rawDate.trim() && !isValidMMDDYYYY(formattedDate)) {
        fs.unlink(docxFile.path, () => {});
        if (logoFile) fs.unlink(logoFile.path, () => {});
        res.status(400).json({ error: "Invalid date. Use MM/DD/YYYY (for example 02/13/2025)." });
        return;
      }

      const inputDocxPath = path.join(os.tmpdir(), `input_${crypto.randomUUID()}.docx`);
      fs.renameSync(docxFile.path, inputDocxPath);
      tempPaths.push(inputDocxPath);

      let actualLogoPath = "dummy_logo";
      if (logoFile) {
        const ext = path.extname(logoFile.originalname) || ".png";
        actualLogoPath = path.join(os.tmpdir(), `logo_${crypto.randomUUID()}${ext}`);
        fs.renameSync(logoFile.path, actualLogoPath);
        tempPaths.push(actualLogoPath);
      }

      const pyOutputPath = path.join(os.tmpdir(), `py_out_${crypto.randomUUID()}.docx`);
      tempPaths.push(pyOutputPath);

      const pythonScriptPath = path.join(process.cwd(), "src", "lib", "formatter.py");

      // Run the formatter via execFile with an ARGUMENT ARRAY (no shell): user-supplied
      // fields can never be interpreted as shell syntax (fixes the command-injection hole).
      await execFileAsync("python", [
        pythonScriptPath,
        inputDocxPath,
        actualLogoPath,
        projectName,
        formattedDate,
        company,
        designedBy,
        elementModel,
        pyOutputPath,
      ]);

      const wantPdf = req.query.pdf === "true";

      if (wantPdf) {
        const pyOutputPdf = path.join(os.tmpdir(), `final_out_${crypto.randomUUID()}.pdf`);
        tempPaths.push(pyOutputPdf);
        try {
          // Pass paths as argv to a fixed program; no interpolation into the code string.
          await execFileAsync("python", [
            "-c",
            "import sys\nfrom docx2pdf import convert\nconvert(sys.argv[1], sys.argv[2])",
            pyOutputPath,
            pyOutputPdf,
          ]);
        } catch (pdfErr) {
          req.log.error({ err: pdfErr }, "Failed to convert DOCX to PDF");
          cleanupTemps();
          res.status(500).json({ error: "Failed to generate PDF" });
          return;
        }
        res.download(pyOutputPdf, "Formatted_Projection.pdf", () => cleanupTemps());
      } else {
        res.download(pyOutputPath, "Formatted_Projection.docx", () => cleanupTemps());
      }
    } catch (error: any) {
      req.log.error({ err: error }, "Failed to format DOCX");
      cleanupTemps();
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  }
);

export default router;
