import { describe, expect, it } from "vitest";

import {
  applyRating,
  NEW_CARD_STATE,
  NEW_CARDS_PER_DAY,
  sqlTimestamp,
  type SrsState,
} from "../../server/utils/srs";

const state = (overrides: Partial<SrsState> = {}): SrsState => ({
  ...NEW_CARD_STATE,
  ...overrides,
});

describe("sqlTimestamp", () => {
  it("matches SQLite's current_timestamp format (UTC)", () => {
    expect(sqlTimestamp(new Date("2026-07-08T09:30:15.789Z"))).toBe("2026-07-08 09:30:15");
  });

  it("stays lexicographically comparable", () => {
    const earlier = sqlTimestamp(new Date("2026-07-08T09:00:00Z"));
    const later = sqlTimestamp(new Date("2026-07-08T10:00:00Z"));
    expect(earlier < later).toBe(true);
  });
});

describe("applyRating: good", () => {
  it("walks a new card through 1 -> 3 -> interval*ease days", () => {
    const first = applyRating(state(), "good");
    expect(first.intervalDays).toBe(1);
    expect(first.correctStreak).toBe(1);

    const second = applyRating(first, "good");
    expect(second.intervalDays).toBe(3);

    const third = applyRating(second, "good");
    expect(third.intervalDays).toBeCloseTo(3 * 2.5, 5);
    expect(third.correctStreak).toBe(3);
  });

  it("keeps ease unchanged", () => {
    expect(applyRating(state(), "good").ease).toBe(2.5);
  });

  it("schedules the next review roughly intervalDays ahead", () => {
    const result = applyRating(state({ intervalDays: 3 }), "good");
    const dueMs = new Date(`${result.dueAt.replace(" ", "T")}Z`).getTime();
    const expected = Date.now() + result.intervalDays * 24 * 60 * 60 * 1000;
    expect(Math.abs(dueMs - expected)).toBeLessThan(5000);
  });
});

describe("applyRating: hard", () => {
  it("halves the first step and slows growth to 1.2x", () => {
    expect(applyRating(state(), "hard").intervalDays).toBe(0.5);
    expect(applyRating(state({ intervalDays: 10 }), "hard").intervalDays).toBeCloseTo(12, 5);
  });

  it("drops ease by 0.15 but still counts the streak", () => {
    const result = applyRating(state({ correctStreak: 2 }), "hard");
    expect(result.ease).toBeCloseTo(2.35, 5);
    expect(result.correctStreak).toBe(3);
  });
});

describe("applyRating: again", () => {
  it("resets the interval and streak and records a lapse", () => {
    const result = applyRating(
      state({ intervalDays: 10, correctStreak: 4, lapses: 1 }),
      "again",
    );
    expect(result.intervalDays).toBe(0);
    expect(result.correctStreak).toBe(0);
    expect(result.lapses).toBe(2);
  });

  it("brings the card back within the same session (~10 min)", () => {
    const result = applyRating(state(), "again");
    const dueMs = new Date(`${result.dueAt.replace(" ", "T")}Z`).getTime();
    const minutesAhead = (dueMs - Date.now()) / 60000;
    expect(minutesAhead).toBeGreaterThan(8);
    expect(minutesAhead).toBeLessThan(12);
  });

  it("never pushes ease below the 1.3 floor", () => {
    let current: SrsState = state({ ease: 1.4 });
    for (let i = 0; i < 5; i++) current = applyRating(current, "again");
    expect(current.ease).toBe(1.3);
  });
});

describe("graduation", () => {
  it("stays 'learning' below a three-week interval and graduates at it", () => {
    expect(applyRating(state({ intervalDays: 5 }), "good").status).toBe("learning"); // 12.5d
    expect(applyRating(state({ intervalDays: 8 }), "good").status).toBe("learning"); // 20d
    expect(applyRating(state({ intervalDays: 9 }), "good").status).toBe("learned"); // 22.5d
  });

  it("a lapse drops a learned card back to learning", () => {
    expect(applyRating(state({ status: "learned", intervalDays: 30 }), "again").status).toBe(
      "learning",
    );
  });
});

describe("daily new-card limit", () => {
  it("is a sane positive cap", () => {
    expect(NEW_CARDS_PER_DAY).toBeGreaterThan(0);
    expect(Number.isInteger(NEW_CARDS_PER_DAY)).toBe(true);
  });
});
