import { deleteDocumentService } from "./rag.service.js";

export const deleteDocumentController = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.id;

    const result = await deleteDocumentService(Number(documentId), userId);

    res.status(200).json({
      success: true,
      message: "Document deleted successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
