import fs from "fs/promises";
import path from "path";
import db from "../../config/db.js";

export const deleteDocumentService = async (documentId, userId) => {
  // Verify document exists and belongs to user
  const [documents] = await db.query(
    `
    SELECT document_id, user_id, storage_path
    FROM documents
    WHERE document_id = ?
    `,
    [documentId],
  );

  if (!documents.length) {
    const error = new Error("Document not found.");
    error.statusCode = 404;
    throw error;
  }

  const document = documents[0];

  if (document.user_id !== userId) {
    const error = new Error("You are not authorized to delete this document.");
    error.statusCode = 403;
    throw error;
  }

  // Delete PDF from disk
  try {
    const absolutePath = path.resolve(document.storage_path);

    await fs.unlink(absolutePath);
  } catch (err) {
    // Ignore missing file errors
    if (err.code !== "ENOENT") {
      throw err;
    }
  }

  // Delete document record
  // CASCADE will automatically delete:
  // document_chunks
  // document_chunk_vectors
  await db.query(
    `
    DELETE FROM documents
    WHERE document_id = ?
    `,
    [documentId],
  );

  return {
    id: documentId,
  };
};
