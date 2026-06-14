import express from "express";

import { createDocumentController } from "../controller/rag.controller.js";

import { uploadDocument } from "../../../middleware/rag.upload.config.js";

import { authenticateUser } from "../../../middleware/authentication.js";

import { searchInDocumentController } from "../controller/rag.controller.js";

const router = express.Router();

router.post(
  "/documents",
  authenticateUser,
  uploadDocument.single("file"),
  createDocumentController,
);

router.get(
  "/documents/:documentId/search",
  authenticateUser,
  searchInDocumentController,
);

export default router;
