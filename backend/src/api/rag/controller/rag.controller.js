import { StatusCodes } from "http-status-codes";
import { cloudinary } from "../../../middleware/rag.upload.config.js";
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
 * Proxies the PDF through the backend.
 * Fetches the file from Cloudinary server-side using the Admin API
 * to resolve the authenticated URL, then streams the bytes to the client.
 * The browser never touches Cloudinary directly, so no 401s.
 */
export const getDocumentFileController = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { documentId } = req.params;
    const document = await assertOwnedDocument(documentId, userId);

    if (!document.storage_path) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "No file URL found for this document",
      });
    }

    const storagePath = document.storage_path;
    const uploadIndex = storagePath.indexOf("/upload/");

    if (uploadIndex === -1) {
      // Not a Cloudinary URL — redirect as-is
      return res.redirect(storagePath);
    }

    // Extract public_id from URL:
    // https://res.cloudinary.com/<cloud>/raw/upload/v<ver>/<public_id>.pdf
    let afterUpload = storagePath.slice(uploadIndex + "/upload/".length);
    afterUpload = afterUpload.replace(/^v\d+\//, "");       // strip version
    const publicId = afterUpload.replace(/\.[^/.]+$/, "");  // strip extension

    // Fetch via Admin API — this call is server-to-server with API credentials
    // and returns metadata including a fresh secure_url we can fetch directly.
    const resource = await cloudinary.api.resource(publicId, {
      resource_type: "raw",
      type: "upload",
    });

    // The secure_url from the Admin API is accessible server-side
    // because our server's IP is not subject to browser CORS / auth restrictions.
    const cloudRes = await fetch(resource.secure_url);

    if (!cloudRes.ok) {
      return res.status(StatusCodes.BAD_GATEWAY).json({
        success: false,
        message: `Failed to retrieve PDF from storage (${cloudRes.status})`,
      });
    }

    const pdfBuffer = Buffer.from(await cloudRes.arrayBuffer());
    const filename = (document.title || "document.pdf").replace(/[^\w\s.-]/g, "_");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.setHeader("Cache-Control", "private, max-age=3600");
    return res.send(pdfBuffer);
  } catch (error) {
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
      query: req.query.query,
      k: req.query.k,
      userId: req.user.id,
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
