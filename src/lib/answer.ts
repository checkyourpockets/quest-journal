export type AnswerVerdict = "correct" | "close" | "wrong";

/** Split a gloss into the answers we will accept. Parenthetical notes are not answers. */
export function acceptedAnswers(meaning: string): string[] {
  const stripped = meaning.replace(/\([^)]*\)/g, " ");
  return stripped
    .split(/\s*(?:\/|,|;|\bor\b)\s*/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Lowercase, drop notes and punctuation, and ignore a leading article or "to ". */
export function normalizeAnswer(raw: string): string {
  let text = raw.toLowerCase().replace(/\([^)]*\)/g, " ");
  text = text.replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
  let prev = "";
  while (text && text !== prev) {
    prev = text;
    text = text.replace(/^(?:a|an|the)\s+/, "").replace(/^to\s+/, "").trim();
  }
  return text;
}

export function checkAnswer(meaning: string, input: string): AnswerVerdict {
  const given = normalizeAnswer(input);
  if (!given) return "wrong";
  const answers = acceptedAnswers(meaning).map(normalizeAnswer).filter(Boolean);
  if (!answers.length) return "wrong";
  if (answers.some((answer) => answer === given)) return "correct";
  if (answers.some((answer) => withinTypo(answer, given))) return "close";
  const givenWords = new Set(given.split(" ").filter(Boolean));
  if (answers.some((answer) => {
    const words = answer.split(" ").filter(Boolean);
    return words.length > 0 && words.every((word) => givenWords.has(word));
  })) return "close";
  return "wrong";
}

function withinTypo(answer: string, given: string): boolean {
  const letters = answer.replace(/\s/g, "").length;
  const limit = letters <= 5 ? 1 : 2;
  return levenshtein(answer, given) <= limit;
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      next[j] = Math.min(prev[j] + 1, next[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = next;
  }
  return prev[b.length];
}
