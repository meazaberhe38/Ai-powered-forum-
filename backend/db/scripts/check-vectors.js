/**
 * Check Vector Embeddings Status
 * 
 * Displays the current status of all question vectors in the database.
 * Useful for debugging and monitoring vector generation.
 * 
 * Usage: node db/scripts/check-vectors.js
 */

import { safeExecute } from "../config.js";

async function checkVectors() {
  try {
    console.log("🔍 Checking vector embeddings...\n");
    
    // Get vector statistics
    const stats = await safeExecute(`
      SELECT 
        status,
        COUNT(*) as count
      FROM question_vectors
      GROUP BY status
    `, []);
    
    console.log("📊 Vector Status Summary:");
    console.log("=".repeat(50));
    
    if (stats.length === 0) {
      console.log("⚠️  No vectors found in database");
    } else {
      stats.forEach(stat => {
        const emoji = stat.status === 'ready' ? '✅' : stat.status === 'failed' ? '❌' : '⏳';
        console.log(`${emoji} ${stat.status.padEnd(10)}: ${stat.count}`);
      });
    }
    
    console.log("=".repeat(50));
    
    // Get detailed vector information
    const vectors = await safeExecute(`
      SELECT 
        qv.vector_id,
        qv.question_id,
        q.question_hash,
        qv.status,
        qv.created_at,
        qv.updated_at
      FROM question_vectors qv
      JOIN questions q ON qv.question_id = q.question_id
      ORDER BY qv.created_at DESC
      LIMIT 10
    `, []);
    
    if (vectors.length > 0) {
      console.log("\n📝 Recent Vectors (last 10):");
      console.log("=".repeat(50));
      vectors.forEach(v => {
        const emoji = v.status === 'ready' ? '✅' : v.status === 'failed' ? '❌' : '⏳';
        console.log(`${emoji} Q#${v.question_id} (${v.question_hash}) - ${v.status}`);
        console.log(`   Created: ${v.created_at}, Updated: ${v.updated_at}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkVectors();
