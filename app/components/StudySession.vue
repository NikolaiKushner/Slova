<script setup lang="ts">
export interface CardProgress {
  status: string;
  ease: number;
  intervalDays: number;
  dueAt: string;
  correctStreak: number;
  lapses: number;
}

export interface StudyCard {
  id: number;
  term: string;
  definition: string;
  progress: CardProgress | null;
}

export type Rating = "again" | "hard" | "good";
export type StudyMode = "flashcards" | "choice" | "typing" | "match";

const props = defineProps<{
  cards: StudyCard[];
  // Full set, used to draw wrong options for multiple choice.
  allCards: StudyCard[];
  mode: StudyMode;
  direction: "term-first" | "definition-first";
}>();

const emit = defineEmits<{ done: [] }>();

const queue = ref<StudyCard[]>([...props.cards]);
const index = ref(0);
const saving = ref(false);

// Summary counts the first answer per card; in-session repeats don't recount.
const firstAnswers = new Map<number, Rating>();
const summary = reactive({ good: 0, hard: 0, again: 0 });

const current = computed(() => queue.value[index.value]);
const finished = computed(() => index.value >= queue.value.length);

function front(card: StudyCard) {
  return props.direction === "term-first" ? card.term : card.definition;
}
function back(card: StudyCard) {
  return props.direction === "term-first" ? card.definition : card.term;
}

const choiceOptions = computed(() => {
  const card = current.value;
  if (!card || props.mode !== "choice") return [];
  const answer = back(card);
  const distractors = shuffle(
    [...new Set(props.allCards.map(back))].filter((text) => text !== answer),
  ).slice(0, 3);
  return shuffle([answer, ...distractors]);
});

async function recordReview(card: StudyCard, rating: Rating) {
  await $fetch(`/api/cards/${card.id}/review`, {
    method: "POST",
    body: { rating, mode: props.mode },
  });
  if (!firstAnswers.has(card.id)) {
    firstAnswers.set(card.id, rating);
    summary[rating] += 1;
  }
}

async function submit(rating: Rating) {
  const card = current.value;
  if (!card || saving.value) return;
  saving.value = true;
  try {
    await recordReview(card, rating);
    // Failed cards come back at the end of the session until answered.
    if (rating === "again") queue.value.push(card);
  } finally {
    saving.value = false;
  }
}

function advance() {
  index.value += 1;
}

async function rateAndAdvance(rating: Rating) {
  await submit(rating);
  advance();
}

// Match handles the whole queue at once, so its "next" ends the session.
function finishMatch() {
  index.value = queue.value.length;
}
</script>

<template>
  <div>
    <StudyMatch
      v-if="mode === 'match' && !finished"
      :cards="queue"
      @answered="recordReview"
      @next="finishMatch"
    />

    <template v-else-if="!finished && current">
      <div class="mb-3 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
        <span>{{ index + 1 }} / {{ queue.length }}</span>
        <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
          <div
            class="h-full bg-blue-500 transition-[width] duration-200"
            :style="{ width: `${(index / queue.length) * 100}%` }"
          />
        </div>
      </div>

      <StudyFlashcard
        v-if="mode === 'flashcards'"
        :key="`${current.id}-${index}`"
        :front="front(current)"
        :back="back(current)"
        :saving="saving"
        @rate="rateAndAdvance"
      />
      <StudyChoice
        v-else-if="mode === 'choice'"
        :key="`${current.id}-${index}`"
        :front="front(current)"
        :answer="back(current)"
        :options="choiceOptions"
        @answered="submit"
        @next="advance"
      />
      <StudyTyping
        v-else
        :key="`${current.id}-${index}`"
        :front="front(current)"
        :answer="back(current)"
        @answered="submit"
        @next="advance"
      />
    </template>

    <div v-else class="py-8 text-center">
      <h2 class="text-xl font-bold">Session complete</h2>
      <ul class="my-4 flex justify-center gap-6">
        <li class="text-green-600 dark:text-green-400">Knew it: {{ summary.good }}</li>
        <li class="text-amber-600 dark:text-amber-400">Hard: {{ summary.hard }}</li>
        <li class="text-red-600 dark:text-red-400">Didn't know: {{ summary.again }}</li>
      </ul>
      <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Cards you missed will come back sooner; cards you knew will wait longer.
      </p>
      <button type="button" class="btn btn-primary px-8" @click="emit('done')">Done</button>
    </div>
  </div>
</template>
