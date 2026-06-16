import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test(modelName) {
  try {
    const response = await ai.models.embedContent({
      model: modelName,
      contents: "test query",
    });
    console.log(`Success with ${modelName}! Embedding length:`, response.embeddings?.[0]?.values?.length);
  } catch (error) {
    console.error(`Error with ${modelName}:`, error.message);
  }
}

async function run() {
  await test("gemini-embedding-001");
  await test("text-embedding-004");
  await test("gemini-embedding-2-preview");
  await test("gemini-embedding-2");
}

run();
