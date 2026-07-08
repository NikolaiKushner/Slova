import { describe, expect, it } from "vitest";

import { shuffle } from "../../app/utils/shuffle";

describe("shuffle", () => {
  it("returns a permutation of the input without mutating it", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const frozen = [...input];
    const result = shuffle(input);
    expect(input).toEqual(frozen);
    expect([...result].sort((a, b) => a - b)).toEqual(frozen);
  });

  it("handles empty and single-element arrays", () => {
    expect(shuffle([])).toEqual([]);
    expect(shuffle([42])).toEqual([42]);
  });

  it("actually reorders larger arrays (statistically)", () => {
    const input = Array.from({ length: 50 }, (_, i) => i);
    const moved = Array.from({ length: 10 }, () => shuffle(input)).some(
      (result) => result.some((value, i) => value !== i),
    );
    expect(moved).toBe(true);
  });
});
