import { body, param } from "express-validator";
import { validationErrorHandler } from "../../../middleware/validation-handler.js";

/**
 * Validate Document ID Param
 */
export const documentIdParamValidation = [
  param("documentId")
    .isInt({ min: 1 })
    .withMessage("Document ID must be a positive integer")
    .toInt(),

  validationErrorHandler,
];

/**
 * Validate Query Body for Document Query
 */
export const queryDocumentValidation = [
  param("documentId")
    .isInt({ min: 1 })
    .withMessage("Document ID must be a positive integer")
    .toInt(),

  body("query")
    .notEmpty()
    .withMessage("Query is required")
    .isString()
    .withMessage("Query must be a string")
    .trim(),

  validationErrorHandler,
];
