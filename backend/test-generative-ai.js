import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent("test query");
    console.log("Success! Embedding length:", result.embedding.values.length);
  } catch (error) {
    console.error("Error:", error);
  }
}

test();
