import { safeExecute } from '../../../../db/config.js';
import { embedQuery } from '../../../utils/gemini.js';
import { cosineSimilarity } from '../../../utils/math.js';
import { NotFoundError } from '../../../utils/errors/index.js';

const RECOMMEND_THRESHOLD = 0.75;

export const searchQuestionsSemanticService = async (query, k = 5, threshold = RECOMMEND_THRESHOLD) => {
  // 1. Get embedding for the query
  const queryEmbedding = await embedQuery(query);

  // 2. Fetch all ready question vectors
  const vectorsSql = `SELECT question_id, embedding FROM question_vectors WHERE status = 'ready'`;
  const vectors = await safeExecute(vectorsSql, []);

  if (vectors.length === 0) {
    return [];
  }

  // 3. Compute cosine similarity
  const scoredVectors = vectors.map(row => {
    const embedding = typeof row.embedding === 'string' ? JSON.parse(row.embedding) : row.embedding;
    const score = cosineSimilarity(queryEmbedding, embedding);
    return { question_id: row.question_id, score };
  });

  // 4. Filter and sort
  const filtered = scoredVectors
    .filter(item => item.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);

  if (filtered.length === 0) {
    return [];
  }

  // 5. Fetch details for matched questions
  const questionIds = filtered.map(item => item.question_id);
  const placeholders = questionIds.map(() => '?').join(',');
  const detailsSql = `
    SELECT q.question_id as id, q.question_hash as questionHash, q.title, q.content, q.created_at as createdAt, q.updated_at as updatedAt,
           u.user_id, u.first_name as firstName, u.last_name as lastName,
           (SELECT COUNT(*) FROM answers a WHERE a.question_id = q.question_id) as answerCount
    FROM questions q
    JOIN users u ON q.user_id = u.user_id
    WHERE q.question_id IN (${placeholders})
  `;
  
  const questionDetails = await safeExecute(detailsSql, questionIds);

  // 6. Combine scores with details, maintaining order
  const results = filtered.map(scoredItem => {
    const detail = questionDetails.find(q => q.id === scoredItem.question_id);
    if (!detail) return null;
    return {
      id: detail.id,
      questionHash: detail.questionHash,
      title: detail.title,
      content: detail.content,
      answerCount: detail.answerCount,
      createdAt: detail.createdAt,
      updatedAt: detail.updatedAt,
      author: {
        id: detail.user_id,
        firstName: detail.firstName,
        lastName: detail.lastName
      },
      score: scoredItem.score
    };
  }).filter(Boolean);

  return results;
};

export const getSimilarQuestionsService = async (questionHash, k = 5, threshold = RECOMMEND_THRESHOLD) => {
  // 1. Get source question id and vector
  const sourceSql = `
    SELECT v.question_id, v.embedding 
    FROM question_vectors v
    JOIN questions q ON v.question_id = q.question_id
    WHERE q.question_hash = ? AND v.status = 'ready'
  `;
  const sourceResult = await safeExecute(sourceSql, [questionHash]);
  
  if (sourceResult.length === 0) {
    throw new NotFoundError('Source question vector not found or not ready');
  }
  
  const sourceRow = sourceResult[0];
  const sourceEmbedding = typeof sourceRow.embedding === 'string' ? JSON.parse(sourceRow.embedding) : sourceRow.embedding;
  const sourceQuestionId = sourceRow.question_id;

  // 2. Fetch all other vectors
  const vectorsSql = `SELECT question_id, embedding FROM question_vectors WHERE status = 'ready' AND question_id != ?`;
  const vectors = await safeExecute(vectorsSql, [sourceQuestionId]);

  if (vectors.length === 0) {
    return [];
  }

  // 3. Compute cosine similarity
  const scoredVectors = vectors.map(row => {
    const embedding = typeof row.embedding === 'string' ? JSON.parse(row.embedding) : row.embedding;
    const score = cosineSimilarity(sourceEmbedding, embedding);
    return { question_id: row.question_id, score };
  });

  // 4. Filter and sort
  const filtered = scoredVectors
    .filter(item => item.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);

  if (filtered.length === 0) {
    return [];
  }

  // 5. Fetch details for matched questions
  const questionIds = filtered.map(item => item.question_id);
  const placeholders = questionIds.map(() => '?').join(',');
  const detailsSql = `
    SELECT q.question_id as id, q.question_hash as questionHash, q.title, q.content, q.created_at as createdAt, q.updated_at as updatedAt,
           u.user_id, u.first_name as firstName, u.last_name as lastName,
           (SELECT COUNT(*) FROM answers a WHERE a.question_id = q.question_id) as answerCount
    FROM questions q
    JOIN users u ON q.user_id = u.user_id
    WHERE q.question_id IN (${placeholders})
  `;
  
  const questionDetails = await safeExecute(detailsSql, questionIds);

  // 6. Combine scores with details, maintaining order
  const results = filtered.map(scoredItem => {
    const detail = questionDetails.find(q => q.id === scoredItem.question_id);
    if (!detail) return null;
    return {
      id: detail.id,
      questionHash: detail.questionHash,
      title: detail.title,
      content: detail.content,
      answerCount: detail.answerCount,
      createdAt: detail.createdAt,
      updatedAt: detail.updatedAt,
      author: {
        id: detail.user_id,
        firstName: detail.firstName,
        lastName: detail.lastName
      },
      score: scoredItem.score
    };
  }).filter(Boolean);

  return results;
};
