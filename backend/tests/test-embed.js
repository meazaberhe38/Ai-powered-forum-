import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
  try {
    const response = await ai.models.embedContent({
      model: "text-embedding-004",
      contents: "test query",
    });
    console.log("Success! Embedding length:", response.embeddings?.[0]?.values?.length);
    console.log("First 5 values:", response.embeddings?.[0]?.values?.slice(0, 5));
  } catch (error) {
    console.error("Error:", error);
  }
}

test();
