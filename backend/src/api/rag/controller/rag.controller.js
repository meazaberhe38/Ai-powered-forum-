import { StatusCodes } from "http-status-codes";
import { getSignedCloudinaryUrl } from "../../../middleware/rag.upload.config.js";
import {
  listDocumentsForUserService,
  getDocumentMetaService,
  assertOwnedDocument,
  createDocumentFromUploadService,
  searchInDocumentService,
  queryDocumentService,
  deleteDocumentService,
} from "../service/rag.service.js";

/**
 * GET /api/rag/documents
 */
export const listDocumentsController = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const documents = await listDocumentsForUserService(userId);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Documents fetched successfully.",
      data: documents,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/rag/documents/:documentId
 */
export const getDocumentMetaController = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const userId = req.user?.id;
    const data = await getDocumentMetaService(documentId, userId);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Document fetched successfully.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/rag/documents
 */
export const createDocumentController = async (req, res, next) => {
  try {
    const result = await createDocumentFromUploadService({
      file: req.file,
      userId: req.user.id,
    });
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Document uploaded and processed.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/rag/documents/:documentId/file
 *
 * How this works:
 *   1. Verify document ownership (authN + authZ).
 *   2. Extract the Cloudinary public_id from the stored secure_url.
 *   3. Generate a short-lived signed URL using the Cloudinary SDK + API secret.
 *      Signed URLs work for both private (type=upload) and public raw assets.
 *   4. Fetch the PDF bytes from Cloudinary server-side using the signed URL.
 *      Server-to-server traffic is never subject to the browser delivery ACL.
 *   5. Stream the raw bytes back to the client as application/pdf.
 *
 * Why NOT Basic Auth:
 *   res.cloudinary.com (the CDN) does NOT accept API key/secret Basic Auth.
 *   Basic Auth only works on api.cloudinary.com (Admin/Upload API endpoints).
 *
 * Why NOT redirect to storage_path directly:
 *   raw type=upload assets return 401 in the browser unless the asset is
 *   explicitly public at the Cloudinary account/folder level.
 */
export const getDocumentFileController = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { documentId } = req.params;
    const document = await assertOwnedDocument(documentId, userId);

    if (!document.storage_path) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "No file URL found for this document.",
      });
    }

    const storagePath = document.storage_path;
    console.log("[PDF Proxy] storage_path from DB:", storagePath);

    // ── Extract public_id from the stored Cloudinary URL ──────────────────
    // Expected format: https://res.cloudinary.com/<cloud>/raw/upload/v<ver>/<public_id>
    // The public_id for raw uploads does NOT have an extension appended
    // (we fixed this by removing `format: "pdf"` from the uploader options).
    const uploadIndex = storagePath.indexOf("/upload/");
    if (uploadIndex === -1) {
      console.error("[PDF Proxy] Not a Cloudinary URL, cannot extract public_id:", storagePath);
      return res.status(StatusCodes.BAD_GATEWAY).json({
        success: false,
        message: "Document storage URL is not a valid Cloudinary URL.",
      });
    }

    let afterUpload = storagePath.slice(uploadIndex + "/upload/".length);
    // Strip version segment if present: v1234567890/
    afterUpload = afterUpload.replace(/^v\d+\//, "");
    // For raw uploads WITHOUT format option, public_id has NO extension.
    // For old uploads that may have a .pdf suffix baked in, strip it too.
    const publicId = afterUpload.replace(/\.pdf$/i, "");

    console.log("[PDF Proxy] Extracted public_id:", publicId);

    // ── Generate a signed URL (valid 1 hour) ──────────────────────────────
    const signedUrl = getSignedCloudinaryUrl(publicId, 3600);
    console.log("[PDF Proxy] Signed URL:", signedUrl);

    // ── Fetch bytes server-side using the signed URL ───────────────────────
    const cloudRes = await fetch(signedUrl);

    if (!cloudRes.ok) {
      const body = await cloudRes.text().catch(() => "");
      console.error("[PDF Proxy] Cloudinary fetch failed:", {
        status:     cloudRes.status,
        statusText: cloudRes.statusText,
        publicId,
        signedUrl,
        body:       body.slice(0, 500),
      });
      return res.status(StatusCodes.BAD_GATEWAY).json({
        success: false,
        message: `Failed to retrieve PDF from storage (${cloudRes.status} ${cloudRes.statusText}).`,
      });
    }

    const pdfBuffer = Buffer.from(await cloudRes.arrayBuffer());
    console.log("[PDF Proxy] Fetched bytes:", pdfBuffer.length);

    // Sanitise filename for Content-Disposition
    const filename = (document.title || "document.pdf")
      .replace(/[^\w\s.-]/g, "_")
      .replace(/\s+/g, "_");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.setHeader("Cache-Control", "private, max-age=3600");
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("[PDF Proxy] Unhandled error:", error?.message, error?.stack);
    next(error);
  }
};

/**
 * POST /api/rag/documents/:documentId/query
 */
export const queryDocumentController = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const { query } = req.body;
    const userId = req.user?.id;
    const data = await queryDocumentService(documentId, userId, query);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Answer and citations",
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/rag/documents/:documentId/search
 */
export const searchInDocumentController = async (req, res, next) => {
  try {
    const result = await searchInDocumentService({
      documentId: req.params.documentId,
      query:      req.query.query,
      k:          req.query.k,
      userId:     req.user.id,
    });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Ranked chunk excerpts",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/rag/documents/:documentId
 */
export const deleteDocumentController = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.id;
    const result = await deleteDocumentService(Number(documentId), userId);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Document deleted successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
