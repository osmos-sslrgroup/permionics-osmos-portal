import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import multer from "multer";
import os from "os";
import path from "path";
import { exec } from "child_process";
import util from "util";
import fs from "fs";
import AdmZip from "adm-zip";

const execAsync = util.promisify(exec);
const router: IRouter = Router();

const upload = multer({ dest: os.tmpdir() });

router.post(
  "/documents/format-pace",
  requireAuth,
  upload.fields([
    { name: "docx", maxCount: 1 },
    { name: "logo", maxCount: 1 }
  ]),
  async (req, res): Promise<void> => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const docxFile = files["docx"]?.[0];
      const logoFile = files["logo"]?.[0];

      if (!docxFile) {
        res.status(400).json({ error: "Missing DOCX file" });
        return;
      }

      const { projectName, date, company, designedBy, elementModel } = req.body;
      
      const inputDocxPath = path.join(os.tmpdir(), `input_${Date.now()}.docx`);
      fs.renameSync(docxFile.path, inputDocxPath);

      let actualLogoPath = "dummy_logo";
      if (logoFile) {
        // Extract extension from originalname (e.g. .png, .jpg)
        const ext = path.extname(logoFile.originalname) || ".png";
        actualLogoPath = path.join(os.tmpdir(), `logo_${Date.now()}${ext}`);
        fs.renameSync(logoFile.path, actualLogoPath);
      }

      const pyOutputPath = path.join(os.tmpdir(), `py_out_${Date.now()}.docx`);
      const finalOutputPath = pyOutputPath; // We will use the output directly
      
      const pythonScriptPath = path.join(process.cwd(), "src", "lib", "formatter.py");
      
      // 1. Run Python script to replace text and logo
      // We pass the args safely
      const args = [
        inputDocxPath,
        actualLogoPath,
        projectName || "",
        date || "",
        company || "",
        designedBy || "",
        elementModel || "",
        pyOutputPath
      ].map(arg => `"${String(arg).replace(/"/g, '\\"')}"`).join(" ");
      
      await execAsync(`python "${pythonScriptPath}" ${args}`);
      
      // 2. Send final file back (or convert to PDF if requested)
      const wantPdf = req.query.pdf === "true";
      
      if (wantPdf) {
        const pyOutputPdf = path.join(os.tmpdir(), `final_out_${Date.now()}.pdf`);
        // Use docx2pdf to convert the docx to pdf
        const docx2pdfScript = `python -c "from docx2pdf import convert; convert('${finalOutputPath.replace(/\\/g, '\\\\')}', '${pyOutputPdf.replace(/\\/g, '\\\\')}')"`;
        try {
            await execAsync(docx2pdfScript);
            res.download(pyOutputPdf, "Formatted_Projection.pdf", (err) => {
              fs.unlink(inputDocxPath, () => {});
              fs.unlink(pyOutputPath, () => {});
              fs.unlink(pyOutputPdf, () => {});
              if (actualLogoPath !== "dummy_logo") fs.unlink(actualLogoPath, () => {});
            });
        } catch (pdfErr) {
            req.log.error({ err: pdfErr }, "Failed to convert DOCX to PDF");
            res.status(500).json({ error: "Failed to generate PDF" });
        }
      } else {
        res.download(finalOutputPath, "Formatted_Projection.docx", (err) => {
          // Cleanup temp files
          fs.unlink(inputDocxPath, () => {});
          fs.unlink(pyOutputPath, () => {});
          if (actualLogoPath !== "dummy_logo") fs.unlink(actualLogoPath, () => {});
        });
      }

    } catch (error: any) {
      req.log.error({ err: error }, "Failed to format DOCX");
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

export default router;
