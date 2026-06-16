/**
 * Fix Failed Vector Embeddings
 * 
 * This script regenerates embeddings for questions that have failed vector generation.
 * It's useful for recovering from API failures or other temporary issues.
 * 
 * Usage: node db/scripts/fix-vectors.js
 */

import { GoogleGenAI } from "@google/genai";
import { safeExecute } from "../config.js";
import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

async function generateEmbedding(text) {
  const params = {
    model: GEMINI_EMBEDDING_MODEL,
    contents: text,
  };

  const response = await ai.models.embedContent(params);
  const embedding = response.embeddings?.[0]?.values;
  
  if (!embedding || !Array.isArray(embedding)) {
    throw new Error("Embedding response did not contain values");
  }
  
  return embedding;
}

async function fixVectors() {
  try {
    console.log("🔍 Searching for failed vectors...\n");
    
    const failedVectors = await safeExecute(
      "SELECT vector_id, question_id, source_text FROM question_vectors WHERE status = 'failed'",
      []
    );
    
    if (failedVectors.length === 0) {
      console.log("✅ No failed vectors found. All vectors are ready!");
      process.exit(0);
    }
    
    console.log(`📋 Found ${failedVectors.length} failed vector(s). Starting regeneration...\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const vector of failedVectors) {
      try {
        console.log(`🔄 Processing question ID ${vector.question_id}...`);
        const embeddingValues = await generateEmbedding(vector.source_text);
        
        await safeExecute(
          "UPDATE question_vectors SET embedding = ?, status = 'ready', updated_at = CURRENT_TIMESTAMP WHERE vector_id = ?",
          [JSON.stringify(embeddingValues), vector.vector_id]
        );
        
        console.log(`✅ Successfully fixed vector for question ID ${vector.question_id}`);
        successCount++;
      } catch (err) {
        console.error(`❌ Failed to fix vector for question ID ${vector.question_id}:`, err.message);
        errorCount++;
      }
    }
    
    console.log("\n" + "=".repeat(50));
    console.log("📊 Summary:");
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors:  ${errorCount}`);
    console.log("=".repeat(50));
    
    process.exit(errorCount > 0 ? 1 : 0);
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  }
}

fixVectors();
