import { Router, type IRouter } from "express";
import multer from "multer";
import os from "os";
import fs from "fs";
import path from "path";
import { debugLog } from "../lib/modes";

const router: IRouter = Router();
const upload = multer({ dest: os.tmpdir() });

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
