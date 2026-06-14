import fs from "fs";
import { PDFParse } from "pdf-parse";

import { safeExecute } from "../../../../db/config.js";
import { chunkText } from "../../../utils/chunking.js";
import { validateUploadedDocument } from "../validations/rag.validation.js";
import { generateQuestionEmbedding } from "../../questions/service/vector.service.js";

export async function createDocumentFromUploadService({ file, userId }) {
  validateUploadedDocument(file);

  if (!userId) {
    throw new Error("userId is required");
  }

  if (!file?.path) {
    throw new Error("File path is missing");
  }

  console.log("USER ID:", userId);
  console.log("FILE:", file);

  let documentId = null;

  try {
    const insertDocumentSql = `
      INSERT INTO documents
      (
        user_id,
        title,
        mime_type,
        storage_path,
        byte_size,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const documentResult = await safeExecute(insertDocumentSql, [
      userId,
      file.originalname,
      file.mimetype,
      file.path,
      file.size,
      "processing",
    ]);

    documentId = documentResult.insertId;

    const buffer = fs.readFileSync(file.path);

    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();

    const extractedText = result.text?.trim();

    if (!extractedText) {
      throw new Error("No text could be extracted from PDF");
    }

    const chunks = chunkText(extractedText, 1000, 150);

    if (!chunks || chunks.length === 0) {
      throw new Error("Chunking failed: no text chunks created");
    }

    for (let index = 0; index < chunks.length; index++) {
      const chunk = chunks[index];

      const embeddingResult = await generateQuestionEmbedding(chunk);

      if (!embeddingResult?.embedding) {
        throw new Error("Embedding generation failed");
      }

      const insertChunkSql = `
        INSERT INTO document_chunks
        (
          document_id,
          chunk_index,
          content
        )
        VALUES (?, ?, ?)
      `;

      const chunkResult = await safeExecute(insertChunkSql, [
        documentId,
        index,
        chunk,
      ]);

      const chunkId = chunkResult.insertId;

      const insertVectorSql = `
        INSERT INTO document_chunk_vectors
        (
          chunk_id,
          source_text,
          embedding,
          status
        )
        VALUES (?, ?, ?, ?)
      `;

      await safeExecute(insertVectorSql, [
        chunkId,
        chunk,
        JSON.stringify(embeddingResult.embedding),
        "ready",
      ]);
    }

    await safeExecute(
      `
      UPDATE documents
      SET status = 'ready'
      WHERE document_id = ?
      `,
      [documentId],
    );

    const documents = await safeExecute(
      `
      SELECT *
      FROM documents
      WHERE document_id = ?
      `,
      [documentId],
    );

    return documents[0];
  } catch (error) {
    console.error("===RAG DOCUMENT PROCESSING ERROR===");
    console.error(error);
    console.error("====================================");

    if (documentId) {
      await safeExecute(
        `
        UPDATE documents
        SET status = 'failed',
        error_message = ?
        WHERE document_id = ?
        `,
        [error.message, documentId],
      );
    }

    throw error;
  }
}

//document search service

function cosineSimilarity(a, b) {
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export async function searchInDocumentService({
  documentId,
  query,
  k = 5,
  userId,
}) {
  // 1. Check document ownership + status
  const doc = await safeExecute(
    `SELECT * FROM documents WHERE document_id = ? AND user_id = ?`,
    [documentId, userId],
  );

  if (!doc.length) {
    throw new Error("Document not found or unauthorized");
  }

  if (doc[0].status !== "ready") {
    throw new Error("Document is not ready for search");
  }

  // 2. Embed query
  const queryEmbedding = await generateQuestionEmbedding(query, {
    taskType: "RETRIEVAL_QUERY",
  });

  const queryVector = queryEmbedding.embedding;

  // 3. Get all chunk vectors
  const chunks = await safeExecute(
    `
    SELECT 
      c.chunk_id,
      c.chunk_index,
      c.content,
      v.embedding
    FROM document_chunks c
    JOIN document_chunk_vectors v ON c.chunk_id = v.chunk_id
    WHERE c.document_id = ?
    `,
    [documentId],
  );

  // 4. Compute similarity
  const results = chunks
    .map((c) => {
      let vector;

      try {
        // Handle both JSON string and already-parsed array cases
        vector =
          typeof c.embedding === "string"
            ? JSON.parse(c.embedding)
            : c.embedding;

        // Validate that vector is actually an array of numbers
        if (!Array.isArray(vector) || vector.length === 0) {
          throw new Error("Invalid vector format");
        }
      } catch (err) {
        console.error("Skipping corrupted embedding:", c.embedding);
        console.error("Parse error:", err.message);
        return null;
      }

      const score = cosineSimilarity(queryVector, vector);

      return {
        chunkId: c.chunk_id,
        chunkIndex: c.chunk_index,
        score,
        excerpt: c.content,
      };
    })
    .filter(Boolean);

  // 5. Filter + sort
  const ranked = results
    .filter((r) => r.score > 0.2)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);

  return {
    query,
    results: ranked,
  };
}
