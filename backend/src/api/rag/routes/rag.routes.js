import express from "express";
import { authenticateUser } from "../../../middleware/authentication.js";
import { getDocumentMetaController, queryDocumentController } from "../controller/rag.controller.js";
import { documentIdParamValidation, queryDocumentValidation } from "../validations/rag.validation.js";

const router = express.Router();

/**
 * @route GET /api/rag/documents/:documentId
 * @desc Get RAG Document Metadata
 * @access Private
 */
router.get(
  "/documents/:documentId",
  authenticateUser,
  documentIdParamValidation,
  getDocumentMetaController
);

/**
 * @route POST /api/rag/documents/:documentId/query
 * @desc Query a RAG document
 * @access Private
 */
router.post(
  "/documents/:documentId/query",
  authenticateUser,
  queryDocumentValidation,
  queryDocumentController
);

export default router;
