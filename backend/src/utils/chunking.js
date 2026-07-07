export function chunkText(text, chunkSize = 1000, overlap = 150) {
  if (typeof text !== "string") {
    throw new TypeError("text must be a string");
  }

  const normalizedChunkSize = Number(chunkSize);
  const normalizedOverlap = Number(overlap);

  if (!Number.isInteger(normalizedChunkSize) || normalizedChunkSize <= 0) {
    throw new RangeError("chunkSize must be a positive integer");
  }

  if (!Number.isInteger(normalizedOverlap) || normalizedOverlap < 0) {
    throw new RangeError("overlap must be a non-negative integer");
  }

  const effectiveOverlap = Math.min(normalizedOverlap, normalizedChunkSize - 1);
  const chunks = [];

  let start = 0;
  const textLength = text.length;

  while (start < textLength) {
    const end = start + normalizedChunkSize;
    chunks.push(text.slice(start, end));
    start = end - effectiveOverlap;
  }

  return chunks;
}
