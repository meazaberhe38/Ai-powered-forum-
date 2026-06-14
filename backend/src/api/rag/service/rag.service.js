import { safeExecute } from "../../../../db/config.js";
import { NotFoundError, ServiceUnavailableError } from "../../../utils/errors/index.js";
import { embedQuery, getGeminiClient } from "../../../utils/gemini.js";
import { cosineSimilarity } from "../../../utils/math.js";

const K_CHUNKS = 5;

/**
 * Get Document Metadata Service
 */
export const getDocumentMetaService = async (documentId, userId) => {
  const sql = `
    SELECT 
      document_id,
      title,
      mime_type,
      byte_size,
      status,
      error_message,
      created_at,
      updated_at,
      user_id,
      storage_path
    FROM documents
    WHERE document_id = ? AND user_id = ?
  `;

  const rows = await safeExecute(sql, [documentId, userId]);

  if (rows.length === 0) {
    throw new NotFoundError("Document not found");
  }

  return rows[0];
};

/**
 * Perform Gemini Generation with context
 */
const answerFromRagChunksService = async (query, contextText) => {
  try {
    const ai = getGeminiClient();
    const prompt = `You are a helpful AI assistant. You must answer the user's question ONLY using the provided document context. If the answer cannot be found in the context, say "I cannot answer this based on the provided document."\n\nContext:\n${contextText}\n\nQuestion: ${query}\n\nAnswer:`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    throw new ServiceUnavailableError("Failed to generate answer from AI");
  }
};

/**
 * Query Document Service
 */
export const queryDocumentService = async (documentId, userId, query) => {
  // Verify document existence and ownership
  await getDocumentMetaService(documentId, userId);

  // Generate embedding for query
  const queryEmbedding = await embedQuery(query);

  // Fetch document chunks and vectors
  const chunksSql = `
    SELECT 
      c.chunk_id, 
      c.chunk_index, 
      c.content, 
      v.embedding
    FROM document_chunks c
    JOIN document_chunk_vectors v ON c.chunk_id = v.chunk_id
    WHERE c.document_id = ? AND v.status = 'ready'
  `;

  const chunkRows = await safeExecute(chunksSql, [documentId]);

  if (chunkRows.length === 0) {
    return {
      answer: "No processed text chunks found for this document.",
      citations: [],
      chunksUsed: []
    };
  }

  // Calculate similarity and rank
  const scoredChunks = chunkRows.map((row) => {
    const embedding = typeof row.embedding === "string" ? JSON.parse(row.embedding) : row.embedding;
    const score = cosineSimilarity(queryEmbedding, embedding);
    return {
      ...row,
      score,
    };
  });

  const topChunks = scoredChunks
    .sort((a, b) => b.score - a.score)
    .slice(0, K_CHUNKS);

  if (topChunks.length === 0) {
    return {
      answer: "No relevant chunks found for the query.",
      citations: [],
      chunksUsed: []
    };
  }

  // Build context
  const contextText = topChunks
    .map((chunk) => `[Chunk ${chunk.chunk_index}]\n${chunk.content}`)
    .join("\n\n");

  // Call Gemini
  const answer = await answerFromRagChunksService(query, contextText);

  // Format citations
  const citations = topChunks.map((chunk, index) => ({
    ref: index + 1,
    chunkIndex: chunk.chunk_index
  }));

  const chunksUsed = topChunks.map(chunk => chunk.chunk_index);

  return {
    answer,
    citations,
    chunksUsed
  };
};
