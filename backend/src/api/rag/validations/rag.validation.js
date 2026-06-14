import Joi from "joi";

export function validateUploadedDocument(file) {
  if (!file) {
    throw new Error("PDF file is required");
  }

  if (file.mimetype !== "application/pdf") {
    throw new Error("Only PDF files are allowed");
  }

  return true;
}

export const searchDocumentSchema = Joi.object({
  documentId: Joi.number().integer().required(),
  query: Joi.string().min(1).required(),
  k: Joi.number().integer().min(1).max(20).optional(),
});
