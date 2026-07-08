import { describe, expect, it } from "vitest";

import { looksLikeEnglishTerm } from "../../app/utils/englishTerm";

describe("looksLikeEnglishTerm", () => {
  it("accepts normal words and phrases", () => {
    for (const term of [
      "resilient",
      "to give up",
      "well-known",
      "o'clock",
      "gym",
      "why",
      "  boarding pass  ",
    ]) {
      expect(looksLikeEnglishTerm(term), term).toBe(true);
    }
  });

  it("rejects too-short, unfinished, or malformed input", () => {
    for (const term of ["", "a", "ab", "to ", "-dog", "dog-", "to  go", "well--known"]) {
      expect(looksLikeEnglishTerm(term), JSON.stringify(term)).toBe(false);
    }
  });

  it("rejects non-English input", () => {
    for (const term of ["собака", "chien123", "42", "hello!", "què", "日本語", "xkcd qwrtz"]) {
      expect(looksLikeEnglishTerm(term), term).toBe(false);
    }
  });
});
