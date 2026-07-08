// Heuristic gate in front of the auto-translate API call: fire only for
// input that plausibly is a complete English term, so typos, half-typed
// words, and non-English input don't burn API quota.
export function looksLikeEnglishTerm(raw: string): boolean {
  const term = raw.trim();
  if (term.length < 3 || term.length > 60) return false;
  // Latin letters only, with single spaces/hyphens/apostrophes inside
  // ("to give up", "well-known", "o'clock") — digits or Cyrillic disqualify.
  if (!/^[a-zA-Z][a-zA-Z' -]*[a-zA-Z]$/.test(term)) return false;
  // No doubled separators ("to  go", "--") — usually mid-edit states.
  if (/[' -]{2,}/.test(term)) return false;
  // Real English words contain a vowel (y counts: "gym", "why").
  if (!/[aeiouy]/i.test(term)) return false;
  return true;
}
