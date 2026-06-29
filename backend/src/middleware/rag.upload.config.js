import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

// ── Cloudinary configuration ──────────────────────────────────────────────────
function ensureCloudinaryConfigured() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

ensureCloudinaryConfigured();

// ── Memory storage — file arrives as req.file.buffer (no disk write) ─────────
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  if (file.mimetype !== "application/pdf") {
    return cb(new Error("Only PDF files are allowed"));
  }
  cb(null, true);
};

const maxSizeMb = Number(process.env.RAG_MAX_UPLOAD_MB) || 50;

export const uploadDocument = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSizeMb * 1024 * 1024 },
});

export const createDocumentMulterErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
};

/**
 * Upload a Buffer to Cloudinary as a raw resource.
 *
 * Key decisions:
 *  - resource_type "raw"  — correct for non-image binary files (PDFs)
 *  - NO `format` option   — adding format: "pdf" with resource_type "raw" causes
 *                           Cloudinary to append the extension to the public_id AND
 *                           again to the URL, producing a double-extension URL like
 *                           "...filename.pdf.pdf" which always 404s / 401s.
 *  - type: "upload"       — standard delivery type; asset is privately accessible
 *                           via signed URL or directly server-to-server via the SDK.
 *
 * @param {Buffer}  buffer       - Raw PDF bytes
 * @param {string}  originalName - Original filename (used to build the public_id)
 * @returns {Promise<{ secureUrl: string, publicId: string }>}
 */
export function uploadBufferToCloudinary(buffer, originalName) {
  return new Promise((resolve, reject) => {
    ensureCloudinaryConfigured();

    // Build a clean public_id — no extension, no special chars except hyphens/underscores
    const nameWithoutExt = originalName
      .replace(/\.pdf$/i, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 100); // Cloudinary public_id max is 255, keep it sane

    const publicId = `forum-rag-documents/${Date.now()}-${nameWithoutExt}`;

    console.log("[Cloudinary Upload] Starting upload:", { publicId, bufferLength: buffer.length });

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        public_id: publicId,
        // NOTE: Do NOT pass `format` for raw uploads — it mangles the public_id
        // NOTE: Do NOT pass `access_mode: "public"` — ignored for raw on most plans
        //       Access is controlled server-side via signed URLs
        overwrite: true,
        invalidate: true,
      },
      (error, result) => {
        if (error) {
          console.error("[Cloudinary Upload] Failed:", error);
          return reject(error);
        }

        console.log("[Cloudinary Upload] Success:", {
          public_id:   result.public_id,
          resource_type: result.resource_type,
          type:        result.type,
          secure_url:  result.secure_url,
          format:      result.format,
          bytes:       result.bytes,
        });

        // Validate the returned URL looks correct before persisting
        if (!result.secure_url || !result.secure_url.startsWith("https://")) {
          return reject(new Error(`Cloudinary returned invalid secure_url: ${result.secure_url}`));
        }

        resolve({
          secureUrl: result.secure_url,
          publicId:  result.public_id,
        });
      },
    );

    uploadStream.end(buffer);
  });
}

/**
 * Generate a short-lived signed URL for a raw Cloudinary asset.
 * This is the correct way to serve private raw files — the browser
 * loads the signed URL directly without needing credentials.
 *
 * @param {string} publicId  - Cloudinary public_id (no extension)
 * @param {number} [ttlSecs] - How long the URL is valid (default 1 hour)
 * @returns {string} Signed HTTPS URL
 */
export function getSignedCloudinaryUrl(publicId, ttlSecs = 3600) {
  ensureCloudinaryConfigured();

  return cloudinary.url(publicId, {
    resource_type: "raw",
    type:          "upload",
    sign_url:      true,
    expires_at:    Math.floor(Date.now() / 1000) + ttlSecs,
    secure:        true,
  });
}

// Export cloudinary instance so other modules (rag.service.js) can call
// cloudinary.uploader.destroy() for deletions without re-importing.
export { cloudinary };
