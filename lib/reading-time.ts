/**
 * Utility to calculate reading time based on an average reading speed
 * of 200 words per minute.
 */
export interface ReadingTimeResult {
  minutes: number;
  words: number;
  text: string;
}

export function calculateReadingTime(content: string): ReadingTimeResult {
  if (!content) {
    return { minutes: 1, words: 0, text: "1 min read" };
  }

  // Strip code blocks and markdown symbols for a more accurate word count
  const cleanText = content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/#+\s+/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();

  const words = cleanText.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));

  return {
    minutes,
    words,
    text: `${minutes} min read`,
  };
}
