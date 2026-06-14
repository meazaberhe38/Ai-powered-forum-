import { safeExecute } from "./src/db/config.js";

async function checkHashes() {
  try {
    const rows = await safeExecute("SELECT question_id, question_hash FROM questions LIMIT 10", []);
    console.log("Hashes:", rows);
  } catch (error) {
    console.error("Error:", error);
  }
}

checkHashes();
