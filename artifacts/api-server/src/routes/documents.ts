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
      
      const inputDocxPath = docxFile.path;
      const pyOutputPath = path.join(os.tmpdir(), `py_out_${Date.now()}.docx`);
      const finalOutputPath = pyOutputPath; // We will use the output directly
      
      const pythonScriptPath = path.join(process.cwd(), "src", "lib", "formatter.py");
      
      // 1. Run Python script to replace text and logo
      // We pass the args safely
      const args = [
        inputDocxPath,
        logoFile ? logoFile.path : "dummy_logo",
        projectName || "",
        date || "",
        company || "",
        designedBy || "",
        elementModel || "",
        pyOutputPath
      ].map(arg => `"${String(arg).replace(/"/g, '\\"')}"`).join(" ");
      
      await execAsync(`python "${pythonScriptPath}" ${args}`);
      
      // 3. Send final file back
      res.download(finalOutputPath, "Formatted_Projection.docx", (err) => {
        // Cleanup temp files
        fs.unlink(inputDocxPath, () => {});
        fs.unlink(pyOutputPath, () => {});
        fs.unlink(finalOutputPath, () => {});
        if (logoFile) fs.unlink(logoFile.path, () => {});
      });

    } catch (error: any) {
      req.log.error({ err: error }, "Failed to format DOCX");
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

export default router;
