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
      const finalOutputPath = path.join(os.tmpdir(), `final_out_${Date.now()}.docx`);
      
      const pythonScriptPath = path.join(process.cwd(), "src", "lib", "formatter.py");
      
      // 1. Run Python script to replace text
      // We pass the args safely
      const args = [
        inputDocxPath,
        "dummy_logo", // we don't replace logo in python
        projectName || "",
        date || "",
        company || "",
        designedBy || "",
        elementModel || "",
        pyOutputPath
      ].map(arg => `"${String(arg).replace(/"/g, '\\"')}"`).join(" ");
      
      await execAsync(`python "${pythonScriptPath}" ${args}`);
      
      // 2. Replace Logo using adm-zip if logo provided
      if (logoFile) {
        const zip = new AdmZip(pyOutputPath);
        const logoBuffer = fs.readFileSync(logoFile.path);
        
        // Find the image. Usually it's word/media/image1.png or image1.jpeg
        const entries = zip.getEntries();
        const mediaEntries = entries.filter(e => e.entryName.startsWith("word/media/image1"));
        
        if (mediaEntries.length > 0) {
          const targetImage = mediaEntries[0].entryName;
          // Delete existing
          zip.deleteFile(targetImage);
          // Add new one with same name
          zip.addFile(targetImage, logoBuffer);
        } else {
          // Fallback if not named image1
          const anyImages = entries.filter(e => e.entryName.startsWith("word/media/"));
          if (anyImages.length > 0) {
             zip.deleteFile(anyImages[0].entryName);
             zip.addFile(anyImages[0].entryName, logoBuffer);
          }
        }
        
        zip.writeZip(finalOutputPath);
      } else {
        // Just copy over if no logo
        fs.copyFileSync(pyOutputPath, finalOutputPath);
      }
      
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
