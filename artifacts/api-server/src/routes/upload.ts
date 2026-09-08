import { Router, type IRouter } from "express";
import multer from "multer";
import os from "os";
import fs from "fs";
import path from "path";
import { debugLog } from "../lib/modes";

const router: IRouter = Router();
const upload = multer({ dest: os.tmpdir() });

const r2AccountId = process.env.R2_ACCOUNT_ID || "";
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID || "";
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";
const r2BucketName = process.env.R2_BUCKET_NAME || "";
const r2PublicUrl = process.env.R2_PUBLIC_URL || "";

let s3Client: any = null;

async function getS3Client() {
  if (!s3Client && r2AccountId && r2AccessKeyId && r2SecretAccessKey) {
    try {
      const { S3Client } = await import("@aws-sdk/client-s3");
      s3Client = new S3Client({
        region: "auto",
        endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: r2AccessKeyId,
          secretAccessKey: r2SecretAccessKey,
        },
      });
    } catch (e) {
      debugLog("STORAGE", "S3 SDK not available, falling back to disk/base64.");
    }
  }
  return s3Client;
}

router.post("/upload", upload.single("file"), async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const { path: tempPath, originalname, mimetype } = req.file;
  const ext = path.extname(originalname) || ".jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;

  try {
    const fileBuffer = fs.readFileSync(tempPath);
    const client = await getS3Client();

    if (client && r2BucketName) {
      const { PutObjectCommand } = await import("@aws-sdk/client-s3");
      await client.send(
        new PutObjectCommand({
          Bucket: r2BucketName,
          Key: filename,
          Body: fileBuffer,
          ContentType: mimetype,
        })
      );

      const cdnUrl = r2PublicUrl
        ? `${r2PublicUrl.replace(/\/$/, "")}/${filename}`
        : `https://${r2BucketName}.${r2AccountId}.r2.cloudflarestorage.com/${filename}`;

      debugLog("STORAGE", `Uploaded ${originalname} to Cloudflare R2 bucket ${r2BucketName}`, { cdnUrl });
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

      debugLog("STORAGE", `R2 credentials missing. Saved ${originalname} to local storage`, { localUrl });
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
