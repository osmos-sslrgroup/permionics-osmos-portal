import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import os from "os";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { requireRole } from "../middlewares/requireRole";
import { debugLog } from "../lib/modes";

const router: IRouter = Router();

// Allowlist of accepted upload types -> canonical extension (server-controlled).
const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
};

const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME[file.mimetype]) cb(null, true);
    else cb(new Error("UNSUPPORTED_FILE_TYPE"));
  },
});

// Wrap multer so size/type rejections become clean 400s instead of a 500.
function uploadSingle(req: Request, res: Response, next: NextFunction): void {
  upload.single("file")(req, res, (err: any) => {
    if (err) {
      // Only genuine client errors (rejected type / oversize) are 400s. A storage/write
      // failure is a server error: pass it to the error handler instead of a 400, which the
      // frontend would otherwise treat as "rejected" and silently store as a data URL.
      if (err?.message === "UNSUPPORTED_FILE_TYPE") {
        res.status(400).json({ error: "Unsupported file type. Allowed: JPEG, PNG, WebP, PDF." });
        return;
      }
      if (err?.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ error: "File too large (max 10 MB)." });
        return;
      }
      if (err?.code === "LIMIT_UNEXPECTED_FILE") {
        res.status(400).json({ error: "Unexpected file field. Upload a single file using the 'file' field." });
        return;
      }
      next(err);
      return;
    }
    next();
  });
}

const s3Endpoint = process.env.S3_ENDPOINT || "";
const s3AccessKeyId = process.env.S3_ACCESS_KEY_ID || "";
const s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY || "";
const s3BucketName = process.env.S3_BUCKET_NAME || "";
const s3PublicUrl = process.env.S3_PUBLIC_URL || "";
const s3Region = process.env.S3_REGION || "auto";

let s3Client: any = null;

async function getS3Client() {
  if (!s3Client && s3Endpoint && s3AccessKeyId && s3SecretAccessKey) {
    try {
      const { S3Client } = await import("@aws-sdk/client-s3");
      s3Client = new S3Client({
        region: s3Region,
        endpoint: s3Endpoint,
        credentials: {
          accessKeyId: s3AccessKeyId,
          secretAccessKey: s3SecretAccessKey,
        },
      });
    } catch (e) {
      debugLog("STORAGE", "S3 SDK not available, falling back to disk/base64.");
    }
  }
  return s3Client;
}

router.post("/upload", requireRole(["admin", "operator"]), uploadSingle, async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const { path: tempPath, originalname, mimetype } = req.file;
  // Extension comes from the validated MIME type, never the client-supplied filename.
  const ext = ALLOWED_MIME[mimetype] || ".bin";
  const filename = `${Date.now()}-${crypto.randomUUID()}${ext}`;

  try {
    const fileBuffer = fs.readFileSync(tempPath);
    const client = await getS3Client();

    if (client && s3BucketName) {
      const { PutObjectCommand } = await import("@aws-sdk/client-s3");
      await client.send(
        new PutObjectCommand({
          Bucket: s3BucketName,
          Key: filename,
          Body: fileBuffer,
          ContentType: mimetype,
        })
      );

      const cdnUrl = s3PublicUrl
        ? `${s3PublicUrl.replace(/\/$/, "")}/${filename}`
        : `${s3Endpoint.replace(/\/$/, "")}/${s3BucketName}/${filename}`;

      debugLog("STORAGE", `Uploaded ${originalname} to S3 bucket ${s3BucketName}`, { cdnUrl });
      res.json({ success: true, url: cdnUrl, filename });
    } else {
      // Local Fallback Storage
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const localFilePath = path.join(uploadsDir, filename);
      fs.writeFileSync(localFilePath, fileBuffer);
      const localUrl = `/uploads/${filename}`;

      debugLog("STORAGE", `S3 credentials missing. Saved ${originalname} to local storage`, { localUrl });
      res.json({ success: true, url: localUrl, filename });
    }
  } catch (err: any) {
    debugLog("STORAGE_ERROR", `Failed to save uploaded file ${originalname}`, { error: err.message });
    res.status(500).json({ error: "Failed to upload file to storage" });
  } finally {
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch (_) {}
  }
});

export default router;
