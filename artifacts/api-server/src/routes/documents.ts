import { Router, type IRouter } from "express";
import { requireAuth } from "../middleware/auth";
import multer from "multer";
import os from "os";

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

      // TODO: Process the DOCX file and logo
      // For now, return a placeholder success message
      res.json({ success: true, message: "Endpoint reached successfully" });

    } catch (error: any) {
      req.log.error({ err: error }, "Failed to format DOCX");
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

export default router;
