// Simplified SM-2 spaced-repetition scheduling (the Anki family of
// algorithms). Each review gets one of three ratings; the interval to the
// next review grows with consecutive successes and shrinks on failure.

export const RATINGS = ["again", "hard", "good"] as const;
export type Rating = (typeof RATINGS)[number];

export const STUDY_MODES = ["flashcards", "choice", "typing", "match"] as const;
export type StudyMode = (typeof STUDY_MODES)[number];

export interface SrsState {
  status: string;
  ease: number;
  intervalDays: number;
  correctStreak: number;
  lapses: number;
}

const MIN_EASE = 1.3;
// A card graduates to "learned" once it survives to a three-week interval.
const LEARNED_INTERVAL_DAYS = 21;
// Failed cards come back within the same session.
const AGAIN_DELAY_MINUTES = 10;

export const NEW_CARD_STATE: SrsState = {
  status: "learning",
  ease: 2.5,
  intervalDays: 0,
  correctStreak: 0,
  lapses: 0,
};

// Matches SQLite's current_timestamp format ("YYYY-MM-DD HH:MM:SS", UTC) so
// stored timestamps stay lexicographically comparable across the schema.
export function sqlTimestamp(date: Date = new Date()): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

export function applyRating(state: SrsState, rating: Rating): SrsState & { dueAt: string } {
  let { ease, intervalDays, correctStreak, lapses } = state;

  if (rating === "again") {
    lapses += 1;
    correctStreak = 0;
    ease = Math.max(MIN_EASE, ease - 0.2);
    intervalDays = 0;
  } else if (rating === "hard") {
    correctStreak += 1;
    ease = Math.max(MIN_EASE, ease - 0.15);
    intervalDays = intervalDays < 1 ? 0.5 : intervalDays * 1.2;
  } else {
    correctStreak += 1;
    if (intervalDays < 1) intervalDays = 1;
    else if (intervalDays < 3) intervalDays = 3;
    else intervalDays = intervalDays * ease;
  }
  intervalDays = Math.round(intervalDays * 100) / 100;

  const dueMs =
    rating === "again"
      ? Date.now() + AGAIN_DELAY_MINUTES * 60 * 1000
      : Date.now() + intervalDays * 24 * 60 * 60 * 1000;

  return {
    status: intervalDays >= LEARNED_INTERVAL_DAYS ? "learned" : "learning",
    ease,
    intervalDays,
    correctStreak,
    lapses,
    dueAt: sqlTimestamp(new Date(dueMs)),
  };
}
