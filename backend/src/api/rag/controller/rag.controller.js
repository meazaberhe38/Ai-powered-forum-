import { createDocumentFromUploadService } from "../service/rag.service.js";
import { searchInDocumentService } from "../service/rag.service.js";

export const createDocumentController = async (req, res, next) => {
  try {
    const result = await createDocumentFromUploadService({
      file: req.file,
      userId: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Document uploaded and processed.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const searchInDocumentController = async (req, res, next) => {
  try {
    const result = await searchInDocumentService({
      documentId: req.params.documentId,
      query: req.query.query,
      k: req.query.k,
      userId: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Ranked chunk excerpts",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};
