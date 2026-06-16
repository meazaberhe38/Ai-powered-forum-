/**
 * Check Question Hashes
 * 
 * Displays question hashes for debugging URL routing issues.
 * 
 * Usage: node db/scripts/check-hashes.js [limit]
 */

import { safeExecute } from "../config.js";

async function checkHashes() {
  try {
    const limit = parseInt(process.argv[2]) || 10;
    
    console.log(`🔍 Checking question hashes (limit: ${limit})...\n`);
    
    const rows = await safeExecute(`
      SELECT 
        question_id,
        question_hash,
        title,
        created_at
      FROM questions
      ORDER BY created_at DESC
      LIMIT ?
    `, [limit]);
    
    if (rows.length === 0) {
      console.log("⚠️  No questions found in database");
    } else {
      console.log("📋 Question Hashes:");
      console.log("=".repeat(70));
      rows.forEach((row, index) => {
        console.log(`${index + 1}. ID: ${row.question_id} | Hash: ${row.question_hash}`);
        console.log(`   Title: ${row.title.substring(0, 60)}${row.title.length > 60 ? '...' : ''}`);
        console.log(`   Created: ${row.created_at}`);
        console.log("");
      });
      console.log("=".repeat(70));
      console.log(`✅ Total questions shown: ${rows.length}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkHashes();
